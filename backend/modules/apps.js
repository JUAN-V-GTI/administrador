// backend/modules/apps.js
// Módulo de apertura de aplicaciones en Windows y macOS

const { exec, spawn } = require('child_process');
const os = require('os');

const platform = os.platform();

// Mapa de aplicaciones: nombre → {win, mac, url}
const APPS_MAP = {
  docker: {
    name: 'Docker',
    icon: '🐳',
    win: '"C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"',
    mac: 'open -a "Docker Desktop"',
    url: null
  },
  cursor: {
    name: 'Cursor',
    icon: '✏️',
    win: 'cursor',
    mac: 'open -a "Cursor"',
    url: null
  },
  vscode: {
    name: 'VS Code',
    icon: '💻',
    win: 'code',
    mac: 'open -a "Visual Studio Code"',
    url: null
  },
  obsidian: {
    name: 'Obsidian',
    icon: '📝',
    win: 'obsidian',
    mac: 'open -a "Obsidian"',
    url: null
  },
  edge: {
    name: 'Microsoft Edge',
    icon: '🌐',
    win: 'start msedge',
    mac: 'open -a "Microsoft Edge"',
    url: null
  },
  warp: {
    name: 'Warp Terminal',
    icon: '⚡',
    win: 'warp-terminal',
    mac: 'open -a "Warp"',
    url: null
  },
  chrome: {
    name: 'Google Chrome',
    icon: '🔵',
    win: 'start chrome',
    mac: 'open -a "Google Chrome"',
    url: null
  },
  notion: {
    name: 'Notion',
    icon: '📋',
    win: 'notion',
    mac: 'open -a "Notion"',
    url: 'https://notion.so'
  }
};

/**
 * Abre una aplicación por nombre
 * @param {string} appName - clave del mapa (ej: 'docker', 'vscode')
 */
function openApp(appName) {
  return new Promise((resolve) => {
    const app = APPS_MAP[appName.toLowerCase()];

    if (!app) {
      // Intentar abrir como URL si no está en el mapa
      if (appName.startsWith('http')) {
        const cmd = platform === 'win32'
          ? `start ${appName}`
          : `open ${appName}`;
        exec(cmd, (err) => {
          resolve({ success: !err, message: err ? err.message : `Abriendo ${appName}` });
        });
        return;
      }
      resolve({ success: false, error: `Aplicación "${appName}" no encontrada en el mapa` });
      return;
    }

    const cmd = platform === 'win32' ? app.win : app.mac;

    exec(cmd, (error) => {
      if (error) {
        // Si falla y tiene URL de respaldo, abrir en navegador
        if (app.url) {
          const fallback = platform === 'win32' ? `start ${app.url}` : `open ${app.url}`;
          exec(fallback, () => {
            resolve({ success: true, message: `Abriendo ${app.name} en navegador (app no encontrada)` });
          });
        } else {
          resolve({ success: false, error: `No se pudo abrir ${app.name}: ${error.message}` });
        }
      } else {
        resolve({ success: true, message: `${app.name} abierto correctamente` });
      }
    });
  });
}

/**
 * Retorna la lista de apps disponibles
 */
function getAppsList() {
  return Object.entries(APPS_MAP).map(([key, val]) => ({
    key,
    name: val.name,
    icon: val.icon
  }));
}

module.exports = { openApp, getAppsList };
