const staffCore = require("../../services/Core/Admin/staffCore");

exports.addEmployee = async (req, res, next) => {
    try {
        const result = await staffCore.addEmployee(req.body);
        return res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

exports.updateEmployee = async (req, res, next) => {
    try {
        const result = await staffCore.updateEmployee(req.params.id, req.body);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.deleteEmployee = async (req, res, next) => {
    try {
        const result = await staffCore.deleteEmployee(req.params.id, req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getAllEmployees = async (req, res, next) => {
    try {
        const result = await staffCore.getAllEmployees(req.query);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getEmployee = async (req, res, next) => {
    try {
        const result = await staffCore.getEmployee(req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
