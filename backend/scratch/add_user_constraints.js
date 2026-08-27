const fs = require('fs');
const path = require('path');

const userModelPath = path.join(__dirname, '../src/Models/UserModel.js');
let content = fs.readFileSync(userModelPath, 'utf8');

content = content.replace(
    /email:\s*{\s*type:\s*String,\s*required:\s*true,\s*unique:\s*true,\s*lowercase:\s*true,\s*trim:\s*true\s*}/,
    `email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/, 'Please enter a valid email address']
    }`
);

content = content.replace(
    /mobileNumber:\s*{\s*type:\s*String,\s*minlength:\s*\[10, 'the phone number must be 10 digits'\],\s*maxlength:\s*\[10, 'the phone number must be 10 digits'\],\s*required:\s*true,\s*unique:\s*true\s*}/,
    `mobileNumber: {
        type: String,
        minlength: [10, 'the phone number must be 10 digits'],
        maxlength: [10, 'the phone number must be 10 digits'],
        match: [/^[0-9]{10}$/, 'Phone number must contain exactly 10 digits'],
        required: true,
        unique: true
    }`
);

fs.writeFileSync(userModelPath, content, 'utf8');
console.log("UserModel updated successfully.");
