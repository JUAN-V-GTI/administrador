// backend/main.js
// Proceso principal de Electron - orquestador de toda la app

const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Importar módulos del backend
const voiceModule = require('./modules/voice');
const noticiasModule = require('./modules/noticias');
const recordatoriosModule = require('./modules/recordatorios');
const appsModule = require('./modules/apps');
const configModule = require('./modules/config');

let mainWindow = null;

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 420,
    height: 120,
    x: screenWidth - 440,
    y: screenHeight - 140,
    frame: false,           // Sin bordes del SO
    transparent: true,      // Fondo transparente para el widget
    alwaysOnTop: true,      // Siempre visible encima
    resizable: false,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Cargar React en desarrollo, build en producción
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools({ mode: 'detach' }); // descomenta para debug
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/build/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── EVENTOS IPC (comunicación React ↔ Node) ─────────────────────────────────

// Voz: texto a hablar
ipcMain.handle('speak', async (event, text) => {
  return await voiceModule.speak(text);
});

// Voz: grabación de comando
ipcMain.handle('start-recording', async () => {
  return await voiceModule.startRecording();
});

ipcMain.handle('stop-recording', async () => {
  return await voiceModule.stopRecording();
});

// Noticias
ipcMain.handle('get-news', async (event, keyword) => {
  return await noticiasModule.fetchNews(keyword);
});

// Recordatorios
ipcMain.handle('get-tasks', async (event, date) => {
  return await recordatoriosModule.getTasks(date);
});

ipcMain.handle('add-task', async (event, task) => {
  return await recordatoriosModule.addTask(task);
});

ipcMain.handle('get-weekly-tasks', async () => {
  return await recordatoriosModule.getWeeklyTasks();
});

// Apps
ipcMain.handle('open-app', async (event, appName) => {
  return await appsModule.openApp(appName);
});

ipcMain.handle('get-apps-list', async () => {
  return appsModule.getAppsList();
});

// Config
ipcMain.handle('get-config', async () => {
  return configModule.getConfig();
});

ipcMain.handle('save-config', async (event, newConfig) => {
  return configModule.saveConfig(newConfig);
});

// Control de ventana
ipcMain.handle('close-app', () => { app.quit(); });

ipcMain.handle('expand-window', async () => {
  if (mainWindow) {
    mainWindow.setSize(420, 600, true);
    mainWindow.center();
  }
});

ipcMain.handle('collapse-window', async () => {
  if (mainWindow) {
    const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setSize(420, 120, true);
    mainWindow.setPosition(sw - 440, sh - 140, true);
  }
});

ipcMain.handle('drag-window', async (event, { deltaX, deltaY }) => {
  if (mainWindow) {
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(x + deltaX, y + deltaY);
  }
});

// ─── CICLO DE VIDA APP ────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  createWindow();

  // Mensaje de bienvenida al iniciar
  setTimeout(async () => {
    const hora = new Date().getHours();
    let saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
    await voiceModule.speak(`${saludo}. Tu asistente está listo.`);

    // Leer tareas del día al iniciar
    const tareas = await recordatoriosModule.getTodayTasks();
    if (tareas && tareas.length > 0) {
      await voiceModule.speak(`Tienes ${tareas.length} tareas para hoy.`);
    }
  }, 3000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
