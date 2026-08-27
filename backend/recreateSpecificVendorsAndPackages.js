require("dotenv").config({ path: "./src/config.env" });
const mongoose = require("mongoose");
const sharp = require("sharp");
const User = require("./src/Models/UserModel");
const Vendor = require("./src/Models/VendorModel");
const Package = require("./src/Models/PackageModel");
const PackageDetails = require("./src/Models/packageDetailsModels");
const FileStorageService = require("./src/services/Integration/FileStorageService");

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

const packageTypes = ['adventure', 'cultural', 'relaxation', 'historical', 'family'];
const imageCategories = ['nature', 'city', 'nightlife', 'animals', 'architecture', 'people', 'sports', 'food', 'travel', 'fashion'];

const targetVendors = [
  { email: "vendor_1787825088291_1@example.com", pass: "PasswordWUrK123!", company: "VendorCompany_A" },
  { email: "vendor_1787825089852_2@example.com", pass: "PasswordJaog123!", company: "VendorCompany_B" },
  { email: "vendor_1787825090766_3@example.com", pass: "PasswordAnUf123!", company: "VendorCompany_C" },
  { email: "vendor_1787825091746_4@example.com", pass: "PasswordDlZY123!", company: "VendorCompany_D" },
  { email: "vendor_1787825092694_5@example.com", pass: "PasswordHzbP123!", company: "VendorCompany_E" },
  { email: "vendor_1787825093547_6@example.com", pass: "PasswordYgMF123!", company: "VendorCompany_F" }
];

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

        console.log("================ RECREATING THE 6 SPECIFIC VENDORS ================\n");

        const vendorsData = [];
        
        for(let i = 0; i < targetVendors.length; i++) {
            const vData = targetVendors[i];
            
            // 1. Create User
            const user = await User.create({
                name: `Vendor User ${i+1}`,
                email: vData.email,
                password: vData.pass,
                mobileNumber: '5' + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0'),
                role: "vendor",
                isActive: true,
                isEmailVerified: true
            });

            // 2. Create Vendor
            const vendor = await Vendor.create({
                vendor_owner_id: user._id,
                vendor_company: vData.company,
                vendor_address: `123 Vendor Avenue, Block ${i+1}`,
                vendor_city: ["Amman", "Dubai", "Cairo", "Riyadh", "Doha", "Kuwait City"][i % 6],
                vendor_state: "Central",
                vendor_pincode: "12345",
                vendor_country: ["Jordan", "UAE", "Egypt", "KSA", "Qatar", "Kuwait"][i % 6],
                vendor_type: "Tourism Services",
                vendor_status: "active"
            });

            vendorsData.push(vendor);
            
            console.log(`Vendor #${i+1} Recreated -> Email: ${vData.email}`);
        }

        console.log("\n✅ Created 6 Specific Vendors successfully!");

        // 3. Create Packages
        let pId = 1;
        let createdPackagesCount = 0;
        
        for(let i = 0; i < vendorsData.length; i++) {
            const vendor = vendorsData[i];
            const safeCompanyName = vendor.vendor_company.replace(/[^a-zA-Z0-9]/g, '_');
            
            for(let j = 1; j <= 15; j++) {
                console.log(`Processing Package ${pId} (Vendor ${i+1}, Package ${j})...`);
                
                const startDate = new Date();
                startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 1);
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + (Math.floor(Math.random() * 15) + 2));

                const randomCat = imageCategories[Math.floor(Math.random() * imageCategories.length)];
                const packageName = `Explore Package ${pId} - ${generateRandomString(4)}`;
                const safePackageName = packageName.replace(/[^a-zA-Z0-9]/g, '_');
                
                // Fetch image buffer
                const randomId = Math.floor(Math.random() * 1000);
                const imageUrl = `https://picsum.photos/seed/${randomId}/800/600`;
                let imageBuffer;
                
                try {
                    const response = await fetch(imageUrl);
                    const arrayBuffer = await response.arrayBuffer();
                    imageBuffer = Buffer.from(arrayBuffer);
                } catch(err) {
                    console.log("Failed to fetch image, using a fallback empty buffer. Error:", err.message);
                    imageBuffer = Buffer.alloc(100); // very unlikely to happen with picsum
                }
                
                // Exact same optimization as PackageCore.js
                const optimizedBuffer = await sharp(imageBuffer)
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toBuffer();

                const today = new Date();
                const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
                const uploadPath = `xenon/packages/vendor/${safeCompanyName}/${safePackageName}/${safePackageName}_${formattedDate}`;
                
                let uploadResult;
                try {
                    uploadResult = await FileStorageService.uploadImageFromBuffer(optimizedBuffer, uploadPath);
                } catch(err) {
                    console.error("Cloudinary upload failed", err);
                    uploadResult = { secure_url: "", public_id: "" };
                }
                
                // Create Package
                const newPackage = await Package.create([{
                    vendor_id: vendor._id,
                    package_name: packageName,
                    package_description: `An amazing ${packageTypes[Math.floor(Math.random() * packageTypes.length)]} trip with fantastic views. ID: ${generateRandomString(6)}`,
                    package_price: Math.floor(Math.random() * 1000) + 100,
                    startDate: startDate,
                    endDate: endDate,
                    images: [
                        {
                            url: uploadResult.secure_url,
                            public_id: uploadResult.public_id
                        }
                    ],
                    package_type: packageTypes[Math.floor(Math.random() * packageTypes.length)],
                    package_status: "active",
                    max_people: Math.floor(Math.random() * 30) + 5
                }]);
                
                createdPackagesCount++;

                // Create Package Details
                const pkg = newPackage[0];
                const totalDays = Math.ceil((pkg.endDate - pkg.startDate) / (1000 * 60 * 60 * 24));
                const itinerary = [];
                for(let day = 1; day <= totalDays; day++) {
                    itinerary.push({
                        day_number: day,
                        title: `Day ${day} Adventure`,
                        activities: `Enjoying the beautiful scenery and activities on day ${day}.`
                    });
                }
                
                await PackageDetails.create([{
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
                    meeting_point: `City Center Square, ${vendor.vendor_city || 'City'}`,
                    cancellation_policy: "Standard cancellation rules apply. Please contact support for more details.",
                    important_notes: "Bring comfortable walking shoes."
                }]);

                pId++;
            }
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
