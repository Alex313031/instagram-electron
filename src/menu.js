const { Menu, shell, BrowserWindow, app, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const electronLog = require('electron-log');

module.exports = (store, mainWindow, app) => {
  
  // Globally export whether we are on Windows or not
  const isWin = process.platform === 'win32';
  // Enable remote module on sub-windows
  require("@electron/remote/main").enable(mainWindow.webContents);

  return Menu.buildFromTemplate([
    {
      label: 'Instagram Electron',
      submenu: [
        {
          label: 'Go Back',
          accelerator: 'Alt+Left',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.goBack();
            electronLog.info('Navigated back');
          }
        },
        {
          label: 'Go Forward',
          accelerator: 'Alt+Right',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.goForward();
            electronLog.info('Navigated forward');
          }
        },
        {
          label: 'New Window',
          accelerator: 'CmdorCtrl+N',
          click() {
            app.emit('new-window');
          }
        },
        {
          label: 'Close Window',
          accelerator: 'CmdorCtrl+W',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.close();
            electronLog.info('Closed a window');
          }
        },
        {
          type: 'separator'
        },
        { label: 'Open File',
          accelerator: 'Ctrl+Shift+O',
          click() {
            dialog.showOpenDialog({ properties: ['openFile'] }).then(result => {
            electronLog.info('Opened file:' + result.filePaths);
            var openURI = result.filePaths
            const openWindow = new BrowserWindow({
              webPreferences: {
                nodeIntegration: false,
                nodeIntegrationInWorker: false,
                contextIsolation: false,
                sandbox: true,
                experimentalFeatures: true,
                webviewTag: true,
                devTools: true,
                javascript: true,
                plugins: true,
                enableRemoteModule: true,
              },
            });
            openWindow.loadFile(openURI[0]);
            openWindow.setTitle(openURI[0])});
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Shortcut Table',
          accelerator: 'CmdorCtrl+Alt+H',
          click() {
            const helpWindow = new BrowserWindow({
              width: 632,
              height: 600,
              title: "Quark Player Help",
              icon: process.platform === 'win32' ? path.join(__dirname, 'icon.ico') : path.join(__dirname, 'icon64.png'),
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
                preload: path.join(__dirname, 'client-preload.js'),
              },
            });
            require("@electron/remote/main").enable(helpWindow.webContents);
            helpWindow.loadFile('./ui/help.html');
            electronLog.info('Opened help.html');
          }
        },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q', // TODO: Non Mac Shortcut
          click() {
            app.emit('exit');
          }
        },
      ]
    },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'Enable AdBlocker *',
          type: 'checkbox',
          click(e) {
            store.set('options.adblock', e.checked);

            // Store details to remeber when relaunched
            if (mainWindow.getURL() != '') {
              store.set('relaunch.toPage', mainWindow.getURL());
            }
            store.set('relaunch.windowDetails', {
              position: mainWindow.getPosition(),
              size: mainWindow.getSize()
            });

            // Restart the app
            //app.relaunch();
            //app.quit();
            app.emit('relaunch-confirm');
          },
          checked: store.get('options.adblock')
            ? store.get('options.adblock')
            : false
        },
        {
          label: store.get('options.useLightMode') ? 'Use Dark Mode' : 'Use Light Mode',
          type: 'checkbox',
          accelerator: 'CmdorCtrl+Shift+D',
          click(e) {
            if (store.get('options.useLightMode')) {
              store.set('options.useLightMode', false);
            } else {
              store.set('options.useLightMode', true);
            }
            app.emit('relaunch-confirm');
          },
          checked: false
        },
        {
          label: 'Remember Window Details',
          type: 'checkbox',
          click() {
            if (store.get('options.windowDetails')) {
              store.delete('options.windowDetails');
            } else {
              store.set('options.windowDetails', {});
            }
          },
          checked: !!store.get('options.windowDetails')
        },
        {
          label: 'Edit Config File',
          click() {
            store.openInEditor();
          }
        },
        { label: '* Requires an App Restart', enabled: false }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Go Back',
          accelerator: 'Alt+Left',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.goBack();
            electronLog.info('Navigated back');
          }
        },
        {
          label: 'Go Forward',
          accelerator: 'Alt+Right',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.goForward();
            electronLog.info('Navigated forward');
          }
        },
        {
          label: 'New Window',
          accelerator: 'CmdorCtrl+N',
          click() {
            app.emit('new-window');
          }
        },
        {
          label: 'Close Window',
          accelerator: 'CmdorCtrl+W',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.close();
            electronLog.info('Closed a window');
          }
        },
        {
          type: 'separator'
        },
        {
          role: 'zoomin'
        },
        {
          role: 'zoomout'
        },
        {
          role: 'resetzoom'
        },
        {
          type: 'separator'
        },
        {
          role: 'togglefullscreen'
        }
      ]
    },
    {
      label: 'Developer',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.reload();
          }
        },
        {
          label: 'Reload F5',
          accelerator:  'F5',
          visible: false,
          acceleratorWorksWhenHidden: true,
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.reload();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.reloadIgnoringCache();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator:
            process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click(item, focusedWindow) {
            focusedWindow.webContents.toggleDevTools();
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Open Electron DevTools',
          accelerator:
            process.platform === 'darwin' ? 'CmdorCtrl+Shift+F12' : 'F12',
          click(item, focusedWindow) {
            focusedWindow.openDevTools({ mode: 'detach' });
          }
        },
        {
          label: 'Open Electron DevTools Extra',
          accelerator: 'Ctrl+Shift+F12',
          visible: false,
          acceleratorWorksWhenHidden: true,
          click(item, focusedWindow) {
            focusedWindow.openDevTools({ mode: 'detach' });
          }
        },
        {
          label: 'Open chrome://gpu',
          accelerator: 'CmdorCtrl+Alt+G',
          click() {
            const gpuWindow = new BrowserWindow({width: 900, height: 700, title: "GPU Internals"});
            gpuWindow.loadURL('chrome://gpu');
            electronLog.info('Opened chrome://gpu');
          }
        },
        {
          label: 'Open chrome://process-internals',
          accelerator: 'CmdorCtrl+Alt+P',
          click() {
            const procsWindow = new BrowserWindow({width: 900, height: 700, title: "Process Model Internals"});
            procsWindow.loadURL('chrome://process-internals');
            electronLog.info('Opened chrome://process-internals');
          }
        },
        {
          label: 'Open chrome://media-internals',
          accelerator: 'CmdorCtrl+Alt+M',
          click() {
            const mediaWindow = new BrowserWindow({width: 900, height: 700, title: "Media Internals"});
            mediaWindow.loadURL('chrome://media-internals');
            electronLog.info('Opened chrome://media-internals');
          }
        },
        {
          label: 'Restart App',
          click() {
            electronLog.warn('Restarting Electron...');
            app.emit('restart');
          }
        }
      ]
    },
    {
      role: 'help',
      label: 'About',
      submenu: [
        { label: 'Instagram Electron v' + app.getVersion(), enabled: false },
        { label: 'Maintained by Alex313031',
          click() {
            //shell.openExternal(
              //'https://github.com/Alex313031/quarkplayer#readme'
            //);
            //electronLog.info('Opened external browser');
            new BrowserWindow({width: 1024, height: 768}).loadURL('https://github.com/Alex313031/instagram-electron#readme');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'View Humans.txt',
          accelerator: 'CmdorCtrl+Alt+Shift+H',
          click() {
            const humansWindow = new BrowserWindow({width: isWin ? 532 : 532, height: isWin ? 642 : 624, title: "humans.txt"});
            humansWindow.loadFile('./humans.txt');
            electronLog.info('Opened humans.txt :)');
          }
        },
        {
          label: 'About App',
          accelerator: 'CmdorCtrl+Alt+A',
          click() {
            const aboutWindow = new BrowserWindow({
              width: isWin ? 532 : 532,
              height: isWin ? 528 : 508,
              title: "About App",
              icon: process.platform === 'win32' ? path.join(__dirname, 'icon.ico') : path.join(__dirname, 'icon64.png'),
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
                preload: path.join(__dirname, 'client-preload.js'),
              },
            });
            require("@electron/remote/main").enable(aboutWindow.webContents);
            aboutWindow.loadFile('./about.html');
            electronLog.info('Opened about.html');
          }
        }
      ]
    }
  ]);
};
