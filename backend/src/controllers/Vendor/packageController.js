const PackageCore = require("../../services/Core/Vendor/PackageCore");

exports.createPackage = async (req, res, next) => {
    try {
        const package = await PackageCore.createPackageCore(req.user, req.body, req.file);
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
        const result = await PackageCore.getAllPackagesCore(req.query);
        res.status(200).json({
            status: "success",
            count: result.count,
            pagination: result.pagination,
            data: result.data
        });
    } catch (error) {
        next(error);
    }
};

exports.getPackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const package = await PackageCore.getPackageCore(id, req.query);
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
        const package = await PackageCore.updatePackageCore(req.user, id, req.body, req.file);
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
        const package = await PackageCore.deletePackageCore(req.user, id);
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
