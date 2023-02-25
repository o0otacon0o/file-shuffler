// Modules to control application life and create native browser window
const { app, BrowserWindow, dialog, shell } = require("electron");
const url = require("url");
const path = require("path");
const { ipcMain } = require("electron");
const fs = require("fs");

let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  mainWindow.removeMenu();

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

let chosenPath;
let foundFiles;
let foundFilesCount;
let usedRandomNumbers;
let destinationPathPart = "_SHUFFLED";

ipcMain.on("showFolderPicker", (event, arg) => {
  dialog
    .showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    })
    .then((result) => {
      readAllFilenamesOfSourceDirectory(result.filePaths[0]);
    })
    .catch((err) => {
      console.error(err);
    });

  function readAllFilenamesOfSourceDirectory(path) {
    console.info(path);

    chosenPath = path;

    foundFiles = fs.readdirSync(path);
    console.info(foundFiles);

    foundFilesCount = foundFiles.length;
    event.reply("gotFolderAndFileCount", [path, foundFilesCount]);
  }
});

ipcMain.on("shuffleFilesInChosenFolder", (event, arg) => {
  if (chosenPath !== null && chosenPath !== undefined) {
    shuffleFiles();
  } else {
    event.reply("noFolderSelected");
  }

  function shuffleFiles() {
    let mapOfFiles = new Map();
    let countOfCopiedFiles = 0;
    let destinationPath = path.join(chosenPath, destinationPathPart);

    usedRandomNumbers = new Set();

    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath);
    } else {
      fs.readdirSync(destinationPath).forEach(foundPath => {
        fs.unlinkSync(path.join(destinationPath, foundPath));
      });
    }

    foundFiles.forEach((currentFile) => {
      if (
        currentFile.includes(".txt") ||
        currentFile.includes(".mp3") ||
        currentFile.includes("MP3")
      ) {
        let newFileName = addRandomNumber() + "_" + currentFile;

        mapOfFiles.set(currentFile, newFileName);

        fs.copyFileSync(
          path.join(chosenPath, currentFile),
          path.join(destinationPath, newFileName),
          fs.constants.COPYFILE_EXCL
        );

        countOfCopiedFiles++;
      }
    });

    setTimeout(() => {
      shell.openPath(destinationPath);
    }, 1000);

    mainWindow.webContents.send("finishedShuffling", [
      countOfCopiedFiles,
      destinationPath,
    ]);
  }

  function addRandomNumber() {
    let max = foundFilesCount * 1000;
    let randomNumber;

    do {
      randomNumber = Math.floor(Math.random() * Math.floor(max));
    } while (usedRandomNumbers.has(randomNumber));

    return randomNumber;
  }
});
