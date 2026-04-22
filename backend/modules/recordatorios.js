// backend/modules/recordatorios.js
// Módulo de recordatorios: archivos semanales .md en Google Drive / Obsidian

const fs = require('fs');
const path = require('path');
const os = require('os');

const FIXED_MAC_TASKS_PATH = '/Users/juanvelazco/Library/CloudStorage/GoogleDrive-juanevaristovelasco2016@gmail.com/Mi unidad/Obsidian/Asistente/Tareas';
const WINDOWS_OBSIDIAN_PATH = path.join('G:\\', 'Mi unidad', 'Obsidian', 'Diario');
const LOCAL_FALLBACK_PATH = path.join(__dirname, '../../recordatorios');
const TASKS_DB_PATH = path.join(__dirname, '../../data/tasks.json');

/**
 * Detecta la ruta base de Obsidian según el SO
 */
function getObsidianPath() {
  const platform = os.platform();

  if (platform === 'win32') {
    // Windows: mantener ruta actual del proyecto
    return WINDOWS_OBSIDIAN_PATH;
  }
  if (platform === 'darwin') {
    // macOS: ruta fija solicitada
    return FIXED_MAC_TASKS_PATH;
  }

  // Fallback universal
  return LOCAL_FALLBACK_PATH;
}

/**
 * Obtiene el lunes de la semana actual
 */
function getMondayOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
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
  const monday = getMondayOfWeek(new Date());
  return `Semana_${formatDate(monday)}.md`;
}

/**
 * Obtiene ruta completa del archivo semanal
 */
function getWeeklyFilePath(forDate = new Date()) {
  const basePath = getObsidianPath();
  const monday = getMondayOfWeek(forDate);
  const fileName = `Semana_${formatDate(monday)}.md`;

  // Crear directorio si no existe (para fallback local)
  if (!fs.existsSync(basePath)) {
    try {
      fs.mkdirSync(basePath, { recursive: true });
    } catch (e) {
      // Usar directorio local del proyecto como último recurso
      const localPath = LOCAL_FALLBACK_PATH;
      fs.mkdirSync(localPath, { recursive: true });
      return path.join(localPath, fileName);
    }
  }

  return path.join(basePath, fileName);
}

/**
 * Plantilla semanal solicitada por el usuario
 */
function buildWeeklyTemplate(monday) {
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  let content = `---
tags: [tareas, semana, productividad, registro]
descripcion: "Plantilla semanal para organizar y registrar tareas"
---

# 📅 Semana del ${formatDate(monday)}

## 📌 Resumen Semanal
- 🎯 Objetivo principal: 
- ✅ Tareas completadas: 
- ⏳ Tareas pendientes: 
- 🚫 Bloqueos / problemas: 

---

`;

  dayNames.forEach((dayName, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    content += `## 📆 ${dayName} ${formatDate(current)}
- [ ] Tarea 1 — breve descripción
- [ ] Tarea 2 — breve descripción

`;
  });

  content += `---

## 📝 Notas Generales
- Observaciones de la semana
- Ideas para mejorar la organización
- Recordatorios importantes
`;

  return content;
}

function getDayNameByDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return names[date.getDay()];
}

function ensureTasksDb() {
  const dbDir = path.dirname(TASKS_DB_PATH);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  if (!fs.existsSync(TASKS_DB_PATH)) fs.writeFileSync(TASKS_DB_PATH, JSON.stringify({ tasks: [] }, null, 2), 'utf8');
}

function loadTasksDb() {
  ensureTasksDb();
  try {
    const raw = fs.readFileSync(TASKS_DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.tasks) ? parsed.tasks : [];
  } catch (error) {
    return [];
  }
}

function saveTasksDb(tasks) {
  ensureTasksDb();
  fs.writeFileSync(TASKS_DB_PATH, JSON.stringify({ tasks }, null, 2), 'utf8');
}

function pruneExpiredTasks(tasks) {
  const today = formatDate(new Date());
  return tasks.filter((task) => task.date >= today);
}

function buildWeekDates(baseDate = new Date()) {
  const monday = getMondayOfWeek(baseDate);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatDate(d));
  }
  return { monday, dates };
}

/**
 * Inicializa el archivo semanal si no existe
 */
function initWeeklyFile(forDate = new Date()) {
  const filePath = getWeeklyFilePath(forDate);
  const monday = getMondayOfWeek(forDate);

  if (!fs.existsSync(filePath)) {
    const content = buildWeeklyTemplate(monday);
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return filePath;
}

function replaceDaySection(content, dateString, tasksForDate) {
  const dayName = getDayNameByDate(dateString);
  const heading = `## 📆 ${dayName} ${dateString}`;
  const lines = content.split('\n');
  const startIdx = lines.findIndex((line) => line.trim() === heading);
  if (startIdx === -1) return content;

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## 📆 ') || lines[i].startsWith('---')) {
      endIdx = i;
      break;
    }
  }

  const items = tasksForDate.length > 0
    ? tasksForDate.map((task) => `- [ ] ${task.text}`)
    : ['- [ ] (sin tareas)'];
  const replacement = [heading, ...items, ''];

  return [...lines.slice(0, startIdx), ...replacement, ...lines.slice(endIdx)].join('\n');
}

function syncWeeklyFile(baseDate = new Date()) {
  const filePath = initWeeklyFile(baseDate);
  const { dates } = buildWeekDates(baseDate);
  const allTasks = pruneExpiredTasks(loadTasksDb());
  saveTasksDb(allTasks);

  let content = fs.readFileSync(filePath, 'utf8');
  for (const dateString of dates) {
    const tasksForDate = allTasks.filter((task) => task.date === dateString);
    content = replaceDaySection(content, dateString, tasksForDate);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
}

/**
 * Obtiene tareas de una fecha específica
 * @param {string} date - Formato YYYY-MM-DD o "hoy"
 */
function getTasks(date) {
  try {
    const targetDate = date === 'hoy' || !date
      ? formatDate(new Date())
      : date;
    syncWeeklyFile(new Date(`${targetDate}T00:00:00`));
    const tasksDb = pruneExpiredTasks(loadTasksDb());
    saveTasksDb(tasksDb);
    const tasks = tasksDb
      .filter((task) => task.date === targetDate)
      .map((task) => task.text);
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
    const targetDate = date || formatDate(new Date());
    const cleanText = (text || '').trim();
    if (!cleanText) return { success: false, error: 'Texto de tarea vacío' };

    const tasks = pruneExpiredTasks(loadTasksDb());
    tasks.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: cleanText,
      date: targetDate,
      completed: Boolean(completed),
      createdAt: new Date().toISOString(),
    });
    saveTasksDb(tasks);
    const filePath = syncWeeklyFile(new Date(`${targetDate}T00:00:00`));
    return { success: true, message: 'Tarea agregada correctamente', filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Lee todo el contenido del archivo semanal
 */
function getWeeklyTasks() {
  try {
    const filePath = syncWeeklyFile(new Date());
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content, filePath };
  } catch (error) {
    return { success: false, error: error.message, content: '' };
  }
}

module.exports = { getTasks, getTodayTasks, addTask, getWeeklyTasks, initWeeklyFile };
