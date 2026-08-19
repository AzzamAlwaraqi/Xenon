const fs = require('fs');
const path = require('path');

const coreDir = path.join(__dirname, 'src', 'services', 'Core');
const controllersDir = path.join(__dirname, 'src', 'controllers');

// Function to recursively find all files in a directory
const getAllFiles = (dirPath, arrayOfFiles) => {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles;
};

const coreFiles = getAllFiles(coreDir);
const controllerFiles = getAllFiles(controllersDir);

const exportedFunctions = {}; // file -> [funcs]

// Regex to find exports
const exportRegex = /exports\.([a-zA-Z0-9_]+)\s*=/g;

coreFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    const funcs = [];
    while ((match = exportRegex.exec(content)) !== null) {
        funcs.push(match[1]);
    }
    if (funcs.length > 0) {
        exportedFunctions[file] = funcs;
    }
});

const unlinked = {};

Object.keys(exportedFunctions).forEach(file => {
    const funcs = exportedFunctions[file];
    const unused = [];
    funcs.forEach(func => {
        let isUsed = false;
        controllerFiles.forEach(cFile => {
            const content = fs.readFileSync(cFile, 'utf8');
            if (content.includes(func)) {
                isUsed = true;
            }
        });
        if (!isUsed) {
            unused.push(func);
        }
    });
    if (unused.length > 0) {
        unlinked[path.basename(file)] = unused;
    }
});

console.log(JSON.stringify(unlinked, null, 2));
