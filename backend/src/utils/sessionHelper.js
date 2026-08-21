const UAParser = require('ua-parser-js');
const AppError = require('./AppError');
const checkRole = require('./checkvalidete');
/**
 * @param {Object} req 
 * @param {String} userRole 
 * @returns {Object} 
 */
exports.extractAndValidateSessionData = (req, userRole) => {
    const userAgentString = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgentString);
    const result = parser.getResult();

    const ip_address = req.ip || req.connection.remoteAddress || 'Unknown IP';
    const user_agent = userAgentString;
    const os_name = result.os.name || 'Unknown OS';
    const browser_name = result.browser.name || 'Unknown Browser';

    const device_id = req.headers['x-device-id'] || 'unknown-device-id';

    const parsedDeviceType = result.device.type;
    const isMobile = parsedDeviceType === 'mobile' || parsedDeviceType === 'tablet' || req.headers['x-client-type'] === 'mobile';

    const device_type = isMobile ? 'mobile' : 'web';



    return {
        ip_address,
        user_agent,
        device_type,
        os_name,
        browser_name,
        device_id
    };
};

exports.getDeviceType = (val) => val || "Desktop";
exports.calculateSessionExpiry = (val) => val || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
exports.getClientIp = (val) => val || "127.0.0.1";
exports.getUserAgent = (val) => val || "Unknown";
exports.getOsName = (val) => val || "Unknown";
exports.getBrowserName = (val) => val || "Unknown";
exports.getDeviceId = (val) => val || "unknown-device-id";
exports.getRole = (val) => val || "user";
exports.getIsActive = (val) => val !== undefined ? val : true;
exports.getSessionStatus = (val) => val || "active";
exports.getFamilyId = (val) => val || "unknown-family-id";
