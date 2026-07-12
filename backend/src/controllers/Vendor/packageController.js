const {packageValidate}=require("../../utils/Validation")
exports.createPackage = async (req, res) => {
    const { package_name, package_price, package_description, package_type, package_status } = req.body;
    await packageValidate(req.body);
    const package = await Package.create({
        package_name,
        package_price,
        package_description,
        startDate:req.body.startDate,
        endDate:req.body.endDate,
        package_image:req.file.filename,
        package_type,
        package_status
    });
    res.status(200).json({
        status: "success",
        data: {
            package,

        }
    })

}

exports.getAllPackages = async (req, res) => {

    res.status(200).json({
        
    })

}

exports.getPackage = async (req, res) => {

    res.status(200).json({
        
    })

}

exports.updatePackage = async (req, res) => {

    res.status(200).json({
        
    })

}

exports.deletePackage = async (req, res) => {

    res.status(200).json({
        
    })

}
