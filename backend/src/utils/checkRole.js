/**
 * @param {string} userRole 
 * @param {Array} allowedRoles 
 * @returns {boolean}
 */
const checkRole = function (userRole, allowedRoles = ["admin", "vendor", "user"]) {
    if (!Array.isArray(allowedRoles)) {
        return false;
    }
    
    return allowedRoles.includes(userRole);
};
module.exports = checkRole;