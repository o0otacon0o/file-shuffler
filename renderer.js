// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { ipcRenderer } = require("electron");

document.addEventListener("DOMContentLoaded", () => {
  let folderPicker = document.getElementById("folder-picker");
  let fileShuffler = document.getElementById("shuffle-files");
  let statusParagraph = document.getElementById("status-p");
  let endStatusParagraph = document.getElementById("end-status-p");

  folderPicker.addEventListener("click", () => {
    openFolder();
  });

  function openFolder() {
    ipcRenderer.send("showFolderPicker");
  }

  ipcRenderer.on("selectedFolder", (event, arg) => {
    statusParagraph.innerHTML =
      arg !== undefined
        ? JSON.stringify(arg)
        : "received selectedFolder but no paths";

    if (arg.canceled === false) {
      console.info(arg.filePaths);

      statusParagraph.innerHTML = "";
      statusParagraph.hidden = true;
    } else {
      statusParagraph.innerHTML = "Kein Ordner ausgewählt";
      statusParagraph.hidden = false;
    }
  });

  ipcRenderer.on("gotFolderAndFileCount", (event, arg) => {
    endStatusParagraph.hidden = true;
    statusParagraph.hidden = false;
    statusParagraph.innerHTML =
      "Ordner <strong>" +
      arg[0] +
      "</strong> wurde augewählt und umfasst <strong>" +
      arg[1] +
      "</strong> Dateien";
  });

  fileShuffler.addEventListener("click", () => {
    shuffleFiles();
  });

  function shuffleFiles() {
    ipcRenderer.send("shuffleFilesInChosenFolder");
  }

  ipcRenderer.on("noFolderSelected", (event, arg) => {
    endStatusParagraph.innerHTML = "Es wurde kein Ordner ausgewählt";
    endStatusParagraph.hidden = false;
    setTimeout(() => {
      endStatusParagraph.innerHTML = "";
      endStatusParagraph.hidden = true;
    }, 3000);
  });

  ipcRenderer.on("finishedShuffling", (event, arg) => {
    endStatusParagraph.hidden = false;
    endStatusParagraph.innerHTML =
      "<strong>" +
      arg[0] +
      '</strong> Dateien<br>wurden gemischt und in<br>Ordner <strong>' +
      arg[1] +
      '</strong><br>gespeichert';
  });
});
