const bcrypt = require("bcrypt");
const AppError = require("../../utils/AppError");
const VendorModel = require("../../Models/VendorModel");
const UserModel = require("../../Models/UserModel");
const ReviewModel = require("../../Models/ReviewModel");
const BookingModel = require("../../Models/BookingModel");
const NotificationModel = require("../../Models/NotificationModel");
const checkRole = require("../../utils/checkRole");

exports.getProfileCore = async function (user) {
    try {
        if (checkRole(user.role, ["user"])) {
            const profile = await UserModel.findById(user._id);
            if (!profile) throw new AppError("User not found", 404);
            return profile;
        } else if (checkRole(user.role, ["admin"])) {
            const profile = await UserModel.findById(user._id).select("+password");
            if (!profile) throw new AppError("Admin not found", 404);
            return profile;
        } else if (checkRole(user.role, ["vendor"])) {
            const profile = await VendorModel.findOne({
                $or: [
                    { vendor_owner_id: user._id },
                    { vendor_user_id: user._id }
                ]
            });

            if (!profile) throw new AppError("Vendor not found", 404);
            
            if(profile.deletionRequestedAt){
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

exports.updateProfileCore = async function (user, updates) {
    try {
        if (!user.isActive) {
            throw new AppError("Your account has been blocked", 403);
        }

        if (checkRole(user.role, ["user", "admin"])) {
            const { mobileNumber, email } = updates;
            const userUpdates = {};

            if (mobileNumber) {
                const existing = await UserModel.findOne({ mobileNumber });
                if (existing && existing._id.toString() !== user._id.toString()) {
                    throw new AppError("Mobile number is already in use", 409);
                }
                userUpdates.mobileNumber = mobileNumber;
            }

            if (email) {
                const cleanEmail = email.toLowerCase().trim();
                const existing = await UserModel.findOne({ email: cleanEmail });
                if (existing && existing._id.toString() !== user._id.toString()) {
                    throw new AppError("Email address is already in use", 409);
                }
                userUpdates.email = cleanEmail;
            }

            const updatedUser = await UserModel.findByIdAndUpdate(user._id, userUpdates, { new: true, runValidators: true });
            return updatedUser;

        } else if (checkRole(user.role, ["vendor"])) {
            const vendor = await VendorModel.findOne({
                $or: [
                    { vendor_owner_id: user._id },
                    { vendor_user_id: user._id }
                ]
            });

            if (!vendor) {
                throw new AppError("Vendor profile not found", 404);
            }

            // Update User fields
            if (updates.name) user.name = updates.name;
            const mobileNum = updates.phone_no || updates.mobile || updates.mobileNumber;
            if (mobileNum) user.mobileNumber = mobileNum;
            await user.save();

            // Update Vendor fields
            if (updates.company_name) {
                vendor.vendor_name = updates.company_name;
            } else if (updates.name && !vendor.vendor_name) {
                vendor.vendor_name = updates.name;
            }

            if (mobileNum) vendor.vendor_mobile = mobileNum;
            if (updates.address) vendor.vendor_address = updates.address;
            if (updates.city) vendor.vendor_city = updates.city;
            if (updates.state) vendor.vendor_state = updates.state;
            if (updates.pincode) vendor.vendor_pincode = updates.pincode;
            if (updates.country) vendor.vendor_country = updates.country;
            if (updates.vendor_type) vendor.vendor_type = updates.vendor_type;

            await vendor.save();
            return vendor;
        } else {
            throw new AppError("Invalid role", 403);
        }
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.updatePasswordCore = async function (user, oldPassword, newPassword) {
    try {
        if (oldPassword === newPassword) {
            throw new AppError("New password cannot be the same as old password", 400);
        }

        const userDoc = await UserModel.findById(user._id).select("+password");
        if (!userDoc) {
            throw new AppError("User not found", 404);
        }

        const isMatch = await bcrypt.compare(oldPassword, userDoc.password);
        if (!isMatch) {
            throw new AppError("Current password is incorrect", 401);
        }

        userDoc.password = newPassword;
        await userDoc.save();

        // If vendor, also update the vendor model password
        if (checkRole(user.role, ["vendor"])) {
            const vendor = await VendorModel.findOne({
                $or: [
                    { vendor_owner_id: user._id },
                    { vendor_user_id: user._id }
                ]
            });

            if (vendor) {
                const hashPassword = await bcrypt.hash(newPassword, 12);
                vendor.vendor_old_password = vendor.vendor_password;
                vendor.vendor_password = hashPassword;
                await vendor.save();
            }
        }

        return { message: "Password changed successfully" };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.deleteAccountCore = async function (user) {
    try {
        if (user.isActive === false) {
            throw new AppError("Account is already deactivated", 400);
        }

        if (checkRole(user.role, ["user", "admin"])) {
            await UserModel.findByIdAndUpdate(user._id, { isActive: false, updatedAt: new Date() }, { new: true });
        } else if (checkRole(user.role, ["vendor"])) {
            const vendor = await VendorModel.findOne({ vendor_owner_id: user._id });
            if (!vendor) {
                throw new AppError("Only the store owner can delete this vendor account", 403);
            }
            if (vendor.vendor_status !== 'active' || vendor.deletionRequestedAt) {
                throw new AppError("Account is already inactive or pending deletion", 400);
            }

            await UserModel.findByIdAndUpdate(user._id, { isActive: false, updatedAt: new Date() }, { new: true });
            await VendorModel.findByIdAndUpdate(
                vendor._id, 
                { 
                    vendor_status: 'inactive', 
                    deletionRequestedAt: Date.now(),
                    vendor_password: null,
                    vendor_old_password: null
                }, 
                { new: true }
            );
        } else {
            throw new AppError("Invalid role", 403);
        }

        return { message: "Your account has been successfully deleted/deactivated" };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// Client specific helpers (can be accessed via unified core if role is user)
exports.getAllReviewsCore = async function (user) {
    try {
        if (!checkRole(user.role, ["user"])) throw new AppError("Unauthorized", 403);
        const reviews = await ReviewModel.find({ user_id: user._id }).populate("studio_id", "name");
        return reviews;
    } catch (error) {
        throw new AppError(error.message, 500);
    }
};

exports.getAllBookingHistoryCore = async function (user) {
    try {
        if (!checkRole(user.role, ["user"])) throw new AppError("Unauthorized", 403);
        const getAllBookingHistory = await BookingModel.find({ user_id: user._id }).populate("studio_id", "name");
        return getAllBookingHistory;
    } catch (error) {
        throw new AppError(error.message, 500);
    }
};

exports.getAllNotificationsCore = async function (user) {
    try {
        if (!checkRole(user.role, ["user"])) throw new AppError("Unauthorized", 403);
        const getAllNotifications = await NotificationModel.find({ user_id: user._id }).populate("studio_id", "name");
        return getAllNotifications;
    } catch (error) {
        throw new AppError(error.message, 500);
    }
};
