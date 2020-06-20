// Modules
const { autoUpdater } = require("electron-updater");
const { dialog, BrowserWindow, ipcMain } = require("electron");
// const token = process.env.GH_TOKEN;

// Enabling logger
autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";

// Disable auto downloader
autoUpdater.autoDownload = false;

// Check for updated
exports.check = () => {
  // autoUpdater.setFeedURL({
  //   provider: "github",
  //   owner: "Prince7195",
  //   repo: "readit",
  //   token,
  // });

  // Start checking for update
  autoUpdater.checkForUpdatesAndNotify();

  // Listen for download (update) found
  autoUpdater.on("update-available", () => {
    // Track progress percent
    let downloadProgress = 0;

    // Prompt user to update
    dialog
      .showMessageBox({
        type: "info",
        title: "Update Available",
        message:
          "A new version of Readit is available. Do you want to update now?",
        buttons: ["Update", "Cancel"],
      })
      .then((btnObj) => {
        const btnIndex = btnObj.response;
        autoUpdater.logger.info("Update Available: " + btnIndex);
        // If not 'Update' button return
        if (btnIndex !== 0) {
          return;
        }
        // Else start the download and show the progress in new window
        autoUpdater.downloadUpdate();

        // Create progress window
        let progressWin = new BrowserWindow({
          width: 350,
          height: 30,
          useContentSize: true,
          autoHideMenuBar: false,
          maximizable: false,
          fullscreen: false,
          fullscreenable: false,
          resizable: false,
          webPreferences: {
            nodeIntegration: true,
          },
        });

        progressWin.setMenuBarVisibility(false);

        // Load progress HTML
        progressWin.loadURL(`file://${__dirname}/renderer/progress.html`);

        // Handle win close
        progressWin.on("closed", () => {
          progressWin = null;
        });

        // listen for progress request from progressWin
        ipcMain.on("download-progress-request", (e) => {
          e.returnValue = downloadProgress;
        });

        //Track download progress on autoUpdater
        autoUpdater.on("download-progress", (d) => {
          autoUpdater.logger.info(d.percent);
          downloadProgress = d.percent;
        });

        // Listen for completed update downloaded
        autoUpdater.on("update-downloaded", (d) => {
          // Close progressWin
          autoUpdater.logger.info("Update downloaded");
          if (progressWin) {
            progressWin.close();
          }
        });

        // Promt user to quit and install
        dialog
          .showMessageBox({
            type: "info",
            title: "Update Ready",
            message: "A new version of Readit is ready. Quit and install now?",
            buttons: ["Yes", "Later"],
          })
          .then((btnObj) => {
            const btnIndex = btnObj.response;
            autoUpdater.logger.info("Update Ready: " + btnIndex);
            // Update If Yes
            if (btnIndex === 0) {
              autoUpdater.quitAndInstall();
            }
          });
      });
  });
};
