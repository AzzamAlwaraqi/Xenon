/**
 * @param {string} userRole - دور المستخدم الحالي (مثال: 'user', 'vendor')
 * @param {Array} allowedRoles - مصفوفة الأدوار المسموح لها بالوصول
 * @returns {boolean}
 */
const checkRole = function (userRole, allowedRoles = ["admin", "vendor", "user"]) {
    // حماية إضافية: التأكد من أن allowedRoles هي مصفوفة فعلية لمنع انهيار السيرفر
    if (!Array.isArray(allowedRoles)) {
        return false;
    }
    
    // إرجاع true إذا كان الدور موجوداً، و false إذا لم يكن
    return allowedRoles.includes(userRole);
};

// تصدير دالة واحدة فقط لأنها تكفي لكل الحالات
module.exports = checkRole;