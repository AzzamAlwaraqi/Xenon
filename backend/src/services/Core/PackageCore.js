exports.getAllPackages = function(req, res) {

    const packages = Package.find();
    return packages;
}

exports.getPackage = function(req, res,package_id) {
    const package = Package.findById(package_id);
    return package;
}

exports.updatePackage = function(req, res,package_id) {
    const { package_name, package_price, startDate, endDate, package_status } = req.body;
    const package = Package.findByIdAndUpdate(package_id, {
        package_name,
        package_price,
        startDate,
        endDate,
        package_status
    }, { new: true });
    return package;
}

exports.deletePackage = function(req, res,package_id) {
    const package = Package.findByIdAndUpdate(package_id, { isDeleted: true }, { new: true });
    return package;
}

exports.createPackage = function(req, res) {
    const { package_name, package_price, package_description, package_type, package_status } = req.body;
    const package = Package.create({
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