const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../src/Models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if versionKey is already there
    if (!content.includes('versionKey:')) {
        // Find timestamps: true and add versionKey: false after it
        // Handle case 1: { timestamps: true } -> { timestamps: true, versionKey: false }
        // Handle case 2: timestamps: true, -> timestamps: true, versionKey: false,
        content = content.replace(/(timestamps:\s*true\s*,?)/g, '$1 \n    versionKey: false,');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`Skipped ${file} (already has versionKey)`);
    }
});
