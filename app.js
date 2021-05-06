//@ts-check
const { app, BrowserWindow, /* session, */ protocol } = require("electron");
const isDev = require("electron-is-dev");
//const { URL } = require("url");
const path = require("path");

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true } },
]);

let SCHEME = "app";
let PROTOCOL = SCHEME + "://";
let URL_ROOT = PROTOCOL + "lab/";
let FILE_ROOT = PROTOCOL + "local/";
let RES_PATH = app.getAppPath();

const BASE_RES_PATH = "ui/dist/";
const UI_INDEX_HTML = BASE_RES_PATH + `index.html`;
const BASE_URL = URL_ROOT + UI_INDEX_HTML;

/**
 * @type Electron.BrowserWindow
 */
let mainWindow;

function initWindow() {
  mainWindow = new BrowserWindow({
    width: isDev ? 2000 : 1000,
    height: isDev ? 2000 : 800,
    title: "Lab app",
    webPreferences: {
      nodeIntegration: false,
      nativeWindowOpen: true,
    },
  });
  // register protocol
  protocol.registerFileProtocol(SCHEME, (req, callback) => {
    let url = req.url;
    /**
     * @type Electron.ProtocolResponse
     */
    let cbOptions = {};
    // Strip query and hash components
    if (url.indexOf("?") > 0) {
      url = url.substr(0, url.indexOf("?"));
    }
    if (url.indexOf("#") > 0) {
      url = url.substr(0, url.indexOf("#"));
    }

    if (url.indexOf(URL_ROOT) === 0) {
      url = decodeURIComponent(url.substr(URL_ROOT.length));
      console.log(url);
      // Uncomment here to make the the not working page work
      // ----
      if (!url.startsWith(BASE_RES_PATH)) {
        url = BASE_RES_PATH + url;
      }
      // ----
      url = path.join(RES_PATH, url);
      cbOptions = { path: url };
    } else if (url.indexOf(FILE_ROOT) === 0) {
      url = decodeURIComponent(url.substr(FILE_ROOT.length));
      url = path.resolve(url);
      cbOptions = { path: url };
    }
    console.log("callback %O", cbOptions);
    callback(cbOptions);
  });

  /* protocol.interceptHttpProtocol(PROTOCOL_PREFIX, (request, callback) => {
    console.log("intercept http", request);
    callback({
      statusCode: 307,
      headers: {
        Location: new URL(
          "file://" + path.join(__dirname, UI_INDEX_HTML)
        ).toString(),
      },
    });
  }); */

  /* protocol.interceptFileProtocol(PROTOCOL_PREFIX, (request, callback) => {
    let url;
    let data = "";
    let _url = new URL(request.url);
    console.log(_url);
    if (_url.pathname.startsWith("/ui/")) {
      url = path.join(__dirname, _url.pathname);
      data = fs.readFileSync(url, "utf-8");
    }
    console.log("url after intercept", url);
    callback({ path: url, data });
  }); */

  console.log("loadUrl", BASE_URL);
  mainWindow.loadURL(BASE_URL);
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.once("ready", () => {
    initWindow();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  app.on("activate", function () {
    if (mainWindow === null) {
      initWindow();
    }
  });

  // Close when all windows are closed.
  app.on("window-all-closed", async function () {
    // On macOS specific close process
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
