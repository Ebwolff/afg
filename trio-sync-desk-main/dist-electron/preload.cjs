"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// ipcRenderer exposure removed for security reasons
electron_1.contextBridge.exposeInMainWorld('auth', {
    getItem: (key) => electron_1.ipcRenderer.invoke('auth-get', key),
    setItem: (key, value) => electron_1.ipcRenderer.invoke('auth-set', key, value),
    removeItem: (key) => electron_1.ipcRenderer.invoke('auth-remove', key),
});
electron_1.contextBridge.exposeInMainWorld('notification', {
    send: (title, body) => electron_1.ipcRenderer.invoke('show-notification', title, body),
});
//# sourceMappingURL=preload.js.map