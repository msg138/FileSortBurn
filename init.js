// Used to ensure input / output directories are made

// Get our File System module.
const fs = require('fs');

// Make input directory
if(!fs.existsSync('input'))
  fs.mkdirSync('input');

// Make output directory
if(!fs.existsSync('output'))
  fs.mkdirSync('output);

// Make our tree directory
if(!fs.existsSync('tree'))
  fs.mkdirSync('tree');

console.log('FIN');
