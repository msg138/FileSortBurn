# File Sort Burn

Organize files from directory 'input/' into multiple directories with max size in 'output/'
Directories in 'output/' are then used for burning to disk(s)

Essentially, any files you place into 'input/' will be moved to several directories of maxSize (specified by you) in 'output/',
which is then used to create an ISO (GPG encrypted tar.gz) to burn to a disk. Will store a tree of files on the disk in 'tree/' folder.

## Getting Started

First, clone the Github repo,
```
git clone https://github.com/msg138/FileSortBurn.git
```
And move into the new directoy to proceed,
```
cd FileSortBurn
```

Next, make sure you have the proper npm modules installed,
```
npm install
```

Then to ensure that the directories are made, run init,
```
npm run init
```

Then you can run with this syntax,
```
node scansort.js <Folder Size In Megabytes> [-s to hide output]
```

BEFORE running, you will need to set the user for GPG keys (should be an email), this is at the top of the scansort.js file.

### Prerequisites

Required NodeJS Npm modules,
```
npm install readline-sync
npm install fs
```

## Running

BEFORE running, you will need to set the user for GPG keys (should be an email), this is at the top of the scansort.js file.

To run this, requires 2 arguments, the max size for the output folders (presumably max CD size), and if you want to hide output,
```
node scansort.js <Folder Size In Megabytes> [-s to hide output]
```

## Built With

* [readline-sync](https://www.npmjs.com/package/readline-sync) - Used for synchronous input

## Authors

* **Michael George** - *Initial work* - [msg138](https://github.com/msg138)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

