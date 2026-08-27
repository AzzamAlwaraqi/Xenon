const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../src/Models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes("strict: false")) {
        content = content.replace(/strict:\s*false/g, "strict: 'throw'");
    } else if (content.includes("strict: true")) {
        content = content.replace(/strict:\s*true/g, "strict: 'throw'");
    } else {
        // Find timestamps: true, and add strict: 'throw'
        content = content.replace(/(timestamps:\s*true\s*,)/g, "$1\n    strict: 'throw',");
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file} to strict: 'throw'`);
});
