const fs = require('fs');
const path = require('path');
const dir = './tests/Models';
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('.test.js')) {
        let content = fs.readFileSync(path.join(dir, file), 'utf8');
        // We will look for 00000000-0000-0000-0000- followed by exactly 12 alphanumeric characters
        // Note: some of my mocks used exactly 12 characters, some used 36 char replacements.
        // Let's just catch all that look like 00000000-0000-0000-0000-[0-9a-zA-Z]{12}
        content = content.replace(/00000000-0000-0000-0000-[0-9a-zA-Z]{12}/g, '018c1c4e-9d2f-7f7e-8000-111111111111');
        fs.writeFileSync(path.join(dir, file), content);
    }
});
console.log('Done replacing UUIDs');

