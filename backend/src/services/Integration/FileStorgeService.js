const cloudinary = require("../../config/cloudinaryConfig");


// Upload image from a Buffer (used with Multer memoryStorage and Sharp)
const uploadImageFromBuffer = async function (buffer, folderName = "xenon/general") {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder: folderName },
            (error, result) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        uploadStream.end(buffer);
    });
};

// Upload image (using file path or base64)
const uploadImage = async function (image, folderName = "xenon/vendors") {
    try {
        const result = await cloudinary.uploader.upload(image, {
            folder: folderName
        }); 
        return result;
    } catch (error) {
        throw error;
    }
};

// Delete image on Cloudinary using its public_id
const deleteImage = async function (publicId) {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw error;
    }
};

// Upload and resize image to make it small for speed optimization
const makeImageSmall = async function (image, folderName = "xenon/vendors") {
    try {
        const result = await cloudinary.uploader.upload(image, {
            folder: folderName,
            width: 500,
            height: 500,
            crop: "fill"
        });
        return result;
    } catch (error) {
        throw error;
    }
};

// Optimize delivery by applying auto-format and auto-quality
const getOptimizedUrl = function (publicId) {
    try {
        return cloudinary.url(publicId, {
            fetch_format: 'auto',
            quality: 'auto'
        });
    } catch (error) {
        throw error;
    }
};

// Transform the image: auto-crop to square aspect ratio
const getAutoCropUrl = function (publicId, width = 500, height = 500) {
    try {
        return cloudinary.url(publicId, {
            crop: 'auto',
            gravity: 'auto',
            width: width,
            height: height
        });
    } catch (error) {
        throw error;
    }
};

module.exports = {
    uploadImageFromBuffer,
    uploadImage,
    deleteImage,
    makeImageSmall,
    getOptimizedUrl,
    getAutoCropUrl
};