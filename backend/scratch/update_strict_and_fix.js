const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../src/Models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix missing comma after timestamps: true (from previous script run)
    content = content.replace(/timestamps:\s*true\s*\n/g, 'timestamps: true,\n');

    // Make sure we have strict: false everywhere
    if (content.includes('strict: true')) {
        content = content.replace(/strict:\s*true/g, 'strict: false');
    } else if (!content.includes('strict: false')) {
        // Insert strict: false, right after timestamps: true,
        content = content.replace(/(timestamps:\s*true\s*,)/g, '$1\n    strict: false,');
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
});
