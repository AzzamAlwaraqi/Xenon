const { loginValidate } = require("../validations/userValidate");
exports.login = (req, res) => {
    loginValidate(req, res);
    res.status(200).json({ message: "User logged in successfully" });
}