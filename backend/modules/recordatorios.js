// backend/modules/recordatorios.js
// Módulo de recordatorios: archivos semanales .md en Google Drive / Obsidian

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Detecta la ruta base de Obsidian según el SO
 */
function getObsidianPath() {
  const platform = os.platform();

  if (platform === 'win32') {
    // Windows: Google Drive mapeado como G:\
    return path.join('G:\\', 'Mi unidad', 'Obsidian', 'Diario');
  } else if (platform === 'darwin') {
    // macOS: Google Drive en ~/Library o en home
    const gdriveMac = path.join(os.homedir(), 'Library', 'CloudStorage', 'GoogleDrive-tumail@gmail.com', 'Mi unidad', 'Obsidian');
    const gdriveAlt = path.join(os.homedir(), 'Google Drive', 'Mi unidad', 'Obsidian');

    // Intentar rutas comunes de Google Drive en Mac
    if (fs.existsSync(gdriveMac)) return gdriveMac;
    if (fs.existsSync(gdriveAlt)) return gdriveAlt;

    // Fallback: carpeta local si no hay Google Drive
    return path.join(os.homedir(), 'Obsidian', 'Diario');
  }

  // Fallback universal
  return path.join(os.homedir(), 'vox-assistant', 'recordatorios');
}

/**
 * Obtiene el lunes de la semana actual
 */
function getMondayOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

/**
 * Formatea fecha como YYYY-MM-DD
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Obtiene nombre del archivo semanal
 */
function getWeeklyFileName() {
  const monday = getMondayOfWeek();
  return `Semana_${formatDate(monday)}.md`;
}

/**
 * Obtiene ruta completa del archivo semanal
 */
function getWeeklyFilePath() {
  const basePath = getObsidianPath();

  // Crear directorio si no existe (para fallback local)
  if (!fs.existsSync(basePath)) {
    try {
      fs.mkdirSync(basePath, { recursive: true });
    } catch (e) {
      // Usar directorio local del proyecto como último recurso
      const localPath = path.join(__dirname, '../../recordatorios');
      fs.mkdirSync(localPath, { recursive: true });
      return path.join(localPath, getWeeklyFileName());
    }
  }

  return path.join(basePath, getWeeklyFileName());
}

/**
 * Inicializa el archivo semanal si no existe o si es lunes
 */
function initWeeklyFile() {
  const filePath = getWeeklyFilePath();
  const monday = getMondayOfWeek();
  const today = new Date();

  // Si es lunes y el archivo existe, crear uno nuevo
  const isMonday = today.getDay() === 1;

  if (!fs.existsSync(filePath) || isMonday) {
    const header = `# Semana del ${formatDate(monday)}\n\n`;
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    let content = header;

    days.forEach((day, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      content += `## ${day} ${formatDate(d)}\n\n- [ ] (sin tareas)\n\n`;
    });

    fs.writeFileSync(filePath, content, 'utf8');
  }

  return filePath;
}

/**
 * Obtiene tareas de una fecha específica
 * @param {string} date - Formato YYYY-MM-DD o "hoy"
 */
function getTasks(date) {
  try {
    const filePath = initWeeklyFile();
    const content = fs.readFileSync(filePath, 'utf8');

    const targetDate = date === 'hoy' || !date
      ? formatDate(new Date())
      : date;

    // Buscar sección del día en el markdown
    const lines = content.split('\n');
    const tasks = [];
    let inSection = false;

    for (const line of lines) {
      if (line.startsWith('## ') && line.includes(targetDate)) {
        inSection = true;
        continue;
      }
      if (inSection && line.startsWith('## ')) break;
      if (inSection && line.startsWith('- ')) {
        tasks.push(line.replace(/^- \[.\] /, '').replace(/^- /, '').trim());
      }
    }

    return { success: true, tasks, date: targetDate };
  } catch (error) {
    return { success: false, error: error.message, tasks: [] };
  }
}

/**
 * Obtiene tareas de hoy
 */
function getTodayTasks() {
  const result = getTasks('hoy');
  return result.tasks.filter(t => t !== '(sin tareas)');
}

/**
 * Agrega una tarea a una fecha
 * @param {object} task - { text, date, completed }
 */
function addTask({ text, date, completed = false }) {
  try {
    const filePath = initWeeklyFile();
    let content = fs.readFileSync(filePath, 'utf8');

    const targetDate = date || formatDate(new Date());
    const checkbox = completed ? '[x]' : '[ ]';
    const taskLine = `- ${checkbox} ${text}`;

    // Encontrar la sección del día y agregar la tarea
    const lines = content.split('\n');
    let insertIndex = -1;
    let inSection = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('## ') && lines[i].includes(targetDate)) {
        inSection = true;
        continue;
      }
      if (inSection) {
        // Eliminar placeholder si existe
        if (lines[i] === '- [ ] (sin tareas)') {
          lines.splice(i, 1);
          insertIndex = i;
          break;
        }
        if (lines[i].startsWith('- ')) {
          insertIndex = i + 1;
        } else if (lines[i].startsWith('## ') || i === lines.length - 1) {
          insertIndex = i;
          break;
        }
      }
    }

    if (insertIndex >= 0) {
      lines.splice(insertIndex, 0, taskLine);
      content = lines.join('\n');
      fs.writeFileSync(filePath, content, 'utf8');
      return { success: true, message: 'Tarea agregada correctamente' };
    }

    return { success: false, error: 'No se encontró la fecha en el archivo' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Lee todo el contenido del archivo semanal
 */
function getWeeklyTasks() {
  try {
    const filePath = initWeeklyFile();
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content, filePath };
  } catch (error) {
    return { success: false, error: error.message, content: '' };
  }
}

module.exports = { getTasks, getTodayTasks, addTask, getWeeklyTasks, initWeeklyFile };
