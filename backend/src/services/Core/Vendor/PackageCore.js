const AppError = require('../../../utils/AppError');
const sharp = require('sharp');
const APIFeatures = require('../../../utils/apiFeatures');
const Package = require('../../../Models/PackageModel');
const FileStorageService = require("../../Integration/FileStorageService");
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

            if (existingPackage.images && existingPackage.images.length > 0) {
                for (const image of existingPackage.images) {
                    await FileStorageService.deleteImage(image.public_id);
                }
            }

            const optimizedBuffer = await sharp(req.file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            const uploadResult = await FileStorageService.uploadImageFromBuffer(
                optimizedBuffer,
            `xenon/packages/vendor/${user.company_name}/${packageData.package_name}/${packageData.package_id}`
            );

            updateData.images = [{
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id
            }];
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

        if (packageDoc.images && packageDoc.images.length > 0) {
            for (const image of packageDoc.images) {
                await FileStorageService.deleteImage(image.public_id);
            }
        }

        await Package.findByIdAndUpdate(package_id, { isDelete: true, deletionRequestedAt: new Date() });

        return packageDoc;

    } catch (err) {
        throw new AppError(err.message, 400);
    }
}
/*
exports.createPackage = async function (req, res) {
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
                images: [{
                    url: imageUrl,
                    public_id: imagePublicId
                }],
                package_type: package_type ? package_type.toLowerCase() : package_type,
                package_status
            });
        
            return newPackage;
        } else {
            throw new AppError("image required", 400);
        }

    } catch (err) {
        throw new AppError(err.message, err.statusCode || 400);
    }
};
*/

exports.createPackage = async function (user, packageData, file) {
    try {
        const secureVendorId = user._id;

        if (!file) {
            throw new AppError("Package image is required", 400);
        }

        const packageExists = await Package.findOne({ 
            package_name: packageData.package_name,
            vendor_id: secureVendorId 
        });
        
        if (packageExists) {
            throw new AppError('You already have a package with this exact name', 400);
        }

        const optimizedBuffer = await sharp(file.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        const uploadResult = await FileStorageService.uploadImageFromBuffer(
            optimizedBuffer,
            `xenon/packages/vendor/${user.company_name}/${packageData.package_name}/${packageData.package_id}`
        );

        const newPackage = await Package.create({
            vendor_id: secureVendorId,
            package_name: packageData.package_name,
            package_price: packageData.package_price,
            package_description: packageData.package_description,
            startDate: packageData.startDate,
            endDate: packageData.endDate,
            images: [{
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id
            }],
            package_type: packageData.package_type ? packageData.package_type.toLowerCase() : packageData.package_type,
            package_status: packageData.package_status
        });

        return newPackage;

    } catch (err) {
        throw new AppError(err.message, err.statusCode || 500);
    }
};