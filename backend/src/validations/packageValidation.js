const validate = require("../utils/Validation");

exports.createPackageValidate = async (req, res, next) => {
    const { package_name, package_price, package_description, startDate, endDate, package_type, package_status } = req.body;
    if (!package_name || !package_price || !package_description || !startDate || !endDate || !package_type || !package_status) {
        return res.status(400).json({
            status: "fail",
            message: "All fields are required"
        })
    }
    if(startDate > endDate){
        return res.status(400).json({
            status: "fail",
            message: "startDate must be less than endDate"
        })
    }
    if(package_type !== "flight" && package_type !== "hotel" && package_type !== "package"){
        return res.status(400).json({
            status: "fail",
            message: "package_type must be flight or hotel or package"
        })
    }

    if(req.file.size > 1024 * 1024 * 5){
        return res.status(400).json({
            status: "fail",
            message: "package_image size must be less than 5MB"
        })
    }
    if(req.file.mimetype !== "image/jpeg" && req.file.mimetype !== "image/png"){
        return res.status(400).json({
            status: "fail",
            message: "package_image must be jpeg or png"
        })
    }
    if(startDate < Date.now()){
        return res.status(400).json({
            status: "fail",
            message: "startDate must be greater than current date"
        })
    }
    if(endDate < Date.now()){
        return res.status(400).json({
            status: "fail",
            message: "endDate must be greater than current date"
        })
    }
    if(package_price < 0){
        return res.status(400).json({
            status: "fail",
            message: "package_price must be greater than 0"
        })
    }
    if(package_status !== "active" && package_status !== "inactive"){
        return res.status(400).json({
            status: "fail",
            message: "package_status must be active or inactive"
        })
    }
    if(!req.file){
        return res.status(400).json({
            status: "fail",
            message: "package_image is required"
        })
    }
    if(req.body.package_description.length > 1000){
        return res.status(400).json({
            status: "fail",
            message: "package_description must be less than 1000 characters"
        })
    }
    if(package_name.length > 100){
        return res.status(400).json({
            status: "fail",
            message: "package_name must be less than 100 characters"
        })
    }
    next();
}

exports.updatePackageValidate = async (req, res, next) => {
    const { package_price, startDate, endDate, package_status } = req.body;
   if(startDate){
    if(startDate > endDate){
        return res.status(400).json({
            status: "fail",
            message: "startDate must be less than endDate"
        })
    }
    if(startDate < Date.now()){
        return res.status(400).json({
            status: "fail",
            message: "startDate must be greater than current date"
        })
    }
   }
   if(endDate){
    if(endDate < Date.now()){
        return res.status(400).json({
            status: "fail",
            message: "endDate must be greater than current date"
        })
    }
   }
   if(package_price){
    if(package_price < 0){
        return res.status(400).json({
            status: "fail",
            message: "package_price must be greater than 0"
        })
    }
   }
   if(package_status){
    if(package_status !== "active" && package_status !== "inactive"){
        return res.status(400).json({
            status: "fail",
            message: "package_status must be active or inactive"
        })
    }
   }
   next();
}
exports.deletePackageValidate = async (req, res, next) => {
    const { package_id } = req.body;
    if(!package_id){
        return res.status(400).json({
            status: "fail",
            message: "package_id is required"
        })
    }
    next();
}
exp