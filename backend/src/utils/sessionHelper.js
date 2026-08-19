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

    if ( checkRole(userRole ,['user']) && device_type !== 'mobile') {
        throw new AppError("Access Denied: Clients can only access the platform via the Xenon Mobile App.", 403);
    }

    if ( checkRole(userRole ,['vendor', 'admin']) && device_type !== 'web') {
        throw new AppError("Access Denied: Vendors and Admins must access the platform via the Xenon Web Dashboard.", 403);
    }

    return {
        ip_address,
        user_agent,
        device_type,
        os_name,
        browser_name,
        device_id
    };
};