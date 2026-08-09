const checkRole = function (userRole, allowedRoles = ["admin", "vendor", "user"]) {
    return allowedRoles.includes(userRole);
};

module.exports = checkRole;