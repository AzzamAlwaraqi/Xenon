const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * Generates an Access Token and a Refresh Token.
 * @param {string} userId - The user ID
 * @param {string} role - The user role
 * @param {string|null} existingFamilyId - An existing family ID if this is a refresh operation
 * @returns {object} { accessToken, refreshToken, tokenId, familyId }
 */
const generateAuthTokens = (userId, role, existingFamilyId = null) => {
    const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "default_access_secret";
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "default_refresh_secret";
    
    // 15 minutes for access token, 7 days for refresh token
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

    const accessToken = jwt.sign(
        { 
            id: userId,
            role: role
        }, 
        accessSecret, 
        { expiresIn: accessExpiresIn } 
    );

    const tokenId = crypto.randomBytes(16).toString("hex"); 
    const familyId = existingFamilyId || crypto.randomBytes(16).toString("hex"); 

    const refreshToken = jwt.sign(
        { 
            id: userId,
            tokenId: tokenId,
            familyId: familyId 
        }, 
        refreshSecret, 
        { expiresIn: refreshExpiresIn }
    );

    return { 
        accessToken, 
        refreshToken, 
        tokenId, 
        familyId 
    };
};

const verifyRefreshToken = (token) => {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || "default_refresh_secret";
    return jwt.verify(token, refreshSecret);
};

module.exports = { generateAuthTokens, verifyRefreshToken };