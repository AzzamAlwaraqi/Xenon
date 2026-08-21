const mongoose = require("mongoose");
const User = require("../../Models/UserModel");
const Employee = require("../../Models/EmployeeModels");
const AppError = require("../../utils/AppError");

// 🌟 استيراد الثوابت لمعرفة المناصب العليا برمجياً (Single Source of Truth)
const { SUPERIOR_ADMIN_POSITIONS } = require('../../utils/checkvalidete');

// ==========================================
// 1. Add Employee Core
// ==========================================
exports.addStaffCore = async function (vendorId, creatorId, creatorRole, staffData) {
    const { 
        name, email, password, role, mobileNumber, gender, DateOfBirth, 
        position, allowances, workSystem, basePay, job_active 
    } = staffData;

    // 🛡️ الحماية الأولى: منع التجار من إنشاء حسابات إدارة
    if (creatorRole === 'vendor' && role === 'admin') {
        throw new AppError("Access Denied: Vendors cannot create admin staff members.", 403);
    }

    // 🛡️ الحماية الثانية: صلاحيات الإدارة الدقيقة (RBAC)
    if (creatorRole === 'admin' && role === 'admin') {
        const creatorEmployee = await Employee.findOne({ user_id: creatorId });
        if (!creatorEmployee) {
            throw new AppError("Access Denied: Your employee record was not found.", 403);
        }
        
        if (!SUPERIOR_ADMIN_POSITIONS.includes(creatorEmployee.position)) {
            throw new AppError(`Access Denied: Your position (${creatorEmployee.position}) lacks privileges to create other admins.`, 403);
        }
    }

    // 💡 تفكيك الراتب الموحد (basePay)
    let salary = null;
    let hourOfWork = null;
    if (['full-time', 'contract'].includes(workSystem)) {
        salary = basePay;
    } else {
        hourOfWork = basePay;
    }

    // 🔒 بدء دورة الحفظ المترابطة (Transaction)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (email) {
            const existingEmail = await User.findOne({ email }).session(session);
            if (existingEmail) throw new AppError("Email is already registered.", 400);
        }

        if (mobileNumber) {
            const existingMobile = await User.findOne({ mobileNumber }).session(session);
            if (existingMobile) throw new AppError("Mobile number is already registered.", 400);
        }

        const newUser = await User.create([{
            name, email, password, role: role || 'vendor', mobileNumber, gender, DateOfBirth, isActive: true
        }], { session });

        const createdUser = newUser[0];

        const newEmployee = await Employee.create([{
            user_id: createdUser._id, 
            vendor_id: vendorId || null, 
            position, 
            salary,       
            allowances, 
            workSystem, 
            hourOfWork,   
            job_active: job_active !== undefined ? job_active : true
        }], { session });

        await session.commitTransaction();
        session.endSession();

        createdUser.password = undefined; // إخفاء الباسوورد قبل إرسال الرد

        return {
            status: "success",
            message: "Staff member added successfully.",
            data: {
                user: createdUser,
                employeeDetails: newEmployee[0]
            }
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 2. Get All Staff
// ==========================================
exports.getAllStaffCore = async function (vendorId, isAdmin) {
    try {
        let query = {};
        if (!isAdmin && vendorId) {
            query.vendor_id = vendorId;
        }

        const employees = await Employee.find(query).populate({
            path: 'user_id',
            select: 'name email mobileNumber role gender DateOfBirth isActive -_id'
        });

        const formattedEmployees = employees.map(employee => {
            const user = employee.user_id || {}; 
            return {
                employee_id: employee._id,
                name: user.name,
                email: user.email,
                mobileNumber: user.mobileNumber,
                role: user.role,
                position: employee.position,
                workSystem: employee.workSystem,
                job_active: employee.job_active
            };
        });

        return {
            status: "success",
            count: formattedEmployees.length,
            data: formattedEmployees
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 3. Update Staff 
// ==========================================
exports.updateStaffCore = async function (employeeId, vendorId, isAdmin, updateData) {
    const userFields = ['name', 'email', 'mobileNumber', 'password', 'gender', 'DateOfBirth', 'role'];
    const userData = {};
    const employeeData = {};
    
    // 💡 إعادة توجيه basePay بناءً على نظام العمل
    if (updateData.basePay) {
        const targetWorkSystem = updateData.workSystem || 'full-time'; 
        if (['full-time', 'contract'].includes(targetWorkSystem)) {
            updateData.salary = updateData.basePay;
            updateData.hourOfWork = null; 
        } else {
            updateData.hourOfWork = updateData.basePay;
            updateData.salary = null;
            updateData.allowances = null;
        }
        delete updateData.basePay; 
    }

    Object.keys(updateData).forEach(key => {
        if (userFields.includes(key)) {
            userData[key] = updateData[key];
        } else {
            employeeData[key] = updateData[key];
        }
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const employee = await Employee.findById(employeeId).session(session);
        if (!employee) throw new AppError("Staff member not found.", 404);

        if (!isAdmin && employee.vendor_id && employee.vendor_id.toString() !== vendorId.toString()) {
            throw new AppError("Access Denied: You can only update your own staff.", 403);
        }

        if (Object.keys(userData).length > 0) {
            const user = await User.findById(employee.user_id).session(session);
            if (!user) throw new AppError("Linked user record not found.", 404);

            if (userData.email && userData.email !== user.email) {
                const emailExists = await User.findOne({ email: userData.email }).session(session);
                if (emailExists) throw new AppError("Email is already registered.", 400);
            }

            if (userData.mobileNumber && userData.mobileNumber !== user.mobileNumber) {
                const mobileExists = await User.findOne({ mobileNumber: userData.mobileNumber }).session(session);
                if (mobileExists) throw new AppError("Mobile number is already registered.", 400);
            }
            
            Object.assign(user, userData);
            await user.save({ session }); 
        }

        let updatedEmployee = employee;
        if (Object.keys(employeeData).length > 0) {
            updatedEmployee = await Employee.findByIdAndUpdate(employeeId, employeeData, { 
                new: true, runValidators: true, session 
            }).populate('user_id', '-password');
        } else {
            updatedEmployee = await Employee.findById(employeeId).populate('user_id', '-password').session(session);
        }

        await session.commitTransaction();
        session.endSession();

        return {
            status: "success",
            message: "Staff member updated successfully.",
            data: updatedEmployee
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 4. Deactivate Staff (Soft Delete)
// ==========================================
exports.deleteStaffCore = async function (employeeId, vendorId, isAdmin) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const employee = await Employee.findById(employeeId).session(session);
        if (!employee) throw new AppError("Staff member not found.", 404);
        
        if (!isAdmin && employee.vendor_id && employee.vendor_id.toString() !== vendorId.toString()) {
            throw new AppError("Access Denied: You can only deactivate your own staff.", 403);
        }

        if (employee.job_active === false) throw new AppError("Staff member is already inactive.", 400);

        // 🛡️ Soft Delete Implementation
        await User.findByIdAndUpdate(employee.user_id, { isActive: false }, { session });
        await Employee.findByIdAndUpdate(employeeId, { job_active: false }, { session });

        await session.commitTransaction();
        session.endSession();

        return { 
            status: "success",
            message: "Staff member successfully deactivated (Soft Deleted)." 
        }; 
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 5. Get Single Staff
// ==========================================
exports.getStaffCore = async function (employeeId, vendorId, isAdmin) {
    try {
        const employee = await Employee.findById(employeeId).populate('user_id', '-password');
        if (!employee) throw new AppError("Staff member not found.", 404);
        
        if (!isAdmin && employee.vendor_id && employee.vendor_id.toString() !== vendorId.toString()) {
            throw new AppError("Access Denied: You can only view your own staff.", 403);
        }
        
        return {
            status: "success",
            data: employee
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};