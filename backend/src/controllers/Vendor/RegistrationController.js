const RegisterationValidation = require("../validations/RegisterationValidate");
const { generateAuthTokens } = require("../utils/jwt"); 
const RegisterationService = require("../services/RegisterationService");
exports.login = async (req, res) => {
    await RegisterationValidation.loginValidate(req, res);
    await RegisterationService.loginService(req, res);
    return res.status(200).json({message:"User logged in successfully"});
}
exports.register = async (req, res) => {
    await RegisterationValidation.registerValidate(req, res);
    await RegisterationService.registerService(req, res);
    return res.status(200).json({message:"User registered successfully"});
}
exports.logout = async (req, res) => {
    await RegisterationValidation.logoutValidate(req, res);
    await RegisterationService.logoutService(req, res);
    return res.status(200).json({message:"User logged out successfully"});
}
exports.refresh = async (req, res) => {
    const { accessToken } = await generateAuthTokens(res, req.user, req.fingerprintHash, req.deviceInfo);
    return res.status(200).json({message:"User logged in successfully",accessToken});
}