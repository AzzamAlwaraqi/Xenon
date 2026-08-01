const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Session = require("../Models/SessionModel");

const generateAuthTokens = async (res, user, fingerprintHash, deviceInfo, existingFamilyId = null) => {
    
    const accessToken = jwt.sign(
        { 
            id: user._id,
            fingerprint: fingerprintHash 
        }, 
        process.env.JWT_ACCESS_SECRET, 
        { expiresIn: "2m" } 
    );

    const tokenId = crypto.randomBytes(16).toString("hex"); 
    
    const familyId = existingFamilyId || crypto.randomBytes(16).toString("hex"); 

    const refreshToken = jwt.sign(
        { 
            id: user._id,
            tokenId: tokenId,
            familyId: familyId 
        }, 
        process.env.JWT_REFRESH_SECRET, 
        { expiresIn: "10m" }
    );

    await Session.create({
        session_id: familyId,
        user_id: user._id,
        token_id: tokenId,
        expires_at: new Date(Date.now() + 10 * 60 * 1000),
        ip_address: deviceInfo.ipAddress,
        user_agent: deviceInfo.userAgent,
        device_type: deviceInfo.deviceType,
        os_name: deviceInfo.osName,
        browser_name: deviceInfo.browserName,
        device_id: deviceInfo.deviceId,
        is_active: true
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        sameSite: 'strict', 
        maxAge: 10 * 60 * 1000 
    });

    return { accessToken };
};

module.exports = { generateAuthTokens };