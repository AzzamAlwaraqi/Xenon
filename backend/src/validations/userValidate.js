const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../Models/UserModel");
exports.loginValidate = async (req, res, next) => {
    try {
       const {email,password} = req.body;
       if(!email || !password){
           res.status(400).json({message:"Please enter email and password"});
       }
        const user = await User.findOne({email}).select("+password");
        if(!user){
            res.status(400).json({message:"User not found"});
        }
        const isMatch = await bcrypt.compare(password,user.password);

        if(!isMatch){
            res.status(400).json({message:"Invalid password"});
        }
        if(user.isActive){
            res.status(400).json({message:"User is inactive"});
        }
        
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};