import { contextBridge, ipcRenderer } from 'electron'

// ipcRenderer exposure removed for security reasons


contextBridge.exposeInMainWorld('auth', {
    getItem: (key: string) => ipcRenderer.invoke('auth-get', key),
    setItem: (key: string, value: string) => ipcRenderer.invoke('auth-set', key, value),
    removeItem: (key: string) => ipcRenderer.invoke('auth-remove', key),
})

contextBridge.exposeInMainWorld('notification', {
    send: (title: string, body: string) => ipcRenderer.invoke('show-notification', title, body),
})
