const AppError = require('../../../utils/AppError');
const APIFeatures = require('../../../utils/apiFeatures');
const Package = require('../../../Models/PackageModel');
const cloudinary = require('../../../utils/cloudinary');
const FileStorgeService = require("../../../utils/FileStorgeService");
const multer = require("multer");
const sharp = require("sharp");
exports.getAllPackages = async function (req, res) {
    try{
    const packages = await APIFeatures(Package.find(), req.query).filter().sort().limitFields().paginate().query;
    return packages;
    }
    catch(err){
        throw AppError(err.message, 400);
    }
}

exports.getPackage = async function (req, res, package_id) {
    try{
    const package = await APIFeatures(Package.findById(package_id), req.query).filter().sort().limitFields().paginate().query;
    return package;
    }
    catch(err){
        throw AppError(err.message, 400);
    }
}

exports.updatePackage = async function (req, res, package_id) {
    try {
        const existingPackage = await Package.findById(package_id);
        if (!existingPackage) {
            throw new AppError('الباقة غير موجودة', 404);
        }

        const updateData = {};
        const allowedFields = [
            'package_name', 'package_price', 'package_description', 
            'package_type', 'package_status', 'startDate', 'endDate'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (req.file) {
            
            if (existingPackage.package_image_id) {
                await FileStorgeService.deleteImage(existingPackage.package_image_id);
            }

            const optimizedBuffer = await sharp(req.file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            const uploadResult = await FileStorgeService.uploadImageFromBuffer(
                optimizedBuffer, 
                "xenon/packages"
            );

            updateData.package_image = uploadResult.secure_url;
            updateData.package_image_id = uploadResult.public_id;
        }

        if (Object.keys(updateData).length === 0) {
            return existingPackage; 
        }

        const updatedPackage = await Package.findByIdAndUpdate(
            package_id, 
            { $set: updateData }, 
            { 
                new: true,          
                runValidators: true 
            }
        );

        return updatedPackage;
        
    } catch (err) {
        throw new AppError(err.message, 400);
    }
}

exports.deletePackageCore = async function (req, res, package_id) {
    try {
        const packageDoc = await Package.findById(package_id);
        if (!packageDoc) {
            throw new AppError('the package is not found ', 404);
        }

        if (packageDoc.package_image_id) {
            await FileStorgeService.deleteImage(packageDoc.package_image_id);
        }

        await Package.findByIdAndUpdate(package_id , { isDelete: true, deletionRequestedAt: new Date() });

        return packageDoc;
        
    } catch (err) {
        throw new AppError(err.message, 400);
    }
}
exports.createPackage = async function (req, res) {
    try {
        const {package_name, package_price, package_description, package_type, package_status, startDate, endDate} = req.body;

        let imageUrl = '';
        let imagePublicId = '';

        if (req.file) {
            const optimizedBuffer = await sharp(req.file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            const uploadResult = await FileStorgeService.uploadImageFromBuffer(
                optimizedBuffer, 
                "xenon/packages" 
            );
            
            imageUrl = uploadResult.secure_url;
            imagePublicId = uploadResult.public_id; 
        } else {
             throw new AppError("image required", 400);
        }

        const newPackage = await Package.create({
            package_name,
            package_price,
            package_description,
            startDate,
            endDate,
            package_image: imageUrl, 
            package_image_id: imagePublicId, 
            package_type,
            package_status
        });

        return newPackage;
        
    } catch (err) {
        throw new AppError(err.message, 400);
    }
}