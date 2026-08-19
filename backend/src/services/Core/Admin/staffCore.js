const mongoose = require("mongoose");
const User = require("../../../Models/UserModel");
const Employee = require("../../../Models/EmployeeModels"); 
const AppError = require("../../../utils/AppError");
const APIFeatures = require("../../../utils/apiFeatures");

// ==========================================
// 1. Add Employee
// ==========================================
exports.addEmployee = async function (employeeData) {
    const { 
        name, email, password, role, mobileNumber, gender, DateOfBirth, 
        position, salary, allowances, workSystem, hourOfWork, job_active 
    } = employeeData;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (email) {
            if (!email.toLowerCase().endsWith("@xenon.com")) {
                throw new AppError("Employees must use a corporate email ending with @xenon.com", 400);
            }
            const existingEmail = await User.findOne({ email }).session(session);
            if (existingEmail) throw new AppError("Email already exists", 400);
        }

        if (mobileNumber) {
            const existingMobile = await User.findOne({ mobileNumber }).session(session);
            if (existingMobile) throw new AppError("Mobile number already exists", 400);
        }

        const newUser = await User.create([{
            name, email, password, role: role || 'employee', mobileNumber, gender, DateOfBirth, isActive: true
        }], { session });

        const createdUser = newUser[0];

        const newEmployee = await Employee.create([{
            user_id: createdUser._id, 
            position, 
            salary, 
            allowances, 
            workSystem, 
            hourOfWork, 
            job_active: job_active !== undefined ? job_active : true
        }], { session });

        await session.commitTransaction();
        session.endSession();

        createdUser.password = undefined; 

        return {
            status: "success",
            message: "Employee added successfully",
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
// 2. Update Employee
// ==========================================
exports.updateEmployee = async function (employeeId, updateData) {
    const userFields = ['name', 'email', 'mobileNumber', 'password', 'gender', 'DateOfBirth', 'role'];
    const userData = {};
    const employeeData = {};
    
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
        if (!employee) throw new AppError("Employee not found", 404);

        const currentWorkSystem = employeeData.workSystem || employee.workSystem;
        if (['full-time', 'contract'].includes(currentWorkSystem) && employeeData.workSystem) {
            employeeData.hourOfWork = null; 
        }
        if (['part-time', 'freelance'].includes(currentWorkSystem) && employeeData.workSystem) {
            employeeData.salary = null;
            employeeData.allowances = null;
        }

        if (Object.keys(userData).length > 0) {
            const user = await User.findById(employee.user_id).session(session);
            if (!user) throw new AppError("User record linked to this employee not found", 404);

            // 🌟 التحقق من الإيميل
            if (userData.email && userData.email !== user.email) {
                if (!userData.email.toLowerCase().endsWith("@xenon.com")) {
                    throw new AppError("Email must end with @xenon.com", 400);
                }
                const emailExists = await User.findOne({ email: userData.email }).session(session);
                if (emailExists) throw new AppError("Email already exists", 400);
            }

            // 🌟 التحقق من رقم الهاتف (إضافة أمنية جديدة)
            if (userData.mobileNumber && userData.mobileNumber !== user.mobileNumber) {
                const mobileExists = await User.findOne({ mobileNumber: userData.mobileNumber }).session(session);
                if (mobileExists) throw new AppError("Mobile number already exists", 400);
            }
            
            Object.assign(user, userData);
            await user.save({ session }); // لحفظ وتفعيل تشفير الباسوورد تلقائياً
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
            message: "Employee updated successfully",
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
// 3. Delete Employee (Soft Delete)
// ==========================================
exports.deleteEmployee = async function (employeeId, loggedInUserId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const employee = await Employee.findById(employeeId).session(session);
        if (!employee) throw new AppError("Employee not found", 404);
        
        // 🌟 حماية أمنية: منع الآدمن من تعطيل نفسه عن طريق الخطأ
        if (loggedInUserId && employee.user_id.toString() === loggedInUserId.toString()) {
            throw new AppError("Security action: You cannot deactivate your own employee account.", 403);
        }

        if (employee.job_active === false) throw new AppError("Employee is already inactive", 400);

        await User.findByIdAndUpdate(employee.user_id, { isActive: false }, { session });
        await Employee.findByIdAndUpdate(employeeId, { job_active: false }, { session });

        await session.commitTransaction();
        session.endSession();

        return { 
            status: "success",
            message: "Employee successfully deactivated" 
        }; 
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 4. Get All Employees
// ==========================================
exports.getAllEmployees = async function (queryString) {
    try {
        const features = new APIFeatures(
            Employee.find().populate({
                path: 'user_id',
                select: 'name email mobileNumber role gender DateOfBirth isActive -_id'
            }), 
            queryString
        )
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const employees = await features.query;

        const formattedEmployees = employees.map(employee => {
            const user = employee.user_id || {}; 
            return {
                employee_id: employee._id,
                name: user.name,
                email: user.email,
                mobileNumber: user.mobileNumber,
                role: user.role,
                gender: user.gender,
                DateOfBirth: user.DateOfBirth,
                is_user_active: user.isActive,
                position: employee.position,
                workSystem: employee.workSystem,
                salary: employee.salary,
                allowances: employee.allowances,
                hourOfWork: employee.hourOfWork,
                job_active: employee.job_active,
                hire_date: employee.createdAt
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
// 5. Get Single Employee
// ==========================================
exports.getEmployee = async function (employeeId) {
    try {
        const employee = await Employee.findById(employeeId).populate({
            path: 'user_id',
            select: 'name email mobileNumber role gender DateOfBirth isActive -_id'
        });
        
        if (!employee) {
            throw new AppError("No employee found with that ID", 404);
        }
        
        const user = employee.user_id || {};
        
        const formattedEmployee = {
            employee_id: employee._id,
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber,
            role: user.role,
            gender: user.gender,
            DateOfBirth: user.DateOfBirth,
            is_user_active: user.isActive,
            position: employee.position,
            workSystem: employee.workSystem,
            salary: employee.salary,
            allowances: employee.allowances,
            hourOfWork: employee.hourOfWork,
            job_active: employee.job_active,
            hire_date: employee.createdAt
        };
        
        return {
            status: "success",
            data: formattedEmployee
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};