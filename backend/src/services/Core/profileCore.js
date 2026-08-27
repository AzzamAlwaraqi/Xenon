const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const AppError = require("../../utils/AppError");
const VendorModel = require("../../Models/VendorModel");
const UserModel = require("../../Models/UserModel");
const ReviewModel = require("../../Models/ReviewModel");
const BookingModel = require("../../Models/BookingModel");
const NotificationModel = require("../../Models/NotificationModel");
const SessionModel = require("../../Models/SessionModel");
const PackageModel = require("../../Models/PackageModel");
const EmployeeModel = require("../../Models/EmployeeModels");
const { checkRole } = require("../../utils/checkvalidete");
const vendorApprovalCore = require("./Admin/vendorApprovalCore");
const VendorVerificationModel = require("../../Models/VendorVerificationModel");
const FileStorageService = require("../Integration/FileStorageService");
const sharp = require("sharp");
// ==========================================
// 1. Get Profile
// ==========================================
exports.getProfileCore = async function (user) {
    try {
        if (checkRole(user.role, ["user", "admin"])) {
            // 🌟 إصلاح: لا تجلب الباسوورد أبداً!
            const profile = await UserModel.findById(user._id);
            if (!profile) throw new AppError(`${user.role} not found`, 404);
            return profile;
        } else if (checkRole(user.role, ["vendor"])) {
            const profile = await VendorModel.findOne({
                $or: [
                    { _id: user._id },
                    { vendor_owner_id: user._id },
                    { vendor_user_id: user._id }
                ]
            });

            if (!profile) throw new AppError("Vendor not found", 404);

            if (profile.deletionRequestedAt) {
                const timeSinceRequest = Date.now() - new Date(profile.deletionRequestedAt).getTime();
                const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000;

                if (timeSinceRequest > thirtyDaysInMillis) {
                    throw new AppError("Account is permanently deleted", 403);
                } else {
                    throw new AppError("Account is pending deletion. Please restore your account to continue.", 403);
                }
            }

            if (profile.vendor_status !== 'active') {
                throw new AppError("Your account has been blocked or deactivated", 403);
            }
            return profile;
        } else {
            throw new AppError("Invalid role", 403);
        }
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 2. Update Profile
// ==========================================
exports.updateProfileCore = async function (user, updates) {
    try {
        if (user.isActive === false) throw new AppError("Your account has been blocked", 403);
        if (user.vendor_status && user.vendor_status !== 'active') throw new AppError("Your account has been blocked", 403);

        // 🌟 استخراج البيانات المشتركة
        const mobileNum = updates.phone_no || updates.mobile || updates.mobileNumber;
        const cleanEmail = updates.email ? updates.email.toLowerCase().trim() : null;

        // 🌟 التحقق من تعارض الإيميل أو رقم الهاتف لأي مستخدم
        if (mobileNum) {
            const existingMobile = await UserModel.findOne({ mobileNumber: mobileNum });
            if (existingMobile && existingMobile._id.toString() !== user._id.toString()) {
                throw new AppError("Mobile number is already in use", 409);
            }
        }

        if (cleanEmail) {
            const existingEmail = await UserModel.findOne({ email: cleanEmail });
            if (existingEmail && existingEmail._id.toString() !== user._id.toString()) {
                throw new AppError("Email address is already in use", 409);
            }
        }

        if (checkRole(user.role, ["user", "admin"])) {
            const userUpdates = {};
            if (mobileNum) userUpdates.mobileNumber = mobileNum;
            if (updates.name) userUpdates.name = updates.name;
            if (updates.DateOfBirth) userUpdates.DateOfBirth = updates.DateOfBirth;

            // 🌟 Security: إذا غير الإيميل، يجب أن نطلب منه تفعيله من جديد!
            if (cleanEmail && cleanEmail !== user.email) {
                userUpdates.email = cleanEmail;
                userUpdates.is_verified = false;
            }

            const updatedUser = await UserModel.findByIdAndUpdate(user._id, userUpdates, { new: true, runValidators: true });
            return updatedUser;

        } else if (checkRole(user.role, ["vendor"])) {
            const vendor = await VendorModel.findOne({
                $or: [{ _id: user._id }, { vendor_owner_id: user._id }, { vendor_user_id: user._id }]
            });

            if (!vendor) throw new AppError("Vendor profile not found", 404);

            // تحديث موديل اليوزر
            const userId = vendor.vendor_owner_id || user._id; // Fallback
            const userDoc = await UserModel.findById(userId);
            if (userDoc) {
                if (updates.name) userDoc.name = updates.name;
                if (mobileNum) userDoc.mobileNumber = mobileNum;
                if (cleanEmail && cleanEmail !== userDoc.email) {
                    userDoc.email = cleanEmail;
                    userDoc.is_verified = false; // Security Check
                }
                await userDoc.save();
            }

            // تحديث اسم الشركة مع التحقق من عدم تكراره
            let newCompanyName = updates.vendor_company || updates.company_name;
            if (newCompanyName && newCompanyName !== vendor.vendor_company) {
                const existingCompany = await VendorModel.findOne({ vendor_company: { $regex: new RegExp(`^${newCompanyName}$`, 'i') } });
                if (existingCompany) {
                    throw new AppError("A vendor with this company name already exists. Please choose a different name.", 409);
                }
                vendor.vendor_company = newCompanyName;
            }

            if (updates.address) vendor.vendor_address = updates.address;
            if (updates.city) vendor.vendor_city = updates.city;
            if (updates.state) vendor.vendor_state = updates.state;
            if (updates.pincode) vendor.vendor_pincode = updates.pincode;
            if (updates.country) vendor.vendor_country = updates.country;
            if (updates.vendor_type) vendor.vendor_type = updates.vendor_type;

            await vendor.save();
            return vendor;
        }
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 3. Update Password
// ==========================================
exports.updatePasswordCore = async function (user, oldPassword, newPassword) {
    try {
        if (oldPassword === newPassword) {
            throw new AppError("New password cannot be the same as old password", 400);
        }

        const userId = user.vendor_owner_id || user._id; // Fallback
        const userDoc = await UserModel.findById(userId).select("+password");
        if (!userDoc) throw new AppError("User not found", 404);

        const isMatch = await bcrypt.compare(oldPassword, userDoc.password);
        if (!isMatch) throw new AppError("Current password is incorrect", 401);

        // 🌟 نعتمد على pre('save') hook في الموديل لتشفير الباسوورد بدلاً من التشفير اليدوي لتجنب الـ Double Hashing
        userDoc.password = newPassword;
        await userDoc.save();

        // 🌟 Security: تدمير جميع الجلسات النشطة ليضطر لتسجيل الدخول من جديد
        await SessionModel.updateMany(
            { user_id: user._id, is_active: true },
            { is_active: false, session_status: 'terminated' }
        );

        return { message: "Password changed successfully. You will be logged out of all devices." };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 4. Delete Account (Soft Delete)
// ==========================================

exports.deleteAccountCore = async function (user) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (user.isActive === false) throw new AppError("Account is already deactivated", 400);

        if (checkRole(user.role, ["user", "admin"])) {
            await UserModel.findByIdAndUpdate(user._id, { isActive: false, updatedAt: new Date() }, { new: true, session });

        } else if (checkRole(user.role, ["vendor"])) {
            const vendor = await VendorModel.findOne({
                $or: [{ _id: user._id }, { vendor_owner_id: user._id }]
            }).session(session);

            if (!vendor) throw new AppError("Only the store owner can request to delete this vendor account", 403);

            if (vendor.vendor_status !== 'active' || vendor.deletionRequestedAt) {
                throw new AppError("Account is already inactive or pending deletion", 400);
            }

            const activeEmployees = await EmployeeModel.countDocuments({ vendor_id: vendor._id, job_active: true }).session(session);
            if (activeEmployees > 0) {
                throw new AppError("Cannot delete account: You have active employees. Please terminate their contracts first.", 400);
            }

            const today = new Date();
            const activePackages = await PackageModel.countDocuments({
                vendor_id: vendor._id,
                endDate: { $gte: today },
                package_status: 'active'
            }).session(session);
            if (activePackages > 0) {
                throw new AppError("Cannot delete account: You have active or future packages. Please deactivate or complete them first.", 400);
            }

            const activeBookings = await BookingModel.countDocuments({
                vendor_id: vendor._id,
                status: { $in: ["pending_payment", "pending", "accepted"] }
            }).session(session);
            if (activeBookings > 0) {
                throw new AppError("Cannot delete account: You have active bookings. Please complete or cancel them first.", 400);
            }

            await VendorModel.findByIdAndUpdate(
                vendor._id,
                {
                    vendor_status: 'pending_deletion',
                    deletionRequestedAt: Date.now()
                },
                { new: true, session }
            );

            const userId = vendor.vendor_owner_id || user._id;
            await vendorApprovalCore.submitDowngradeRequestCore({
                vendor_id: vendor._id,
                user_id: userId,
                reason: 'Vendor requested account deletion and downgrade to regular user'
            }, session);

        } else {
            throw new AppError("Invalid role", 403);
        }

        await SessionModel.updateMany(
            { user_id: user._id, is_active: true },
            { is_active: false, session_status: 'terminated' },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        const successMessage = checkRole(user.role, ["vendor"])
            ? "Your request to close the store has been sent to the admin. You will be logged out."
            : "Your account has been successfully deleted/deactivated.";

        return { message: successMessage };

    } catch (error) {
        // في حال حدوث أي خطأ، يتم التراجع عن كل شيء!
        await session.abortTransaction();
        session.endSession();
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};
// ==========================================
// 5. Client Specific Helpers
// ==========================================

exports.getAllReviewsCore = async function (user) {
    try {
        if (!checkRole(user.role, ["user"])) throw new AppError("Unauthorized", 403);
        const reviews = await ReviewModel.find({ user_id: user._id })
            .populate("vendor_id", "vendor_company -_id");
        return reviews;
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.getAllBookingHistoryCore = async function (user) {
    try {
        if (!checkRole(user.role, ["user"])) throw new AppError("Unauthorized", 403);
        const getAllBookingHistory = await BookingModel.find({ user_id: user._id })
            .populate("vendor_id", "vendor_company -_id")
            .populate("package_id", "package_name -_id");
        return getAllBookingHistory;
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.getAllNotificationsCore = async function (user) {
    try {
        if (!checkRole(user.role, ["user"])) throw new AppError("Unauthorized", 403);
        const getAllNotifications = await NotificationModel.find({ user_id: user._id })
            .sort({ createdAt: -1 });
        return getAllNotifications;
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.updateFCMTokenCore = async function (user, fcm_token) {
    try {
        await UserModel.findByIdAndUpdate(user._id, { fcm_token });
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.requestVendorOnboardingCore = async function (user, body, files) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        if (!checkRole(user.role, ["user"])) {
            throw new AppError("Only users can apply for vendor onboarding", 403);
        }

        let existingVendor = await VendorModel.findOne({ vendor_owner_id: user._id });
        if (existingVendor) {
            if (existingVendor.vendor_status === 'pending_approval') {
                throw new AppError("You already have a vendor application pending approval.", 400);
            } else if (existingVendor.vendor_status === 'active') {
                throw new AppError("You are already registered as an active vendor.", 400);
            }
            // If rejected, we allow them to proceed and we will update their existing record.
        }
        
        const requiredFields = ['company_name', 'address', 'city', 'state', 'pincode', 'country', 'vendor_type', 'iban_number'];
        for (const field of requiredFields) {
            if (!body[field]) throw new AppError(`Field ${field} is required`, 400);
        }

        const existingCompany = await VendorModel.findOne({ vendor_company: { $regex: new RegExp(`^${body.company_name}$`, 'i') } });
        if (existingCompany) {
            throw new AppError("A vendor with this company name already exists.", 409);
        }

        if (!files || !files.commercial_register_image || !files.vocational_license_image || !files.owner_id_image || !files.iban_letter_image) {
            throw new AppError("Missing required documents", 400);
        }

        const safeCompanyName = body.company_name.replace(/[^a-zA-Z0-9]/g, '_');
        
        const uploadFile = async (fileObj, docName) => {
            const optimizedBuffer = await sharp(fileObj[0].buffer)
                .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();
            const uploadPath = `xenon/vendors/${safeCompanyName}/documents/${docName}`;
            const res = await FileStorageService.uploadImageFromBuffer(optimizedBuffer, uploadPath);
            return { url: res.secure_url, public_id: res.public_id };
        };

        const docs = {
            commercial_register_image: await uploadFile(files.commercial_register_image, 'commercial_register'),
            vocational_license_image: await uploadFile(files.vocational_license_image, 'vocational_license'),
            owner_id_image: await uploadFile(files.owner_id_image, 'owner_id'),
            iban_letter_image: await uploadFile(files.iban_letter_image, 'iban_letter')
        };

        if (files.tourism_license_image) {
            docs.tourism_license_image = await uploadFile(files.tourism_license_image, 'tourism_license');
        }

        let vendorId;
        let finalVendor;
        let finalVerification;

        if (existingVendor) {
            vendorId = existingVendor._id;
            existingVendor.vendor_company = body.company_name;
            existingVendor.vendor_address = body.address;
            existingVendor.vendor_city = body.city;
            existingVendor.vendor_state = body.state;
            existingVendor.vendor_pincode = body.pincode;
            existingVendor.vendor_country = body.country;
            existingVendor.vendor_type = body.vendor_type;
            existingVendor.vendor_status = 'pending_approval';
            await existingVendor.save({ session });
            finalVendor = existingVendor;

            const existingVerification = await VendorVerificationModel.findOne({ vendor_id: vendorId }).session(session);
            if (existingVerification) {
                existingVerification.commercial_register_image = docs.commercial_register_image;
                existingVerification.vocational_license_image = docs.vocational_license_image;
                existingVerification.tourism_license_image = docs.tourism_license_image || null;
                existingVerification.owner_id_image = docs.owner_id_image;
                existingVerification.iban_letter_image = docs.iban_letter_image;
                existingVerification.iban_number = body.iban_number;
                await existingVerification.save({ session });
                finalVerification = existingVerification;
            } else {
                const newVerification = new VendorVerificationModel({
                    vendor_id: vendorId,
                    commercial_register_image: docs.commercial_register_image,
                    vocational_license_image: docs.vocational_license_image,
                    tourism_license_image: docs.tourism_license_image || null,
                    owner_id_image: docs.owner_id_image,
                    iban_letter_image: docs.iban_letter_image,
                    iban_number: body.iban_number
                });
                await newVerification.save({ session });
                finalVerification = newVerification;
            }
        } else {
            const newVendor = new VendorModel({
                vendor_company: body.company_name,
                vendor_address: body.address,
                vendor_city: body.city,
                vendor_state: body.state,
                vendor_pincode: body.pincode,
                vendor_country: body.country,
                vendor_type: body.vendor_type,
                vendor_owner_id: user._id,
                vendor_user_id: user._id,
                vendor_status: 'pending_approval'
            });
            await newVendor.save({ session });

            vendorId = newVendor._id;
            finalVendor = newVendor;

            const newVerification = new VendorVerificationModel({
                vendor_id: vendorId,
                commercial_register_image: docs.commercial_register_image,
                vocational_license_image: docs.vocational_license_image,
                tourism_license_image: docs.tourism_license_image || null,
                owner_id_image: docs.owner_id_image,
                iban_letter_image: docs.iban_letter_image,
                iban_number: body.iban_number
            });
            await newVerification.save({ session });
            finalVerification = newVerification;
        }

        await session.commitTransaction();
        session.endSession();

        return {
            data: { vendor: finalVendor, verification_id: finalVerification._id }
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};
