const packageValidate = require("../../validations/packageValidation");
const PackageCore = require("../../services/Core/Vendor/PackageCore");
const AppError = require("../../utils/AppError");

exports.createPackage = async (req, res, next) => {
    try {
        if (!packageValidate.createPackageValidate(req, res)) return;
        const package = await PackageCore.createPackage(req, res);
        res.status(201).json({
            status: "success",
            data: {
                package,
            }
        });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
};

exports.getAllPackages = async (req, res, next) => {
    try {
        if (!packageValidate.getAllPackagesValidate(req, res)) return;
        const packages = await PackageCore.getAllPackages(req, res);
        res.status(200).json({
            status: "success",
            data: {
                packages,
            }
        });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
};

exports.getPackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!packageValidate.getPackageValidate(req, res)) return;
        const package = await PackageCore.getPackage(req, res, id);
        res.status(200).json({
            status: "success",
            data: {
                package,
            }
        });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
};

exports.updatePackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!packageValidate.updatePackageValidate(req, res)) return;
        const package = await PackageCore.updatePackage(req, res, id);
        res.status(200).json({
            status: "success",
            data: {
                package,
            }
        });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
};

exports.deletePackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!packageValidate.deletePackageValidate(req, res)) return;
        const package = await PackageCore.deletePackageCore(req, res, id);
        res.status(200).json({
            status: "success",
            data: {
                package,
            }
        });
    } catch (error) {
        next(new AppError(error.message, 500));
    }
};
