const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el) && obj[el] !== undefined) {
            newObj[el] = obj[el];
        }
    });
    return newObj;
};