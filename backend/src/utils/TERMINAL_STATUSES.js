/**
 * @param {string} status - update status only allowed for these statuses (e.g., "pending", "accepted", "rejected", "completed")
 * @param {Array} allowedStatuses - array of statuses allowed to transition from or to (e.g., ["pending", "accepted", "rejected", "completed"])
 * @returns {boolean}
 */
const TERMINAL_STATUSES = ["resolved", "dismissed", "closed", "rejected"];

const checkTerminalStatus = function (status, allowedStatuses = TERMINAL_STATUSES) {
    if (!Array.isArray(allowedStatuses)) {
        return false;
    }
    return allowedStatuses.includes(status);
};

module.exports = checkTerminalStatus;