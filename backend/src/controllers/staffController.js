const staffCore = require("../services/Core/staffCore");

// ==========================================
// 🛡️ Staff Controller (Clean Architecture)
// ==========================================

exports.addStaff = async (req, res, next) => {
    try {
        const creatorRole = req.user.role; 
        const creatorId = req.user._id; 
        // الأدمن يمكنه تحديد vendor_id في الـ body، أما التاجر فيتم أخذ الـ vendor_id الخاص به إجبارياً
        const vendorId = creatorRole === 'admin' ? req.body.vendor_id : (req.user.vendor_id || req.user._id); 
        
        const result = await staffCore.addStaffCore(vendorId, creatorId, creatorRole, req.body);
        return res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

exports.updateStaff = async (req, res, next) => {
    try {
        const vendorId = req.user.role === 'admin' ? null : (req.user.vendor_id || req.user._id); 
        const isAdmin = req.user.role === 'admin';
        
        const result = await staffCore.updateStaffCore(req.params.id, vendorId, isAdmin, req.body);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getAllStaff = async (req, res, next) => {
    try {
        const vendorId = req.user.role === 'admin' ? req.query.vendor_id : (req.user.vendor_id || req.user._id); 
        const isAdmin = req.user.role === 'admin';
        
        const result = await staffCore.getAllStaffCore(vendorId, isAdmin);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.deleteStaff = async (req, res, next) => {
    try {
        const vendorId = req.user.role === 'admin' ? null : (req.user.vendor_id || req.user._id); 
        const isAdmin = req.user.role === 'admin';
        
        const result = await staffCore.deleteStaffCore(req.params.id, vendorId, isAdmin);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getStaff = async (req, res, next) => {
    try {
        const vendorId = req.user.role === 'admin' ? null : (req.user.vendor_id || req.user._id); 
        const isAdmin = req.user.role === 'admin';
        
        const result = await staffCore.getStaffCore(req.params.id, vendorId, isAdmin);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};