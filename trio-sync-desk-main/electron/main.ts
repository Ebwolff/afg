import { app, BrowserWindow, ipcMain, Notification, Menu } from 'electron'

Menu.setApplicationMenu(null)
import path from 'path'
import Store from 'electron-store'
import { autoUpdater } from 'electron-updater'

// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js
// │ ├─┬ preload
// │ │ └── index.js
// │ └── index.html
// ├── dist
// └── index.html

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null

// Define interface for window bounds
interface WindowBounds {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

// Define interface for auth storage
interface AuthStorage {
  [key: string]: string;
}

const store = new Store<{ bounds: WindowBounds; auth: AuthStorage }>()

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  const bounds = store.get('bounds', { width: 1200, height: 800 })

  win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    x: bounds.x,
    y: bounds.y,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
  })

  win.setMenu(null)
  win.removeMenu()
  win.setMenuBarVisibility(false)

  // Save window state
  const saveState = () => {
    if (!win) return
    const bounds = win.getBounds()
    store.set('bounds', bounds)
  }

  win.on('resize', saveState)
  win.on('move', saveState)

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
    // win.webContents.openDevTools()
  }
}

// IPC Handlers for Auth Persistence
ipcMain.handle('auth-get', (_event, key: string) => {
  const auth = store.get('auth', {})
  return auth[key] || null
})

ipcMain.handle('auth-set', (_event, key: string, value: string) => {
  const auth = store.get('auth', {})
  auth[key] = value
  store.set('auth', auth)
})

ipcMain.handle('auth-remove', (_event, key: string) => {
  const auth = store.get('auth', {})
  delete auth[key]
  store.set('auth', auth)
})

ipcMain.handle('show-notification', (_event, title: string, body: string) => {
  new Notification({ title, body }).show()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()

  // Check for updates
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify()
  }
})
