const mongoose = require("mongoose");
const User = require("../../../Models/UserModel");
const Employee = require("../../../Models/EmployeeModels"); 
const AppError = require("../../../utils/appError");

const APIFeatures = require("../../../utils/APIFeatures");


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
            name, email, password, role, mobileNumber, gender, DateOfBirth
        }], { session });

        const createdUser = newUser[0];

        const newEmployee = await Employee.create([{
            user_id: createdUser._id, 
            position, 
            salary, 
            allowances, 
            workSystem, 
            hourOfWork, 
            job_active
        }], { session });

        await session.commitTransaction();
        session.endSession();

        createdUser.password = undefined; 

        return {
            user: createdUser,
            employeeDetails: newEmployee[0]
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

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

    const employee = await Employee.findById(employeeId);
    if (!employee) throw new AppError("Employee not found", 404);

    const currentWorkSystem = employeeData.workSystem || employee.workSystem;
    if (['full-time', 'contract'].includes(currentWorkSystem) && employeeData.workSystem) {
        employeeData.hourOfWork = null; 
    }
    if (['part-time', 'freelance'].includes(currentWorkSystem) && employeeData.workSystem) {
        employeeData.salary = null;
        employeeData.allowances = null;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (Object.keys(userData).length > 0) {
            if (userData.email && userData.email !== employee.user_id.email) {
                if (!userData.email.toLowerCase().endsWith("@xenon.com")) {
                    throw new AppError("Email must end with @xenon.com", 400);
                }
                const emailExists = await User.findOne({ email: userData.email }).session(session);
                if (emailExists) throw new AppError("Email already exists", 400);
            }
            
            await User.findByIdAndUpdate(employee.user_id, userData, { 
                new: true, runValidators: true, session 
            });
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

        return updatedEmployee;

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw new AppError(error.message, 500);
    }
};


exports.deleteEmployee = async function (employeeId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const employee = await Employee.findById(employeeId).session(session);
        if (!employee) throw new AppError("Employee not found", 404);

        await User.findByIdAndDelete(employee.user_id).session(session);
        await Employee.findByIdAndDelete(employeeId).session(session);

        await session.commitTransaction();
        session.endSession();

        return null; 
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw  new AppError(error.message, 500);
    }
};


exports.getAllEmployees = async function (queryString) {
    const features = new APIFeatures(Employee.find().populate(
        {path: 'user_id',select: 'name email mobileNumber role gender job_active'}), queryString)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const employees = await features.query;

    const formattedEmployees = employees.map(employee => {
        return {
            employee_id: employee._id,
            name: employee.user_id.name,
            email: employee.user_id.email,
            mobileNumber: employee.user_id.mobileNumber,
            role: employee.user_id.role,
            gender: employee.user_id.gender,
            position: employee.position,
            workSystem: employee.workSystem,
            salary: employee.salary,
            allowances: employee.allowances,
            hourOfWork: employee.hourOfWork,
            job_active: employee.job_active,
            hire_date: employee.createdAt
        };
    });
    return formattedEmployees;
};

exports.getEmployee = async function (employeeId) {
    const employee = await Employee.findById(employeeId).populate({
        path: 'user_id',
        select: 'name email mobileNumber role gender DateOfBirth'
    });
    
    if (!employee) {
        throw new AppError("No employee found with that ID", 404);
    }
    
    const formattedEmployee = {
        employee_id: employee._id,
        name: employee.user_id.name,
        email: employee.user_id.email,
        mobileNumber: employee.user_id.mobileNumber,
        role: employee.user_id.role,
        gender: employee.user_id.gender,
        
        position: employee.position,
        workSystem: employee.workSystem,
        salary: employee.salary,
        allowances: employee.allowances,
        hourOfWork: employee.hourOfWork,
        job_active: employee.job_active,
        hire_date: employee.createdAt
    };
    
    return formattedEmployee;
};