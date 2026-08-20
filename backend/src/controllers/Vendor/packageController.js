const PackageCore = require("../../services/Core/Vendor/PackageCore");

exports.createPackage = async (req, res, next) => {
    try {
        const package = await PackageCore.createPackage(req.user, req.body, req.file);
        res.status(201).json({
            status: "success",
            data: {
                package,
            }
        });
    } catch (error) {
       next(error);
    }
};

exports.getAllPackages = async (req, res, next) => {
    try {
        const packages = await PackageCore.getAllPackages(req, res);
        res.status(200).json({
            status: "success",
            data: {
                packages,
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getPackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const package = await PackageCore.getPackage(req, res, id);
        res.status(200).json({
            status: "success",
            data: {
                package,
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.updatePackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const package = await PackageCore.updatePackage(req, res, id);
        res.status(200).json({
            status: "success",
            data: {
                package,
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.deletePackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const package = await PackageCore.deletePackageCore(req, res, id);
        res.status(200).json({
            status: "success",
            data: {
                package,
            }
        });
    } catch (error) {
        next(error);
    }
};
