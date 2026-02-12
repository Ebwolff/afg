"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.Menu.setApplicationMenu(null);
const path_1 = __importDefault(require("path"));
const electron_store_1 = __importDefault(require("electron-store"));
const electron_updater_1 = require("electron-updater");
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js
// │ ├─┬ preload
// │ │ └── index.js
// │ └── index.html
// ├── dist
// └── index.html
process.env.DIST = path_1.default.join(__dirname, '../dist');
process.env.VITE_PUBLIC = electron_1.app.isPackaged ? process.env.DIST : path_1.default.join(process.env.DIST, '../public');
let win;
const store = new electron_store_1.default();
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
function createWindow() {
    const bounds = store.get('bounds', { width: 1200, height: 800 });
    win = new electron_1.BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        icon: path_1.default.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
        autoHideMenuBar: true,
    });
    win.setMenu(null);
    win.removeMenu();
    win.setMenuBarVisibility(false);
    // Save window state
    const saveState = () => {
        if (!win)
            return;
        const bounds = win.getBounds();
        store.set('bounds', bounds);
    };
    win.on('resize', saveState);
    win.on('move', saveState);
    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString());
    });
    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    }
    else {
        // win.loadFile('dist/index.html')
        win.loadFile(path_1.default.join(process.env.DIST, 'index.html'));
        // win.webContents.openDevTools()
    }
}
// IPC Handlers for Auth Persistence
electron_1.ipcMain.handle('auth-get', (_event, key) => {
    const auth = store.get('auth', {});
    return auth[key] || null;
});
electron_1.ipcMain.handle('auth-set', (_event, key, value) => {
    const auth = store.get('auth', {});
    auth[key] = value;
    store.set('auth', auth);
});
electron_1.ipcMain.handle('auth-remove', (_event, key) => {
    const auth = store.get('auth', {});
    delete auth[key];
    store.set('auth', auth);
});
electron_1.ipcMain.handle('show-notification', (_event, title, body) => {
    new electron_1.Notification({ title, body }).show();
});
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
        win = null;
    }
});
electron_1.app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
electron_1.app.whenReady().then(() => {
    electron_1.Menu.setApplicationMenu(null);
    createWindow();
    // Check for updates
    if (electron_1.app.isPackaged) {
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
    }
});
//# sourceMappingURL=main.js.map