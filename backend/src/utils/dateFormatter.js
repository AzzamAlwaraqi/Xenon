
const setStandardDate = (val) => {
    if (!val) return val;
    
    if (typeof val === 'string') {
        const separator = val.includes('/') ? '/' : (val.includes('-') ? '-' : null);
        if (separator) {
            const parts = val.split(separator);
            // Check if first part is a year (e.g., 2026)
            if (parts[0].length === 4) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                return new Date(year, month, day);
            } else {
                // Assume dd/mm/yyyy
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                return new Date(year, month, day);
            }
        }
    }
    
    return new Date(val);
};
const getStandardDate = (val) => {
    if (!val) return val;
    
    const day = String(val.getDate()).padStart(2, '0');
    const month = String(val.getMonth() + 1).padStart(2, '0'); 
    const year = val.getFullYear();
    
    return `${day}/${month}/${year}`;
};

const MongooseStandardDate = {
    type: Date,
    set: setStandardDate,
    get: getStandardDate
};

module.exports = {
    MongooseStandardDate,
    setStandardDate,
    getStandardDate
};