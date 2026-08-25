const mongoose = require("mongoose");
const AppError = require('../../../utils/AppError');
const sharp = require('sharp');
const APIFeatures = require('../../../utils/apiFeatures');
const Package = require('../../../Models/PackageModel');
const PackageDetails = require('../../../Models/packageDetailsModels'); // 🌟 استيراد جدول التفاصيل
const FileStorageService = require("../../Integration/FileStorageService");
const { checkRole } = require("../../../utils/checkvalidete");

// ==========================================
// 🛡️ HELPER: Check Package Ownership
// ==========================================
const checkPackageOwnership = (userOrVendor, packageDoc) => {
    if (checkRole(userOrVendor.role, ["admin"])) return true;
    if (checkRole(userOrVendor.role, ["vendor"])) {
        const vendorId = packageDoc.vendor_id && packageDoc.vendor_id._id 
            ? packageDoc.vendor_id._id.toString() 
            : (packageDoc.vendor_id ? packageDoc.vendor_id.toString() : null);
            
        // Allow if it matches Vendor ID, OR if it matches the Vendor's Owner (User) ID
        if (vendorId !== userOrVendor._id.toString() && vendorId !== userOrVendor.vendor_owner_id?.toString()) {
            console.log("OWNERSHIP FAILED!");
            console.log("Package vendorId:", vendorId);
            console.log("userOrVendor._id:", userOrVendor._id.toString());
            console.log("userOrVendor.vendor_owner_id:", userOrVendor.vendor_owner_id?.toString());
            throw new AppError("You do not have permission to modify or delete this package", 403);
        }
    } else {
        throw new AppError("Only vendors or admins can manage packages", 403);
    }
};

// ==========================================
// 1. CORE: Get All Packages (خفيفة وسريعة للواجهة)
// ==========================================
exports.getAllPackagesCore = async function (queryString) {
    try {
        const baseFilter = { startDate: { $gt: new Date() } };

        // 1. Prepare filter for countDocuments (to include package_type and other filters)
        const queryObj = { ...queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'keyword', 'search'];
        excludedFields.forEach(el => delete queryObj[el]);
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        const finalFilter = { ...baseFilter, ...JSON.parse(queryStr) };

        // 🔍 Add Search Functionality by Package Name
        if (queryString.keyword || queryString.search) {
            const searchTerm = queryString.keyword || queryString.search;
            finalFilter.package_name = { $regex: searchTerm, $options: 'i' };
        }

        // 2. Count total documents matching the filters (before pagination)
        const totalDocuments = await Package.countDocuments(finalFilter);

        // 3. Apply features (filter, sort, select, paginate)
        const baseQuery = Package.find(baseFilter).populate('vendor_id', 'vendor_company vendor_email -_id');
        
        const features = new APIFeatures(baseQuery, queryString)
            .filter()
            .sort()
            .limitFields()
            .paginate();
            
        const packages = await features.query;

        // 4. Calculate pagination metadata
        const page = parseInt(queryString.page, 10) || 1;
        const limit = parseInt(queryString.limit, 10) || 15;
        const totalPages = Math.ceil(totalDocuments / limit);

        return { 
            count: packages.length, 
            pagination: {
                currentPage: page,
                limit: limit,
                totalPages: totalPages,
                totalDocuments: totalDocuments,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
                nextPage: page < totalPages ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null
            },
            data: packages 
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 2. CORE: Get Single Package (مع التفاصيل الكاملة)
// ==========================================
exports.getPackageCore = async function (packageId, queryString = {}) {
    try {
        let query = Package.findOne({ _id: packageId })
                           .populate('vendor_id', 'vendor_company vendor_email vendor_mobile -_id')
                           .populate('details'); // 🌟 السحر هنا: جلب كل التفاصيل من الجدول الآخر

        if (queryString.fields) {
            const fields = queryString.fields.split(',').join(' ');
            query = query.select(fields);
        } else {
            query = query.select('-__v');
        }

        const packageDoc = await query;

        if (!packageDoc) {
            throw new AppError('The package is not found or has been deleted', 404);
        }

        return packageDoc;
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 3. CORE: Create Package (مع الـ Transactions)
// ==========================================
exports.createPackageCore = async function (user, packageData, file) {
    let uploadedImagePublicId = null; // للتنظيف في حال الفشل
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (!checkRole(user.role, ["vendor", "admin"])) {
            throw new AppError("Only vendors and admins can create packages. You are logged in as a regular user.", 403);
        }

        const secureVendorId = user._id;
        const vendorName = user.vendor_company || user.name || 'Vendor';

        if (!file) throw new AppError("Package image is required", 400);

        const activePackageExists = await Package.findOne({ 
            package_name: packageData.package_name,
            vendor_id: secureVendorId,
            package_status: 'active', 
            isDeleted: { $ne: true }
        }).session(session);
        
        if (activePackageExists) {
            throw new AppError(`You cannot create this package. You already have an ACTIVE package named "${packageData.package_name}".`, 409);
        }

        // 🌟 1. رفع الصورة
        const optimizedBuffer = await sharp(file.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        const safeCompanyName = vendorName.replace(/[^a-zA-Z0-9]/g, '_');
        const safePackageName = packageData.package_name.replace(/[^a-zA-Z0-9]/g, '_');
        const today = new Date();
        const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
        const uploadPath = `xenon/packages/vendor/${safeCompanyName}/${safePackageName}/${safePackageName}_${formattedDate}`;
        const uploadResult = await FileStorageService.uploadImageFromBuffer(optimizedBuffer, uploadPath);
        
        uploadedImagePublicId = uploadResult.public_id; 

        // 🌟 2. إنشاء الباقة الأساسية
        const newPackage = await Package.create([{
            vendor_id: secureVendorId,
            package_name: packageData.package_name,
            package_price: packageData.package_price,
            package_description: packageData.package_description,
            startDate: packageData.startDate,
            endDate: packageData.endDate,
            max_people: packageData.max_people, 
            images: [{
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id
            }],
            package_type: packageData.package_type ? packageData.package_type.toLowerCase() : packageData.package_type,
            package_status: packageData.package_status || 'active'
        }], { session });

        // 🌟 3. إنشاء تفاصيل الباقة وربطها
        await PackageDetails.create([{
            package_id: newPackage[0]._id, // الربط الوثيق
            itinerary: packageData.itinerary,
            included_services: packageData.included_services,
            excluded_services: packageData.excluded_services,
            meeting_point: packageData.meeting_point,
            location_coordinates: packageData.location_coordinates,
            cancellation_policy: packageData.cancellation_policy,
            important_notes: packageData.important_notes
        }], { session });

        await session.commitTransaction();
        session.endSession();

        return newPackage[0];
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        // 🌟🌟 هندسة الطوارئ (Emergency Cleanup)
        if (uploadedImagePublicId) {
            await FileStorageService.deleteImage(uploadedImagePublicId).catch(e => console.error("Cloud cleanup failed:", e));
        }

        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 4. CORE: Update Package (تحديث الجدولين)
// ==========================================
exports.updatePackageCore = async function (userOrVendor, packageId, updateData, file) {
    let newUploadedImageId = null;
    let oldImagesToDelete = []; 
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const existingPackage = await Package.findById(packageId).session(session);
        if (!existingPackage) {
            throw new AppError('This package is not found', 404);
        }

        checkPackageOwnership(userOrVendor, existingPackage);

        const packageUpdates = {};
        const detailsUpdates = {};
        
        // 1. Date Logic Validation
        const finalStartDate = updateData.startDate || existingPackage.startDate;
        const finalEndDate = updateData.endDate || existingPackage.endDate;
        if (finalStartDate && finalEndDate && new Date(finalStartDate) >= new Date(finalEndDate)) {
            throw new AppError("The end date cannot be before or equal to the start date", 400);
        }
        
        // 2. فصل البيانات: Package vs PackageDetails
        const packageFields = ['startDate', 'endDate', 'package_name', 'package_price', 'package_description', 'package_type', 'package_status'];
        const detailsFields = ['itinerary', 'included_services', 'excluded_services', 'meeting_point', 'location_coordinates', 'cancellation_policy', 'important_notes'];

        packageFields.forEach(field => {
            if (updateData[field] !== undefined) packageUpdates[field] = updateData[field];
        });

        detailsFields.forEach(field => {
            if (updateData[field] !== undefined) detailsUpdates[field] = updateData[field];
        });

        // 3. Smart Capacity Management
        if (updateData.max_people !== undefined && updateData.max_people !== existingPackage.max_people) {
            const newMax = parseInt(updateData.max_people, 10);
            const capacityDifference = newMax - existingPackage.max_people;
            const newAvailableSeats = existingPackage.available_seats + capacityDifference;
            
            if (newAvailableSeats < 0) {
                throw new AppError(`Cannot reduce max_people to ${newMax}. Existing bookings exceed this limit.`, 400);
            }
            packageUpdates.max_people = newMax;
            packageUpdates.available_seats = newAvailableSeats;
        }

        // 4. Safe Cloud Storage Update
        if (file) {
            const safeCompanyName = (userOrVendor.company_name || userOrVendor.name || 'Vendor').replace(/[^a-zA-Z0-9]/g, '_');
            const safePackageName = (packageUpdates.package_name || existingPackage.package_name).replace(/[^a-zA-Z0-9]/g, '_');
            
            const optimizedBuffer = await sharp(file.buffer)
                .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();

            const today = new Date();
            const formattedDate = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
            const uploadPath = `xenon/packages/vendor/${safeCompanyName}/${safePackageName}/${safePackageName}_${formattedDate}`;
            const uploadResult = await FileStorageService.uploadImageFromBuffer(optimizedBuffer, uploadPath);

            newUploadedImageId = uploadResult.public_id;

            packageUpdates.images = [{
                url: uploadResult.secure_url,
                public_id: uploadResult.public_id
            }];
            
            if (existingPackage.images && existingPackage.images.length > 0) {
                oldImagesToDelete = existingPackage.images;
            }
        }

        if (Object.keys(packageUpdates).length === 0 && Object.keys(detailsUpdates).length === 0) {
            throw new AppError('No valid data provided for update', 400);
        }

        // 🌟 5. تحديث الداتابيز (الجدولين)
        let updatedPackage = existingPackage;
        
        if (Object.keys(packageUpdates).length > 0) {
            updatedPackage = await Package.findByIdAndUpdate(packageId, { $set: packageUpdates }, { new: true, runValidators: true, session });
        }

        if (Object.keys(detailsUpdates).length > 0) {
            // تحديث التفاصيل إن وجدت
            await PackageDetails.findOneAndUpdate(
                { package_id: packageId }, 
                { $set: detailsUpdates }, 
                { new: true, runValidators: true, session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        if (oldImagesToDelete.length > 0) {
            for (const image of oldImagesToDelete) {
                await FileStorageService.deleteImage(image.public_id).catch(e => console.error("Cloud cleanup failed:", e)); 
            }
        }

        return updatedPackage;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        if (newUploadedImageId) {
            await FileStorageService.deleteImage(newUploadedImageId).catch(e => console.error("Cloud cleanup failed:", e));
        }

        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 5. CORE: Delete Package (Soft Delete)
// ==========================================
exports.deletePackageCore = async function (userOrVendor, packageId) {
    try {
        const packageDoc = await Package.findById(packageId);
        
        if (!packageDoc) {
            throw new AppError('The package is not found', 404);
        }

        checkPackageOwnership(userOrVendor, packageDoc);

        // 🌟 تطبيق طلب العميل: إذا كانت active، نجعلها inactive فقط.
        if (packageDoc.package_status === 'active') {
            packageDoc.package_status = 'inactive';
            await packageDoc.save();
            await PackageDetails.updateOne({ package_id: packageId }, { $set: { package_status: 'inactive' } });
            return { message: "The package was active, so it has been deactivated instead of permanently deleted." };
        }

        // إذا كانت inactive بالفعل، يتم الحذف الوهمي (Soft Delete)
        packageDoc.isDeleted = true;
        packageDoc.deletionRequestedAt = new Date();
        
        await packageDoc.save();
        return { message: "Package deleted successfully" };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};