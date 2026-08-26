require("dotenv").config({ path: "./src/config.env" });
const mongoose = require("mongoose");
const User = require("./src/Models/UserModel");
const Vendor = require("./src/Models/VendorModel");
const Package = require("./src/Models/PackageModel");

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

const seedDB = async () => {
    try {
        await mongoose.connect(DB);
        console.log("✅ DB Connected Successfully!");

        const usersData = [];
        for(let i = 1; i <= 3; i++) {
            usersData.push({
                name: `Vendor User ${i} ${generateRandomString(4)}`,
                email: `vendor${i}_${Date.now()}@example.com`,
                password: "password123",
                mobileNumber: generateRandomPhone(),
                role: "vendor",
                isActive: true,
                isEmailVerified: true
            });
        }
        const createdUsers = await User.create(usersData);
        console.log(`✅ Created 3 Vendor Users`);

        const vendorsData = [];
        for(let i = 0; i < createdUsers.length; i++) {
            vendorsData.push({
                vendor_owner_id: createdUsers[i]._id,
                vendor_email: `unique_vendor_${Date.now()}_${i}@example.com`,
                vendor_phone: generateRandomPhone(),
                vendor_address: `123 Vendor Street ${i}`,
                vendor_city: "Amman",
                vendor_state: "Amman",
                vendor_pincode: "11111",
                vendor_country: "Jordan",
                vendor_type: "Tourism Company",
                vendor_status: "active"
            });
        }
        const createdVendors = await Vendor.create(vendorsData);
        console.log(`✅ Created 3 Vendors`);

        const packagesData = [];
        let pId = 1;
        for(let i = 0; i < createdVendors.length; i++) {
            for(let j = 1; j <= 10; j++) {
                const startDate = new Date();
                startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30));
                
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + (Math.floor(Math.random() * 10) + 1));

                packagesData.push({
                    vendor_id: createdVendors[i]._id,
                    package_name: `Amazing Package ${pId} - ${generateRandomString(4)}`,
                    package_description: `This is an amazing and unforgettable experience for everyone. Join us for package ${pId}.`,
                    package_price: Math.floor(Math.random() * 500) + 50,
                    startDate: startDate,
                    endDate: endDate,
                    images: [
                        {
                            url: `https://picsum.photos/seed/${pId}/400/300`,
                            public_id: `sample_pic_${pId}`
                        }
                    ],
                    package_type: packageTypes[Math.floor(Math.random() * packageTypes.length)],
                    package_status: "active",
                    max_people: Math.floor(Math.random() * 40) + 5
                });
                pId++;
            }
        }
        
        await Package.create(packagesData);
        console.log(`✅ Created 30 Packages (10 for each Vendor)`);

        console.log("🎉 Seeding completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Seeding Error:", error);
        process.exit(1);
    }
};

seedDB();
