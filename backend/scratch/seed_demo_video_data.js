// One-off local demo data seeder — creates a full Admin/Vendor/Client dataset
// for a walkthrough video. Connects ONLY to DATABASE_LOCAL, never Atlas.
// Re-runnable: deletes previously-seeded "Demo " records first, then recreates them.
require("dotenv").config({ path: require("path").join(__dirname, "..", "src", "config.env") });
const mongoose = require("mongoose");

const DB = process.env.DATABASE_LOCAL;
if (!DB || !DB.startsWith("mongodb://localhost") && !DB.startsWith("mongodb://127.0.0.1")) {
    console.error("❌ Refusing to run: DATABASE_LOCAL is not a localhost URI:", DB);
    process.exit(1);
}

const User = require("../src/Models/UserModel");
const Vendor = require("../src/Models/VendorModel");
const Package = require("../src/Models/PackageModel");
const PackageDetails = require("../src/Models/packageDetailsModels");
const Booking = require("../src/Models/BookingModel");
const BookingPayment = require("../src/Models/BookingPaymentModels");
const Review = require("../src/Models/ReviewModel");
const Complaint = require("../src/Models/ComplaintModel");
const Employee = require("../src/Models/EmployeeModels");
const Notification = require("../src/Models/NotificationModel");
const VendorSubscription = require("../src/Models/VendorSubscriptionModels");
const VendorVerification = require("../src/Models/VendorVerificationModel");
const Report = require("../src/Models/ReportsModels");

const DEMO_EMAIL_DOMAIN = "demoxenon.example.com";
const DEMO_PASSWORD = "DemoPass123!";
let phoneCounter = 9000000000;
const nextPhone = () => String(++phoneCounter);
const img = (seed) => ({ url: `https://picsum.photos/seed/${seed}/800/600`, public_id: `demo/${seed}` });

const credentials = [];

async function cleanupPreviousDemoData() {
    console.log("🧹 Removing previously-seeded demo data (if any)...");
    const demoUsers = await User.find({ email: new RegExp(`@${DEMO_EMAIL_DOMAIN}$`, "i") }).select("_id");
    const userIds = demoUsers.map((u) => u._id);
    const demoVendors = await Vendor.find({ vendor_company: /^Demo /i }).select("_id");
    const vendorIds = demoVendors.map((v) => v._id);
    const demoPackages = await Package.find({ package_name: /^Demo /i }).select("_id");
    const packageIds = demoPackages.map((p) => p._id);

    await Notification.deleteMany({ $or: [{ user_id: { $in: userIds } }, { vendor_id: { $in: vendorIds } }] });
    await Report.deleteMany({ $or: [{ reporter: { $in: userIds } }, { reported_user: { $in: userIds } }] });
    await Complaint.deleteMany({ user_id: { $in: userIds } });
    await Review.deleteMany({ user_id: { $in: userIds } });
    await BookingPayment.deleteMany({ user_id: { $in: userIds } });
    await Booking.deleteMany({ user_id: { $in: userIds } });
    await Employee.deleteMany({ user_id: { $in: userIds } });
    await VendorSubscription.deleteMany({ vendor_id: { $in: vendorIds } });
    await VendorVerification.deleteMany({ vendor_id: { $in: vendorIds } });
    await PackageDetails.deleteMany({ package_id: { $in: packageIds } });
    await Package.deleteMany({ _id: { $in: packageIds } });
    await Vendor.deleteMany({ _id: { $in: vendorIds } });
    await User.deleteMany({ _id: { $in: userIds } });
    console.log("✅ Cleanup done.\n");
}

async function dropStaleVendorEmailIndex() {
    try {
        await Vendor.collection.dropIndex("vendor_email_1");
        console.log("🗑️  Dropped stale local-only index vendors.vendor_email_1 (not part of the current schema; was blocking multi-vendor inserts).\n");
    } catch (e) {
        if (e.codeName !== "IndexNotFound") console.log("(index drop skipped:", e.message, ")");
    }
}

function makeUser({ name, role, gender, dob, position }) {
    const email = `${name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@${DEMO_EMAIL_DOMAIN}`;
    return {
        doc: {
            name: `Demo ${name}`,
            email,
            password: DEMO_PASSWORD,
            mobileNumber: nextPhone(),
            role,
            gender,
            DateOfBirth: dob,
            isActive: true,
            isEmailVerified: true,
        },
        email,
        password: DEMO_PASSWORD,
        role,
        position,
    };
}

async function run() {
    await mongoose.connect(DB);
    console.log(`✅ Connected to LOCAL DB → ${DB}\n`);

    await dropStaleVendorEmailIndex();
    await cleanupPreviousDemoData();

    // ---------- ADMINS ----------
    console.log("👑 Creating admin accounts...");
    const adminSpecs = [
        makeUser({ name: "Admin Manager", role: "admin", position: "manager" }),
        makeUser({ name: "Admin Support", role: "admin", position: "customer-support" }),
    ];
    const admins = [];
    for (const spec of adminSpecs) {
        const user = await new User(spec.doc).save();
        await Employee.create({ user_id: user._id, position: spec.position, workSystem: "full-time", salary: 1200, job_active: true });
        admins.push(user);
        credentials.push({ role: "Admin", label: spec.doc.name, email: spec.email, password: spec.password });
    }
    const mainAdmin = admins[0];

    // ---------- TRAVELLERS ----------
    console.log("🧳 Creating traveller (client) accounts...");
    const travellerSpecs = [1, 2, 3, 4, 5].map((i) =>
        makeUser({
            name: `Traveller ${i}`,
            role: "user",
            gender: i % 2 === 0 ? "female" : "male",
            dob: new Date(1990 + i, i, 10),
        })
    );
    const travellers = [];
    for (const spec of travellerSpecs) {
        const user = await new User(spec.doc).save();
        travellers.push(user);
        credentials.push({ role: "Traveller", label: spec.doc.name, email: spec.email, password: spec.password });
    }

    // ---------- VENDORS ----------
    console.log("🏪 Creating vendors (active / pending / rejected)...");

    async function createVendor({ label, city, country, status, withStaff, rejectionReason }) {
        const ownerSpec = makeUser({ name: `${label} Owner`, role: status === "active" ? "vendor" : "user", gender: "male", dob: new Date(1985, 3, 15) });
        const owner = await new User(ownerSpec.doc).save();

        const vendor = await Vendor.create({
            vendor_owner_id: owner._id,
            vendor_company: `Demo ${label}`,
            vendor_address: `${Math.floor(Math.random() * 90) + 10} King Hussein St.`,
            vendor_city: city,
            vendor_state: "Central",
            vendor_pincode: "11190",
            vendor_country: country,
            vendor_type: "Tourism Services",
            vendor_status: status,
            ...(status === "rejected" ? { rejection_reason: rejectionReason, action_by_admin: mainAdmin._id } : {}),
        });

        await VendorVerification.create({
            vendor_id: vendor._id,
            commercial_register_image: img(`${label}-cr`),
            vocational_license_image: img(`${label}-vl`),
            tourism_license_image: status === "active" ? img(`${label}-tl`) : null,
            owner_id_image: img(`${label}-id`),
            iban_letter_image: img(`${label}-iban`),
            iban_number: `JO${Math.floor(10000000000000000 + Math.random() * 89999999999999999)}`,
            admin_notes: status === "rejected" ? rejectionReason : status === "active" ? "Verified — all documents valid." : null,
            reviewed_by: status === "pending_approval" ? null : mainAdmin._id,
        });

        credentials.push({ role: `Vendor owner (${status})`, label: ownerSpec.doc.name, email: ownerSpec.email, password: ownerSpec.password });

        let staff = [];
        if (withStaff) {
            const positions = ["tour-guide", "driver"];
            for (const pos of positions) {
                const staffSpec = makeUser({ name: `${label} ${pos}`, role: "vendor" });
                const staffUser = await new User(staffSpec.doc).save();
                const emp = await Employee.create({
                    user_id: staffUser._id,
                    vendor_id: vendor._id,
                    position: pos,
                    workSystem: "full-time",
                    salary: 600,
                    job_active: true,
                });
                staff.push(emp);
                credentials.push({ role: `Vendor staff (${pos})`, label: staffSpec.doc.name, email: staffSpec.email, password: staffSpec.password });
            }
        }

        if (status === "active") {
            await VendorSubscription.create({
                vendor_id: vendor._id,
                amount: 250,
                payment_method: "OnlineGateway",
                payment_status: "Verified",
                subscription_start_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                subscription_end_date: new Date(Date.now() + 355 * 24 * 60 * 60 * 1000),
                subscription_status: "Active",
                transaction_id: `TXN-${vendor._id}`.slice(0, 40),
                verified_by: mainAdmin._id,
                verified_at: new Date(),
            });
        } else if (status === "pending_approval") {
            await VendorSubscription.create({
                vendor_id: vendor._id,
                amount: 250,
                payment_method: "ManualBankTransfer",
                payment_status: "Pending",
                subscription_status: "PendingPayment",
            });
        }

        return { vendor, owner, staff };
    }

    const heroVendor = await createVendor({ label: "Petra Adventures", city: "Amman", country: "Jordan", status: "active", withStaff: true });
    const secondVendor = await createVendor({ label: "Aqaba Divers", city: "Aqaba", country: "Jordan", status: "active", withStaff: false });
    const pendingVendor = await createVendor({ label: "Wadi Rum Trekkers", city: "Wadi Rum", country: "Jordan", status: "pending_approval", withStaff: false });
    const rejectedVendor = await createVendor({ label: "Dead Sea Escapes", city: "Dead Sea", country: "Jordan", status: "rejected", withStaff: false, rejectionReason: "Commercial register document was expired." });

    // ---------- PACKAGES ----------
    console.log("📦 Creating packages...");
    const packageTypes = ["adventure", "cultural", "relaxation", "historical", "family"];

    async function createPackagesFor(vendor, count, labelPrefix) {
        const created = [];
        for (let i = 1; i <= count; i++) {
            const startDate = new Date(Date.now() + (7 + i * 3) * 24 * 60 * 60 * 1000);
            const endDate = new Date(startDate.getTime() + (2 + (i % 5)) * 24 * 60 * 60 * 1000);
            const pkg = await Package.create({
                vendor_id: vendor._id,
                package_name: `Demo ${labelPrefix} Package ${i}`,
                package_description: `A ${packageTypes[i % packageTypes.length]} experience exploring the best of Jordan — trip ${i}.`,
                package_price: 150 + i * 35,
                startDate,
                endDate,
                images: [img(`${labelPrefix}-pkg-${i}-a`), img(`${labelPrefix}-pkg-${i}-b`)],
                package_type: packageTypes[i % packageTypes.length],
                package_status: i === count ? "inactive" : "active",
                max_people: 10 + i,
            });
            const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            const itinerary = Array.from({ length: totalDays }, (_, d) => ({
                day_number: d + 1,
                title: `Day ${d + 1}`,
                activities: `Guided activities and sightseeing for day ${d + 1} of the ${labelPrefix} trip.`,
            }));
            await PackageDetails.create({
                package_id: pkg._id,
                itinerary,
                included_services: [{ title: "Transport", description: "Private AC vehicle" }, { title: "Guide", description: "English-speaking guide" }],
                excluded_services: [{ title: "Flights", description: "International flights not included" }],
                meeting_point: `${vendor.vendor_city} City Center`,
                cancellation_policy: "Full refund up to 48 hours before departure.",
                important_notes: "Bring comfortable walking shoes and sun protection.",
            });
            created.push(pkg);
        }
        return created;
    }

    const heroPackages = await createPackagesFor(heroVendor.vendor, 8, "Petra");
    const secondPackages = await createPackagesFor(secondVendor.vendor, 4, "Aqaba");

    // ---------- BOOKINGS + PAYMENTS + REVIEWS ----------
    console.log("🗓️  Creating bookings, payments, and reviews...");
    const bookingPlans = [
        { status: "pending_payment", paymentStatus: null },
        { status: "pending", paymentStatus: "Pending" },
        { status: "accepted", paymentStatus: "Verified" },
        { status: "completed", paymentStatus: "Verified", withReview: "accepted" },
        { status: "completed", paymentStatus: "Verified", withReview: "in-progress" },
        { status: "cancelled", paymentStatus: "Cancelled" },
        { status: "rejected", paymentStatus: "Rejected" },
    ];

    for (let i = 0; i < bookingPlans.length; i++) {
        const plan = bookingPlans[i];
        const traveller = travellers[i % travellers.length];
        const pkg = heroPackages[i % heroPackages.length];
        const numPeople = 1 + (i % 4);
        const booking = await Booking.create({
            user_id: traveller._id,
            vendor_id: heroVendor.vendor._id,
            package_id: pkg._id,
            booking_date: pkg.startDate,
            number_of_people: numPeople,
            creator_role: "user",
            booked_by: traveller._id,
            booking_source: "CustomerApp",
            status: plan.status,
            total_price: pkg.package_price * numPeople,
            // Give the pending_payment demo booking a long runway so the cron job
            // (auto-cancels expired pending_payment bookings) doesn't flip it mid-recording.
            payment_deadline: plan.status === "pending_payment" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
            cancelled_by: plan.status === "cancelled" ? traveller._id : null,
            status_history: [{ status: plan.status, changed_by: traveller._id, changed_at: new Date() }],
        });

        if (plan.paymentStatus) {
            const method = i % 2 === 0 ? "CliQ" : "Cash";
            await BookingPayment.create({
                user_id: traveller._id,
                vendor_id: heroVendor.vendor._id,
                booking_id: booking._id,
                amount: booking.total_price,
                payment_method: method,
                payment_status: plan.paymentStatus,
                receipt_image: method === "CliQ" ? img(`payment-${i}`) : undefined,
                payment_description: `Payment for booking ${booking._id}`,
                rejection_reason: plan.paymentStatus === "Rejected" ? "Receipt image did not match the amount." : undefined,
                verified_at: plan.paymentStatus === "Verified" ? new Date() : undefined,
            });
        }

        if (plan.withReview) {
            await Review.create({
                user_id: traveller._id,
                vendor_id: heroVendor.vendor._id,
                package_id: pkg._id,
                booking_id: booking._id,
                review_text:
                    plan.withReview === "accepted"
                        ? "Amazing trip, the guide was fantastic and everything was well organized!"
                        : "Good overall experience, still waiting on a couple of follow-up questions.",
                review_rating: plan.withReview === "accepted" ? 5 : 4,
                review_status: plan.withReview,
                vendor_reply: plan.withReview === "accepted" ? "Thank you so much for the kind words!" : null,
                vendor_replied_at: plan.withReview === "accepted" ? new Date() : null,
            });
        }
    }

    // ---------- COMPLAINTS ----------
    console.log("📮 Creating complaints...");
    const complaintPlans = [
        { status: "pending", priority: "high", type: "Service Quality" },
        { status: "accepted", priority: "medium", type: "Billing Issue" },
        { status: "rejected", priority: "low", type: "Package Mismatch" },
        { status: "completed", priority: "critical", type: "Safety Concern" },
    ];
    for (let i = 0; i < complaintPlans.length; i++) {
        const plan = complaintPlans[i];
        const traveller = travellers[i % travellers.length];
        await Complaint.create({
            user_id: traveller._id,
            vendor_id: heroVendor.vendor._id,
            complaint_type: plan.type,
            complaint_title: `${plan.type} on recent booking`,
            complaint_message: `Demo complaint describing a ${plan.type.toLowerCase()} issue for the video walkthrough.`,
            complaint_priority: plan.priority,
            complaint_status: plan.status,
            admin_response: plan.status === "completed" ? "Issue resolved and refund processed." : null,
        });
    }

    // ---------- REPORTS ----------
    console.log("🚩 Creating moderation reports...");
    await Report.create([
        {
            reporter: travellers[0]._id,
            reported_user: heroVendor.owner._id,
            content_type: "Vendor",
            content_id: heroVendor.vendor._id,
            reason: "inappropriate_content",
            description: "Demo report: listing photos looked misleading.",
            status: "pending",
        },
        {
            reporter: travellers[1]._id,
            reported_user: travellers[2]._id,
            content_type: "Review",
            content_id: heroPackages[0]._id,
            reason: "spam",
            description: "Demo report: suspected fake review.",
            status: "resolved",
            resolved_by: mainAdmin._id,
            action_taken: "dismiss",
        },
    ]);

    // ---------- NOTIFICATIONS ----------
    console.log("🔔 Creating notifications...");
    const notifTargets = [mainAdmin, heroVendor.owner, ...travellers.slice(0, 3)];
    const notifTypes = ["booking", "complaint", "feedback", "system_alert", "broadcast"];
    const notifDocs = notifTargets.flatMap((u, idx) =>
        notifTypes.map((type, j) => ({
            user_id: u._id,
            title: `Demo ${type} notification`,
            notification_type: type,
            notification_message: `This is a demo ${type} notification for the walkthrough video.`,
            is_read: (idx + j) % 2 === 0,
        }))
    );
    await Notification.create(notifDocs);

    console.log("\n🎉 Demo dataset ready!\n");
    console.log("================ LOGIN CREDENTIALS ================");
    for (const c of credentials) {
        console.log(`${c.role.padEnd(24)} ${c.label.padEnd(28)} ${c.email.padEnd(40)} ${c.password}`);
    }
    console.log("=====================================================\n");

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(async (err) => {
    console.error("❌ Seeding failed:", err);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
});
