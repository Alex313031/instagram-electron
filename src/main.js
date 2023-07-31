// Modules to control application life and create native browser window
const { app, session, components, BrowserWindow, nativeTheme, Menu, ipcMain, dialog } = require('electron');
const contextMenu = require('electron-context-menu');
const electronLog = require('electron-log');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const Store = require('electron-store');
const  { ElectronBlocker, fullLists, Request } = require('@cliqz/adblocker-electron');

// Initialize Electron remote module
require('@electron/remote/main').initialize();

const menu = require('./menu');

// Export app version from package.json
var appVersion = app.getVersion();
// Export Electron versions
const electronVer = process.versions.electron;
const chromeVer = process.versions.chrome;
const nodeVer = process.versions.node;
const v8Ver = process.versions.v8;

// Globally export whether we are on Windows or not
const isWin = process.platform === 'win32';

const store = new Store();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

async function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
  width: 600,
  height: 900,
  resizable: true,
  maximizable: true,
  title: 'Instagram',
  icon: isWin ? path.join(__dirname, 'icon.ico') : path.join(__dirname, 'icon64.png'),
  darkTheme: store.get('options.useLightMode') ? false : true,
  vibrancy: store.get('options.useLightMode') ? 'light' : 'ultra-dark',
  webPreferences: {
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    // Must be disabled for preload script. I am not aware of a workaround but this *shouldn't* effect security
    contextIsolation: false,
    sandbox: false,
    experimentalFeatures: true,
    webviewTag: true,
    devTools: true,
    javascript: true,
    plugins: true,
    enableRemoteModule: true,
    preload: path.join(__dirname, 'client-preload.js'),
  },
  });
  require("@electron/remote/main").enable(mainWindow.webContents);

  // and load the index.html of the app.
  mainWindow.webContents.setUserAgent("Mozilla/5.0 (Linux; Android 4.2.1; en-us; Nexus 5 Build/JOP40D) AppleWebKit/537.36 (KHTML, like Gecko; googleweblight) Chrome/108.0.5359.215 Mobile Safari/537.36");
  mainWindow.loadURL('https://instagram.com/');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Create The Menubar
  Menu.setApplicationMenu(menu(store, mainWindow, app));

  if (store.get('options.useLightMode')) {
    nativeTheme.themeSource = 'light';
  } else {
    nativeTheme.themeSource = 'dark';
  }

  if (store.get('options.adblock')) {
    var engine = await ElectronBlocker.fromLists(fetch, fullLists);
    engine.enableBlockingInSession(session.defaultSession);
  } else {
    return;
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  });
}

contextMenu({
   // Chromium context menu defaults
   showSelectAll: true,
   showCopyImage: true,
   showCopyImageAddress: true,
   showSaveImageAs: true,
   showCopyVideoAddress: true,
   showSaveVideoAs: true,
   showCopyLink: true,
   showSaveLinkAs: true,
   showInspectElement: true,
   showLookUpSelection: true,
   showSearchWithGoogle: true,
   prepend: (defaultActions, parameters, browserWindow) => [
   { label: 'Open Video in New Window',
      // Only show it when right-clicking video
      visible: parameters.mediaType === 'video',
      click: (linkURL) => {
          const newWin = new BrowserWindow({
            title: 'New Window',
            width: 1024,
            height: 768,
            webPreferences: {
              nodeIntegration: false,
              nodeIntegrationInWorker: false,
              contextIsolation: false,
              sandbox: false,
              experimentalFeatures: true,
              webviewTag: true,
              devTools: true,
              javascript: true,
              plugins: true,
              enableRemoteModule: true,
            },
            darkTheme: store.get('options.useLightMode') ? false : true,
            vibrancy: store.get('options.useLightMode') ? 'light' : 'ultra-dark',
          });
          const vidURL = parameters.srcURL;
       newWin.loadURL(vidURL);
      }
   },
   { label: 'Open Link in New Window',
      // Only show it when right-clicking a link
      visible: parameters.linkURL.trim().length > 0,
      click: (linkURL) => {
          const newWin = new BrowserWindow({
            title: 'New Window',
            width: 1024,
            height: 768,
            webPreferences: {
              nodeIntegration: false,
              nodeIntegrationInWorker: false,
              contextIsolation: false,
              sandbox: false,
              experimentalFeatures: true,
              webviewTag: true,
              devTools: true,
              javascript: true,
              plugins: true,
              enableRemoteModule: true,
            },
            darkTheme: store.get('options.useLightMode') ? false : true,
            vibrancy: store.get('options.useLightMode') ? 'light' : 'ultra-dark',
          });
          const toURL = parameters.linkURL;
       newWin.loadURL(toURL);
      }
   }]
});

app.commandLine.appendSwitch('allow-file-access-from-files');
// Enable local DOM to access all resources in a tree
app.commandLine.appendSwitch('enable-local-file-accesses');
// Enable QUIC for faster handshakes
app.commandLine.appendSwitch('enable-quic');
// Enable inspecting ALL layers
app.commandLine.appendSwitch('enable-ui-devtools');
// Force enable GPU acceleration
app.commandLine.appendSwitch('ignore-gpu-blocklist');
// Force enable GPU rasterization
app.commandLine.appendSwitch('enable-gpu-rasterization');
// Enable Zero Copy for GPU memory associated with Tiles
app.commandLine.appendSwitch('enable-zero-copy');
// Inform GPU process that GPU context will not be lost in power saving modes
// Useful for fixing blank or pink screens/videos upon system resume, etc
app.commandLine.appendSwitch('gpu-no-context-lost');
// Enable all WebGL Features
app.commandLine.appendSwitch('enable-webgl-draft-extensions');

if (process.env.NODE_ENV === 'development') {
  app.commandLine.appendSwitch('remote-debugging-port', '9222');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Show versions
  if (process.argv.includes('--version') || process.argv.includes('-v')) {
    console.log(`\n  Quark Player Version: ` + appVersion);
    console.log(`  Electron Version: ` + electronVer);
    console.log(`  Chrome Version: ` + chromeVer);
    console.log(`  NodeJS Version: ` + nodeVer);
    console.log(`  V8 Version: ` + v8Ver + '\n');
    app.quit();
  } else {
  electronLog.info(`Instagram Electron v` + appVersion);
  createWindow();
  mainWindow.webContents.on('did-finish-load',() => {
    mainWindow.setTitle(`Instagram`);
  });
  }
});

app.on('relaunch-confirm', () => {
    dialog.showMessageBox(mainWindow, {
        'type': 'question',
        'title': 'Relaunch Confirmation',
        'message': "Are you sure you want to relaunch Quark Player?",
        'buttons': [
            'Yes',
            'No'
        ]
    })
      // Dialog returns a promise so let's handle it correctly
      .then((result) => {
          // Bail if the user pressed "No" or escaped (ESC) from the dialog box
          if (result.response !== 0) { return; }
          // Testing.
          if (result.response === 0) {
              //console.log('The "Yes" button was pressed (main process)');
              //app.relaunch();
              //app.quit();
              app.emit('relaunch');
          }
      })
})

// Fix bug in quitting after restarting
app.on('exit', () => {
  // Kill Electron
  app.quit();
});

// This is a custom event that is used to relaunch the application.
// It destroys and recreates the browser window. This is used to apply
// settings that Electron doesn't allow to be changed in an active
// browser window.
app.on('relaunch', () => {
  electronLog.info('Relaunching App...');
  // Tell app we are going to relaunch
  app.relaunch();
  // Kill Electron to initiate the relaunch
  app.quit();

  // Remove app Close listener
  // mainWindow.removeListener('closed');

  // Create a New BrowserWindow
  electronLog.info('Electron restarted! [ Loading main.js ]');
  // createWindow();
});

// Allow creating new instance with Ctrl+N
app.on('new-window', () => {
  createWindow();
  electronLog.info('Created new BrowserWindow');
  mainWindow.webContents.on('did-finish-load',() => {
      mainWindow.setTitle(`Instagram (New Instance)`);
  });
});

// Full restart, quitting Electron. Triggered by developer menu
app.on('restart', () => {
  // Tell app we are going to relaunch
  app.relaunch();
  // Kill Electron to initiate the relaunch
  app.quit();

  // Remove app Close listener
  // mainWindow.removeListener('closed');

  // Create a New BrowserWindow
  electronLog.info('Electron restarted! [ Loading main.js ]');
  // createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
