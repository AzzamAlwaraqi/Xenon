/**
 * @param {string|object} userRole 
 * @param {Array} allowedRoles 
 * @returns {boolean}
 */
const checkRole = function (userRole, allowedRoles = ["admin", "vendor", "user"]) {
    if (!Array.isArray(allowedRoles)) {
        return false;
    }
    
    const role = (typeof userRole === 'object' && userRole !== null) ? userRole.role : userRole;
    return allowedRoles.includes(role);
};

module.exports = checkRole;