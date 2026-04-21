# 🎙️ VoxAssistant

Asistente personal con widget flotante, comandos de voz, noticias y recordatorios.
Construido con **Electron + React + Node.js + Python**.

---

## 📦 Estructura del proyecto

```
vox-assistant/
├── backend/
│   ├── main.js              ← Proceso principal Electron (orquestador)
│   ├── preload.js           ← Puente seguro entre React y Node.js
│   └── modules/
│       ├── voice.js         ← Módulo de voz (llama a Python)
│       ├── noticias.js      ← Módulo de noticias (web scraping)
│       ├── recordatorios.js ← Módulo de tareas/recordatorios (.md)
│       ├── apps.js          ← Módulo de apertura de apps
│       └── config.js        ← Módulo de configuración
├── frontend/
│   └── src/
│       ├── App.jsx           ← Componente raíz, lógica principal
│       ├── components/
│       │   ├── Widget.jsx    ← Widget flotante con ondas
│       │   └── Modal.jsx     ← Panel de control (tabs)
│       └── styles/
│           └── global.css    ← Estilos globales
├── python/
│   ├── requirements.txt      ← Dependencias Python
│   └── voice/
│       ├── speak.py          ← Text-to-Speech con pyttsx3
│       └── record.py         ← Reconocimiento de voz
├── config/
│   └── config.json           ← Configuración de la app
├── recordatorios/            ← Archivos .md semanales (si no hay Obsidian)
├── instalar-windows.bat      ← Instalador automático Windows
├── instalar-mac.sh           ← Instalador automático macOS
└── package.json              ← Dependencias principales
```

---

## 🚀 Instalación paso a paso

### En Windows

1. **Descarga el proyecto** en una carpeta, por ejemplo `C:\proyectos\vox-assistant`
2. **Abre esa carpeta** en el Explorador de archivos
3. **Haz doble clic** en `instalar-windows.bat`
   - Si Windows pregunta "¿Quieres permitir que esta app haga cambios?", elige **Sí**
4. Espera a que termine (puede tardar 5-10 minutos la primera vez)
5. Cuando diga "INSTALACIÓN COMPLETADA", cierra esa ventana

### En macOS

1. **Descarga el proyecto** en una carpeta, por ejemplo `~/proyectos/vox-assistant`
2. **Abre Terminal** (busca "Terminal" en Spotlight con Cmd+Espacio)
3. Navega a la carpeta:
   ```bash
   cd ~/proyectos/vox-assistant
   ```
4. Da permiso de ejecución y ejecuta el script:
   ```bash
   chmod +x instalar-mac.sh
   bash instalar-mac.sh
   ```
5. Espera a que termine

---

## ▶️ Cómo ejecutar la app

### Modo desarrollo (recomendado al principio)

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm run dev
```

Esto inicia dos cosas al mismo tiempo:
- El servidor React (lo verás en http://localhost:3000)
- La ventana de Electron con el widget

**La primera vez puede tardar 1-2 minutos** en abrir. Es normal.

### Solo modo Electron (si React ya corre)

```bash
npm start
```

---

## 🎤 Comandos de voz disponibles

Una vez abierta la app, toca el botón 🎤 del widget y di:

| Comando | Qué hace |
|---------|----------|
| "Dame noticias de IA" | Busca y lee titulares de IA |
| "Dame noticias de ciberseguridad" | Busca noticias de seguridad |
| "Dame las tareas de hoy" | Lee tus tareas del día |
| "Repite las tareas" | Vuelve a leer las tareas |
| "Abre docker" | Abre Docker Desktop |
| "Abre vscode" | Abre VS Code |
| "Abre obsidian" | Abre Obsidian |
| "Abre warp" | Abre Warp Terminal |
| "Abre cursor" | Abre Cursor |
| "Configuración" | Abre el panel de control |

---

## 📋 Recordatorios y tareas

Las tareas se guardan en un archivo Markdown semanal.

**Ruta en Windows:**
```
G:\Mi unidad\Obsidian\Diario\Semana_2026-04-20.md
```

**Ruta en macOS:**
```
~/Library/CloudStorage/GoogleDrive-.../Mi unidad/Obsidian/
```

Si la ruta no existe, se guarda en:
```
vox-assistant/recordatorios/Semana_YYYY-MM-DD.md
```

Puedes personalizar la ruta en el panel de configuración ⚙️.

---

## 🛠️ Solución de problemas comunes

### "La voz no funciona"

**Windows:**
```bash
pip install pyttsx3 --upgrade
python python\voice\speak.py "prueba"
```

**macOS:**
```bash
pip3 install pyttsx3 --upgrade
python3 python/voice/speak.py "prueba"
```

### "Error: cannot find module"

```bash
npm install
cd frontend && npm install && cd ..
```

### "La ventana no abre / se cierra sola"

1. Asegúrate de que React esté corriendo primero (`npm run react`)
2. Espera a ver el mensaje "Compiled successfully" en la terminal
3. Luego en otra terminal: `npm start`

### "pyaudio no instala en Windows"

```bash
pip install pipwin
pipwin install pyaudio
```

### El reconocimiento de voz no funciona sin internet

El reconocimiento usa Google Speech por defecto (requiere internet).
Para modo offline, instala: `pip install pocketsphinx`

---

## ➕ Agregar nuevas apps al widget

Edita `backend/modules/apps.js` y agrega tu app al objeto `APPS_MAP`:

```javascript
miapp: {
  name: 'Mi Aplicación',
  icon: '🎯',
  win: '"C:\\ruta\\a\\mi-app.exe"',
  mac: 'open -a "Mi Aplicacion"',
  url: null  // URL de respaldo si no se encuentra la app
},
```

---

## ➕ Agregar nuevos módulos

Crea un archivo en `backend/modules/mi-modulo.js`:

```javascript
// backend/modules/mi-modulo.js
async function miFuncion(param) {
  // Tu lógica aquí
  return { success: true, data: '...' };
}
module.exports = { miFuncion };
```

Luego regístralo en `backend/main.js`:

```javascript
const miModulo = require('./modules/mi-modulo');
ipcMain.handle('mi-accion', async (event, param) => {
  return await miModulo.miFuncion(param);
});
```

Y expónlo en `backend/preload.js`:

```javascript
miAccion: (param) => ipcRenderer.invoke('mi-accion', param),
```

---

## 📱 Tecnologías usadas

| Capa | Tecnología | Para qué |
|------|-----------|----------|
| UI | React 18 + CSS | Interfaz visual |
| Desktop | Electron 28 | Ventana nativa, siempre encima |
| Backend JS | Node.js | Orquestador, IPC, scraping |
| Voz | Python + pyttsx3 | TTS offline sin internet |
| Reconocimiento | SpeechRecognition | Escuchar comandos |
| Recordatorios | Archivos .md | Compatible con Obsidian |

---

## 🔑 Licencia

MIT - Úsalo, modifícalo y compártelo libremente.
