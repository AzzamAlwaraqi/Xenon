
const setStandardDate = (val) => {
    if (!val) return val;
    
    if (typeof val === 'string' && val.includes('/')) {
        const [day, month, year] = val.split('/');
        
        return new Date(year, month - 1, day);
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