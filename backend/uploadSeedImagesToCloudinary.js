require("dotenv").config({ path: "./src/config.env" });
const mongoose = require("mongoose");
const Package = require("./src/Models/PackageModel");
const FileStorageService = require("./src/services/Integration/FileStorageService");

const DB = process.env.DATABASE.includes('<PASSWORD>')
    ? process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)
    : process.env.DATABASE;

const updateImages = async () => {
    try {
        await mongoose.connect(DB);
        console.log("✅ DB Connected Successfully!");

        const packages = await Package.find({});
        console.log(`Found ${packages.length} packages to update.`);

        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            
            // If the image is already a cloudinary URL, skip
            if (pkg.images && pkg.images.length > 0 && pkg.images[0].url.includes('cloudinary')) {
                continue;
            }

            console.log(`Uploading image for package ${i+1}/${packages.length}...`);
            
            try {
                const randomId = Math.floor(Math.random() * 1000);
                const imageUrl = `https://picsum.photos/seed/${randomId}/800/600`;
                
                const uploadResult = await FileStorageService.uploadImage(imageUrl, "xenon/packages/seed");
                
                pkg.images = [{
                    url: uploadResult.secure_url,
                    public_id: uploadResult.public_id
                }];
                
                // We use updateOne to bypass any other pre-save validation hook issues
                await Package.updateOne({ _id: pkg._id }, { $set: { images: pkg.images } });
                console.log(`✅ Package ${i+1} updated with Cloudinary image: ${uploadResult.secure_url}`);
            } catch (err) {
                console.error(`❌ Failed to upload for package ${i+1}:`, err.message);
            }
            
            // Sleep to avoid rate limits
            await new Promise(res => setTimeout(res, 500));
        }

        console.log("🎉 All packages updated with Cloudinary images!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

updateImages();
