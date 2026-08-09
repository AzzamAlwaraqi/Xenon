const AppError = require('../../../utils/AppError');
const sharp = require('sharp');
const APIFeatures = require('../../../utils/apiFeatures');
const Package = require('../../../Models/PackageModel');
const FileStorageService = require("../../Integration/FileStorgeService");
const multer = require("multer");

exports.getAllPackages = async function (req, res) {
    try {
        const features = new APIFeatures(Package.find(), req.query).filter().sort().limitFields().paginate();
        const packages = await features.query;
        return packages;
    } catch (err) {
        throw new AppError(err.message, 400);
    }
}

exports.getPackage = async function (req, res, package_id) {
    try {
        let query = Package.findById(package_id);

        if (req.query.fields) {
            const fields = req.query.fields.split(',').join(' ');
            query = query.select(fields);
        } else {
            query = query.select('-__v');
        }

        const packageDoc = await query;

        if (!packageDoc) {
            throw new AppError('the package is not found', 404);
        }

        return packageDoc;

    } catch (err) {
        throw new AppError(err.message, 400);
    }
}

exports.updatePackage = async function (req, res, package_id) {
    try {
        const existingPackage = await Package.findById(package_id);
        if (!existingPackage) {
            throw new AppError('this package is not found ', 404);
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
                await FileStorageService.deleteImage(existingPackage.package_image_id);
            }

            const optimizedBuffer = await sharp(req.file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            const uploadResult = await FileStorageService.uploadImageFromBuffer(
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
            await FileStorageService.deleteImage(packageDoc.package_image_id);
        }

        await Package.findByIdAndUpdate(package_id, { isDelete: true, deletionRequestedAt: new Date() });

        return packageDoc;

    } catch (err) {
        throw new AppError(err.message, 400);
    }
}

exports.createPackage = async function (req, res, next) {
    try {
        const { 
            vendor_id,
            package_name, 
            package_price, 
            package_description, 
            package_type, 
            package_status,
            startDate, 
            endDate 
        } = req.body;

        let imageUrl = '';
        let imagePublicId = '';

        if (req.file) {
            const optimizedBuffer = await sharp(req.file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            const uploadResult = await FileStorageService.uploadImageFromBuffer(
                optimizedBuffer,
                "xenon/packages"
            );

            imageUrl = uploadResult.secure_url;
            imagePublicId = uploadResult.public_id;

            const packageExists = await Package.findOne({ package_name });
        
            if (packageExists) {
                throw new AppError('package with this name already exists', 400);
            }
        
            // Create new package
            const newPackage = await Package.create({
                vendor_id,
                package_name,
                package_price,
                package_description,
                startDate,
                endDate,
                package_image: imageUrl,
                package_image_id: imagePublicId,
                package_type: package_type ? package_type.toLowerCase() : package_type,
                package_status
            });
        
            return newPackage;
        } else {
            throw new AppError("image required", 400);
        }

    } catch (err) {
        // إذا كنت تستخدم Global Error Handler في Express
        // next(err); 
        // أو إذا كنت تعتمد على رمي الخطأ مباشرة:
        throw new AppError(err.message, err.statusCode || 400);
    }
};