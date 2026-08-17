const adminposition = [
    "manager",          // to manage the company
    "supervisor",       // to supervise the staff
    "customer-support", // to support the customers
    "accountant"        // to handle the accounts
];

const vendorposition = [
    "tour-guide",       // to guide the tourists
    "driver",           // to drive the tourists
    "event-organizer",  // to organize the events
    "photographer",     // to take photos of the tourists
    "translator",       // to translate for the tourists
    "hospitality"       // to welcome the tourists
];

const allowedRoles = Object.freeze({
    "admin": adminposition,
    "vendor": vendorposition
});

/**
 * @param {string} role - The user's role (e.g., "admin", "vendor")
 * @returns {Array<string>|boolean} - Array of allowed positions, or false if invalid
 */
const staffposition = function (role) {
    return allowedRoles[role] || false;
};

module.exports = {
    staffposition,
    adminposition,
    vendorposition
};