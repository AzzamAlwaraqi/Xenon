const packageValidate = require("../../validations/packageValidation");
const Package = require("../../Models/PackageModel"); // Assuming there is a package model here based on 'Package.create'
const PackageCore = require("../../services/Core/PackageCore");
const AppError = require("../../utils/AppError");

exports.createPackage = async (req, res, next) => {
    try{
    if (!packageValidate.createPackageValidate(req, res)) return;    
    const package = await PackageCore.createPackage(req, res);
    res.status(200).json({
        status: "success",
        data: {
            package,
        }
    });
    }
    catch (error){
        next(new AppError(error.message, 500));
    }
}   

exports.getAllPackages = async (req, res, next) => {
    try{
        if (!packageValidate.getAllPackagesValidate(req, res)) return;
        const packages = await PackageCore.getAllPackages(req, res);
        res.status(200).json({
            status: "success",
            data: {
                packages,
            }
        });
    }
    catch (error){
        next(new AppError(error.message, 500));
    }
}

exports.getPackage = async (req, res) => {
    res.status(200).json({});
}

exports.updatePackage = async (req, res) => {
    const { package_id } = req.params;
    const { package_name, package_price, startDate, endDate, package_status } = req.body;
    
    if (!packageValidate.updatePackageValidate(req, res)) return;

    const updateData = {
        package_name,
        package_price,
        startDate,
        endDate,
        package_status
    };

    if (req.file) {
        updateData.package_image = req.file.filename;
    }

    const package = await Package.findByIdAndUpdate(package_id, updateData, { new: true });

    res.status(200).json({
        status: "success",
        data: {
            package
        }
    });
}

exports.deletePackage = async (req, res) => {
    if (!packageValidate.deletePackageValidate(req, res)) return;
    
    await Package.findByIdAndDelete(req.body.package_id);
    
    res.status(200).json({
        status: "success",
        message: "Package deleted successfully"
    });
}
