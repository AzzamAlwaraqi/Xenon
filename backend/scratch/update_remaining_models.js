const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../src/Models');

// Helper to update a file
function updateFile(filename, replacements) {
    const filePath = path.join(modelsDir, filename);
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    let updated = false;
    for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
            content = content.replace(regex, replacement);
            updated = true;
        }
    }
    
    if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated ${filename}`);
    } else {
        console.log(`⚠️ No changes made to ${filename}`);
    }
}

// VendorModel Updates
updateFile('VendorModel.js', [
    {
        regex: /vendor_company:\s*{\s*type:String,\s*unique:true,\s*required:true\s*}/,
        replacement: `vendor_company:{
        type:String,
        unique:true,
        required:true,
        trim: true,
        minlength: [2, "Company name is too short"],
        maxlength: [150, "Company name is too long"]
    }`
    },
    {
        regex: /vendor_pincode:\s*{\s*type:\s*String,\s*required:\s*true\s*}/,
        replacement: `vendor_pincode: {
        type: String,
        required: true,
        trim: true,
        match: [/^[0-9]+$/, "Pincode must contain only numbers"]
    }`
    }
]);

// BookingModel Updates
updateFile('BookingModel.js', [
    {
        regex: /total_price:\s*{\s*type:\s*Number,\s*required:\s*true\s*}/,
        replacement: `total_price: {
        type: Number,
        required: true,
        min: [0, "Total price cannot be negative"]
    }`
    }
]);

// BookingPaymentModels Updates
updateFile('BookingPaymentModels.js', [
    {
        regex: /amount:\s*{\s*type:\s*Number,\s*required:\s*true\s*}/,
        replacement: `amount: {
        type: Number,
        required: true,
        min: [0, "Payment amount cannot be negative"]
    }`
    }
]);

console.log("Mongoose constraints applied to key tables.");
