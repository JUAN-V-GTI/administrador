// backend/modules/config.js
// Módulo de configuración: lee y guarda config.json

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../config/config.json');

const DEFAULT_CONFIG = {
  apiKeys: {
    newsapi: ''
  },
  mensajesPersonalizados: {
    bienvenida: 'Buenos días. Tu asistente está listo.',
    tareasTarde: 'Recuerda revisar tus pendientes.',
    finDia: 'Que descanses, fue un buen día.'
  },
  appsHabilitadas: ['docker', 'vscode', 'obsidian', 'warp'],
  voz: {
    velocidad: 150,
    volumen: 0.9,
    idioma: 'es'
  },
  recordatorios: {
    rutaObsidian: '',  // Se detecta automáticamente si queda vacío
    recordarAlInicio: true
  }
};

function getConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (error) {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(newConfig) {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const merged = { ...getConfig(), ...newConfig };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { getConfig, saveConfig };
