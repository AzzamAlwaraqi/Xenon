// ==========================================
// 📊 Constants & Allowed Arrays (الثوابت)
// ==========================================
const DEFAULT_VENDOR_STATUSES = ["pending", "accepted", "rejected", "suspended", "pending_deletion", "deleted", "downgraded"];
const DEFAULT_REPORT_STATUSES = ["pending", "resolved", "dismissed", "escalated", "rejected", "closed", "assigned", "reopened"];
const DEFAULT_BOOKING_STATUSES = ["pending", "accepted", "rejected", "completed", "cancelled"];
const TERMINAL_REPORT_STATUSES = ["resolved", "dismissed", "closed", "rejected"];
const DEFAULT_ROLES = ["admin", "vendor", "user"];

const STAFF_POSITIONS = Object.freeze({
    admin: ["manager", "supervisor", "customer-support", "accountant"],
    vendor: ["tour-guide", "driver", "event-organizer", "photographer", "translator", "hospitality"]
});

/**
 * @param {string} value - The value to check
 * @param {Array} allowedArray - Array of allowed values
 * @returns {boolean}
 */
const isValid = (value, allowedArray) => {
    if (!Array.isArray(allowedArray)) return false;
    return allowedArray.includes(value);
};

exports.checkVendorStatus = (status, allowedStatuses = DEFAULT_VENDOR_STATUSES) => {
    return isValid(status, allowedStatuses);
};

exports.checkReportStatus = (status, allowedStatuses = DEFAULT_REPORT_STATUSES) => {
    return isValid(status, allowedStatuses);
};

exports.checkStatus = (status, allowedStatuses = DEFAULT_BOOKING_STATUSES) => {
    return isValid(status, allowedStatuses);
};

exports.checkTerminalStatus = (status, allowedStatuses = TERMINAL_REPORT_STATUSES) => {
    return isValid(status, allowedStatuses);
};

exports.checkRole = (userRole, allowedRoles = DEFAULT_ROLES) => {
    const role = (typeof userRole === 'object' && userRole !== null) ? userRole.role : userRole;
    return isValid(role, allowedRoles);
};

exports.staffPosition = (role) => {
    return STAFF_POSITIONS[role] || false;
};

exports.STAFF_POSITIONS = STAFF_POSITIONS;