const AppError = require('../../../utils/AppError');
const multer = require("multer");
const sharp = require("sharp");
exports.getAllPackages = async function (req, res) {
    try{
    const packages = await Package.find();
    return packages;
    }
    catch(err){
        throw AppError(err.message, 400);
    }
}

exports.getPackage = async function (req, res, package_id) {
    try{
    const package = await Package.findById(package_id);
    return package;
    }
    catch(err){
        throw AppError(err.message, 400);
    }
}

exports.updatePackage = async function (req, res, package_id) {
   const { package_name, package_price, startDate, endDate, package_status } = req.body;
   try{
    const package = await Package.findByIdAndUpdate(package_id, {
        package_name,
        package_price,
        startDate,
        endDate,
        package_status
    }, { new: true });
    return package;
    }
    catch(err){
        throw AppError(err.message, 400);
    }
}

exports.deletePackage = async function (req, res, package_id) {
    try{
    const package = await Package.findByIdAndUpdate(package_id, { isDeleted: true }, { new: true });
    return package;
    }
    catch(err){
        throw AppError(err.message, 400);
    }
}

exports.createPackage = async function (req, res,) {
    try {
        const { package_name, package_price, package_description, package_type, package_status } = req.body;
        const package = await Package.create({
            package_name,
            package_price,
            package_description,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            package_image: req.file.filename,
            package_type,
            package_status
        });
        return package;
    }
    catch (err) {
        throw AppError(err.message, 400);
    }
}