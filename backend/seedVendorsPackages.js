require("dotenv").config({ path: "./src/config.env" });
const mongoose = require("mongoose");
const User = require("./src/Models/UserModel");
const Vendor = require("./src/Models/VendorModel");
const Package = require("./src/Models/PackageModel");
const PackageDetails = require("./src/Models/packageDetailsModels");

// Database Connection
const DB = process.env.DATABASE.includes('<PASSWORD>')
    ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
    : process.env.DATABASE;

const generateRandomString = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const generateRandomPhone = () => {
    let result = '5';
    for ( let i = 0; i < 9; i++ ) {
        result += Math.floor(Math.random() * 10).toString();
    }
    return result;
};

const packageTypes = ['adventure', 'cultural', 'relaxation', 'historical', 'family'];
const imageCategories = ['nature', 'city', 'nightlife', 'animals', 'architecture', 'people', 'sports', 'food', 'travel', 'fashion'];

const seedDB = async () => {
    try {
        await mongoose.connect(DB);
        console.log("✅ DB Connected Successfully!\n");

        console.log("🧹 Cleaning up EVERYTHING (Packages, Details, Vendors, Users)...");
        await PackageDetails.deleteMany({});
        await Package.deleteMany({});
        await Vendor.deleteMany({});
        const vendorUsers = await User.find({ role: "vendor" });
        if (vendorUsers.length > 0) {
            await User.deleteMany({ _id: { $in: vendorUsers.map(u => u._id) } });
        }
        console.log("✅ Cleaned up old data!\n");

        console.log("================ NEW VENDORS CREATED ================\n");

        const vendorsData = [];
        
        for(let i = 1; i <= 6; i++) {
            const rawPassword = "Password" + generateRandomString(4) + "123!";
            const email = `vendor_${Date.now()}_${i}@example.com`;
            
            // 1. Create User
            const user = await User.create({
                name: `Vendor User ${i} ${generateRandomString(4)}`,
                email: email,
                password: rawPassword,
                mobileNumber: generateRandomPhone(),
                role: "vendor",
                isActive: true,
                isEmailVerified: true
            });

            // 2. Create Vendor
            const vendorCompany = `VendorCompany_${generateRandomString(5)}_${i}`;
            const vendor = await Vendor.create({
                vendor_owner_id: user._id,
                vendor_company: vendorCompany,
                vendor_address: `123 Vendor Avenue, Block ${i}`,
                vendor_city: ["Amman", "Dubai", "Cairo", "Riyadh", "Doha", "Kuwait City"][i % 6],
                vendor_state: "Central",
                vendor_pincode: "12345",
                vendor_country: ["Jordan", "UAE", "Egypt", "KSA", "Qatar", "Kuwait"][i % 6],
                vendor_type: "Tourism Services",
                vendor_status: "active"
            });

            vendorsData.push(vendor);
            
            console.log(`Vendor #${i}`);
            console.log(`Email: ${email}`);
            console.log(`Password: ${rawPassword}`);
            console.log("-----------------------------------------------");
        }

        console.log("\n✅ Created 6 Vendors successfully!");

        // 3. Create Packages
        let pId = 1;
        let createdPackagesCount = 0;
        
        for(let i = 0; i < vendorsData.length; i++) {
            const packagesData = [];
            for(let j = 1; j <= 15; j++) {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 1); // future date
                
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + (Math.floor(Math.random() * 15) + 2)); // 2 to 16 days duration

                const randomCat = imageCategories[Math.floor(Math.random() * imageCategories.length)];
                
                packagesData.push({
                    vendor_id: vendorsData[i]._id,
                    package_name: `Explore Package ${pId} - ${generateRandomString(4)}`,
                    package_description: `An amazing ${packageTypes[Math.floor(Math.random() * packageTypes.length)]} trip with fantastic views. ID: ${generateRandomString(6)}`,
                    package_price: Math.floor(Math.random() * 1000) + 100,
                    startDate: startDate,
                    endDate: endDate,
                    images: [
                        {
                            url: `https://loremflickr.com/640/480/${randomCat}?lock=${pId}`,
                            public_id: `pic_${pId}_${randomCat}`
                        }
                    ],
                    package_type: packageTypes[Math.floor(Math.random() * packageTypes.length)],
                    package_status: "active",
                    max_people: Math.floor(Math.random() * 30) + 5
                });
                pId++;
            }
            
            // Create packages for this vendor
            const createdPackages = await Package.create(packagesData);
            createdPackagesCount += createdPackages.length;
            
            // Create package details for each created package
            const detailsData = createdPackages.map((pkg) => {
                const totalDays = Math.ceil((pkg.endDate - pkg.startDate) / (1000 * 60 * 60 * 24));
                const itinerary = [];
                for(let day = 1; day <= totalDays; day++) {
                    itinerary.push({
                        day_number: day,
                        title: `Day ${day} Adventure`,
                        activities: `Enjoying the beautiful scenery and activities on day ${day}.`
                    });
                }
                
                return {
                    package_id: pkg._id,
                    itinerary: itinerary.length > 0 ? itinerary : [{ day_number: 1, title: 'Day 1', activities: 'Arrival and setup' }],
                    included_services: [
                        { title: "Transport", description: "Internal transportation included" },
                        { title: "Guide", description: "Professional tour guide" }
                    ],
                    excluded_services: [
                        { title: "Flights", description: "International flights not included" },
                        { title: "Personal Expenses", description: "Souvenirs and snacks" }
                    ],
                    meeting_point: `City Center Square, ${vendorsData[i].vendor_city || 'City'}`,
                    // location_coordinates is omitted because of DB schema conflict
                    cancellation_policy: "Standard cancellation rules apply. Please contact support for more details.",
                    important_notes: "Bring comfortable walking shoes."
                };
            });
            
            await PackageDetails.create(detailsData);
        }
        
        console.log(`\n✅ Created ${createdPackagesCount} Packages with Details successfully`);

        console.log("🎉 Seeding completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Seeding Error:", error);
        process.exit(1);
    }
};

seedDB();
