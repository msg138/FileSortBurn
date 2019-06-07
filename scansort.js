/*jslint ES6 */
// Set our global defaults
// Get our File System object
const fs = require('fs');

// Get the child process exec sync (we use sync, to make it easier to ensure things were done.
const exec = require('child_process').execSync;

// Max File Size in Megabytes
let maxFileSize = 700;

// If there should be output whilst running.
let verbose = true;

// First get our arguments
if(process.argv.length > 2) {
  // FIrst arg will be max size
  maxFileSize = parseInt(process.argv[2], 10);
  // If there is another argument check it.
  if(process.argv.length > 3) {
    // Get the 'silent' argument to hide output.
    verbose = !(process.argv[3] == '-s');
  }
}

// Function to get File List
// dir => string of directory name
// fileList => Used for recursive functionality, can be undefined.
function getFileList(dir, fileList){
  // If our directory wasn't specified, get current working directory.
  if(dir === undefined)
    dir = process.cwd();
  // Ensure the directory name ends with a trailing slash
  if(dir[dir.length - 1] != '/')
    dir = dir + "/";

  // Set our file list if undefined.
  fileList = fileList || [];
  
  // Get a list of files in the directory
  let files = fs.readdirSync(dir);
  // Loop through each file to find directories and go into them.
  files.forEach(function(file) {
    // Default stats, in case fs.statSync fails
    let stats = { size: 0, isDirectory: function(){ return false; } };
    // Try to get stats for file / directory
    try{ stats = fs.statSync(dir + file); } catch (e) {};
    // If it is a directory, recurse with our current file list and the new directory
    if(stats.isDirectory()) {
      fileList = getFileList(dir + file + '/', fileList);
    }
    else {
      // Otherwise, push our file into an object with file name and size.
      fileList.push({
        fname: dir + file,
        fsize: stats.size
      });
    }
  });
  // Return our resulting file list.
  return fileList;
}

// Get the size of all files added in a directory
// dir => string for directory to be read.
function directorySize(dir) {
  // Get a complete list of all files in directory
  let flist = getFileList(dir);
  // keep track of our total size
  let total_size = 0;
  for(var l in flist){
    // Add the file size to the total size.
    total_size + flist[l].fsize;
  }
  // return our total size.
  return total_size;
}

// Get a file object in directory, that is less than size 
// dir => String for directory to be searched
// size => Size in bytes to find a file smaller than.
function getFileUnderSize(dir, size){
  // Get all files in directory.
  let flist = getFileList(dir);
  // Loop through all the files to find one with a fsize lower than size (in bytes)
  for(var l in flist){
    if(flist[l].fsize < size) {
      return flist[l];
    }
  }
  // If there was no file found under the size, return false.
  return false;
}

// Generate a random directory name
// dir => Output directory for the new directory to be made.
function generateDirName(dir){
  log('Generating directory in ' + dir);
  // If the output directory doesn't exist, return false
  if(!fs.existsSync(dir))
    return false;
  // Ensure the directory name ends with trailing slash
  if(dir[dir.length -1] != '/')
    dir = dir + '/';
  // Options that can be used while generating directory name
  let options = '1234567890abcdef';
  // Keep track of directory name generated
  let dirName = '';
  do {
    // Reset dirName
    dirName = '';
    // Loop through for 16 characters and add a random character from options to the string
    for(let i=0;i<16;i++)
      dirName += options[Math.floor(Math.random() * options.length)];
    // Check if the directory already exists, if it does, will keep running.
  } while (fs.existsSync(dir + dirName))
  // Make our new directory
  fs.mkdirSync(dir + dirName);
  log('Directory made: ' + dir + dirName);
  // Return the new directory name (with the output directory prefixed)
  return dir + dirName + '/';
}

// Make sure a directory exists
// dir => String of directory that should exist
function makeDirectoryExist(dir) {
  // If the directory already exists, return true
  if(fs.existsSync(dir))
    return true;
  try{
    // Try to make the directory
    fs.mkdirSync(dir, {'recursive': true});
  } catch(e) {
    // If the directory could not be made, and it is the base folder, return false.
    if(dir.indexOf('/') == -1)
      return false;
    // Recurse up to the last folder name
    makeDirectoryExist(dir.substring(0, dir.lastIndexOf('/')));
    // Try to make directory again. If this fails, something is wrong.
    fs.mkdirSync(dir);
  }
  // Return true that we succeeded.
  return true;
}

// Move files from an input directory, into an output directory with random folder names under size.
// inDir => string of input directory location
// maxSize => maximum size in bytes for the output folder.
// outDir => Output directory for folders.
function moveFiles(inDir, maxSize, outDir) {
  // Ensure that the input and output directory exist
  if(!fs.existsSync(inDir) || !fs.existsSync(outDir))
    return false;
  // First create a tree so we know where files were originally
  generateTree(inDir, 'tree');
  log('Moving files from ' + inDir + ' to ' + outDir + ' with MaxFolderSize of ' + maxSize);
  let fileList = undefined;
  let currentDir = undefined;
  let currentDirSize = 0;
  
  // SEt our file list and check if there are files inside.
  while((fileList = getFileList(inDir)).length > 0) {
    // If we don't have a current Directory, set it here and reset dirSize
    if(currentDir == undefined) {
      currentDir = generateDirName(outDir);
      currentDirSize = 0;
    }
    // Get a file under the remaining size we have for the new directory.
    let cfile = getFileUnderSize(inDir, maxSize - currentDirSize);
    if(cfile != false) {
      // Move File
      log('Moving file: ' + cfile.fname);
      // Generate new file name without the input directory
      let newFile = cfile.fname.replace(inDir + '/', '');
      // Make sure the output directory exists.
      makeDirectoryExist(currentDir + newFile.substring(0, newFile.lastIndexOf('/')));
      // Move the file.
      fs.rename(cfile.fname, currentDir + newFile.substring(newFile.lastIndexOf('/') + 1));
      // Increment our current directory size by file size
      currentDirSize += cfile.fsize;
      log('Filed moved with size: ' + cfile.fsize);
      // Check if old directory is empty.
      let nfiles = getFileList(cfile.fname.substring(0, cfile.fname.lastIndexOf('/')));
      if(nfiles.length <= 0 && cfile.fname.substring(0, cfile.fname.lastIndexOf('/')) != inDir) {
        // If old directory is empty, remove it.
        //fs.rmdirSync(cfile.fname.substring(0, cfile.fname.lastIndexOf('/')));
        exec('rm -r '+ cfile.fname.substring(0, cfile.fname.lastIndexOf('/')));
      }
    } else if(currentDirSize == 0)
    {
      // If there are no files smaller than max size, we quit.
      log('Unable to find a file that is small enough. Quitting.')
      break;
    }else {
      // If the folder is filled, we reset our current directory.
      log('Folder filled. Moving to next directory');
      // Go to a new directory for output.
      currentDir = undefined;
    }
  }
  log('Fin');
}
// Log message if we have verbose set to true
// msg => message to log
function log(msg){
  if(!verbose)
    return;
  console.log(msg);
}

// Initiate our move files, with default input and output directories.
moveFiles('input', maxFileSize * 1000000, 'output');

// Get our readline sync library.
const readlineSync = require('readline-sync');

// keep track of the GPG key  email
const user = '';

// Keep track of the device for the CD drive
let globalDev = '';

// Now for functions related to writing to disk.
function createISO(absDir, remove) {
  // FIrst create tar.
  let ffname = absDir.substring(absDir.lastIndexOf('/')+1);
  // Generate a tree of directory that will be archived.
  generateTree(absDir, 'tree');

  // Generate a tar gzip archive of the folder.
  log('Generating tar archive...');
  exec('tar czf ' + ffname + '.tar.gz ' + absDir);
  // Encrypt using GPG key of user.
  log('Creating gpg...');
  exec('gpg -e -r ' + user + ' ' + ffname + '.tar.gz');
  // Remove our old tar.gz
  log('Removing tar.');
  exec('rm ' + ffname + '.tar.gz');
  // Run command to generate ISO
  log('Making ISO...');
  exec('mkisofs -o ' + ffname + '.iso -J -R -A -V -v ' + ffname + '.tar.gz.gpg');
  log('Complete!');
  // If we are to remove the directory, do that.
  if(remove == true) {
    log('Removing directory...');
    exec('rm -r ' + absDir);
    log('Removed.');
  }
}

// Prepare to burn disks.
function prepBurnDisk() {
  // Print out our cd roms attached.
  console.log(exec('cdrecord -scanbus').toString());
  // Get our device from readlinesync
  globalDev = readlineSync.question('Which Device? ');
  // Return our CD ROM device.
  return globalDev;
}

// Generate a tree of directory
// absDir => Directory to generate tree for
// out => Output for tree file
function generateTree(absDir, out) {
  log('Creating tree...');
  exec('tree ' + absDir + ' > ' + out + '/tree_' + absDir.substring(absDir.lastIndexOf('/')+1));
  log('Tree created.');
}

// Burn a disk of filename and to device.
// absDir => Directory to be burning (used to get the gpg.iso filename
// dev => CD ROM Device
function burnDisk(absDir, dev) {
  log('Burning disk: ' + absDir + ' to dev: ' + dev);
  exec('cdrecord -v -eject speed=4 dev=' + dev + ' ' + absDir.substring(absDir.lastIndexOf('/') + 1) + '.iso');
  log('Disk burnt.');
}

// Remove files for filename
// absDir => Directory that was burnt, used to get iso, and gpg filenames.
function removeFiles(absDir) {
  log('Removing files...')
  // REmove the iso
  exec('rm ' + absDir.substring(absDir.lastIndexOf('/') + 1) + '.iso');
  // REmove the GPG
  exec('rm ' + absDir.substring(absDir.lastIndexOf('/') + 1) + '.tar.gz.gpg');
  log('Removed gpg and iso files.');
}

// Burn disks for all directories in outDir
// outDir => Directory to use for burning multiple disks
function burnDisks(outDir){
  // Get all folder names in directory
  let list = fs.readdirSync(outDir);

  if(outDir[outDir.length - 1] != '/')
    outDir = outDir + '/';

  log('Burning disks: ' + list.length);
  log('Getting device...');
  // Get our global Device for CD ROM
  let dev = prepBurnDisk();
  log('Device: "' + dev + '"');
  for(let f in list){
    log('Creating ISO for ' + list[f]);
    // Create our iso
    createISO(outDir + list[f], true);
    log('ISO created. Burning disk now...');
    // Burn the ISO
    burnDisk(outDir + list[f], dev);
    log('Burnt disk ' + list[f]);
    // Remove the unneeded files now.
    removeFiles(outDir + list[f]);
    // Wait for input before proceeding (enough time to load new disk)
    readlineSync.question('Press enter when ready to continue. (Load a new disk fam)');
  }
  log('Finnn');
}

// Initiate burn disks for the output directory.
burnDisks('output');

