// backend/preload.js
// Puente seguro entre React y Node.js (contextBridge)

const { contextBridge, ipcRenderer } = require('electron');

// Exponemos solo las funciones que React necesita
contextBridge.exposeInMainWorld('electronAPI', {
  // Voz
  speak: (text) => ipcRenderer.invoke('speak', text),
  startRecording: () => ipcRenderer.invoke('start-recording'),
  stopRecording: () => ipcRenderer.invoke('stop-recording'),

  // Noticias
  getNews: (keyword) => ipcRenderer.invoke('get-news', keyword),

  // Recordatorios
  getTasks: (date) => ipcRenderer.invoke('get-tasks', date),
  addTask: (task) => ipcRenderer.invoke('add-task', task),
  getWeeklyTasks: () => ipcRenderer.invoke('get-weekly-tasks'),

  // Apps
  openApp: (appName) => ipcRenderer.invoke('open-app', appName),
  getAppsList: () => ipcRenderer.invoke('get-apps-list'),

  // Config
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),

  // Ventana
  expandWindow: () => ipcRenderer.invoke('expand-window'),
  collapseWindow: () => ipcRenderer.invoke('collapse-window'),
  closeApp: () => ipcRenderer.invoke('close-app'),

  // Escuchar eventos del main process hacia React
  on: (channel, callback) => {
    const allowed = ['speaking-start', 'speaking-end', 'task-reminder'];
    if (allowed.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  off: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  }
});
