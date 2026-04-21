// backend/modules/voice.js
// Módulo de voz: Node.js invoca Python para TTS offline con pyttsx3

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// Detectar comando python según el SO
function getPythonCmd() {
  return os.platform() === 'win32' ? 'python' : 'python3';
}

// Ruta al script Python de voz
const VOICE_SCRIPT = path.join(__dirname, '../../python/voice/speak.py');
const RECORD_SCRIPT = path.join(__dirname, '../../python/voice/record.py');

/**
 * Convierte texto a voz usando pyttsx3 en Python
 * @param {string} text - Texto a hablar
 */
function speak(text) {
  return new Promise((resolve, reject) => {
    const python = spawn(getPythonCmd(), [VOICE_SCRIPT, text]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout.trim() });
      } else {
        console.error('Error en TTS:', stderr);
        resolve({ success: false, error: stderr });
      }
    });

    python.on('error', (err) => {
      console.error('No se pudo iniciar Python:', err.message);
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * Inicia grabación de audio para reconocimiento de voz
 */
function startRecording() {
  return new Promise((resolve, reject) => {
    const python = spawn(getPythonCmd(), [RECORD_SCRIPT, 'start']);

    python.stdout.on('data', (data) => {
      resolve({ success: true, status: 'recording' });
    });

    python.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * Detiene grabación y retorna texto reconocido
 */
function stopRecording() {
  return new Promise((resolve) => {
    const python = spawn(getPythonCmd(), [RECORD_SCRIPT, 'stop']);
    let result = '';

    python.stdout.on('data', (data) => {
      result += data.toString();
    });

    python.on('close', () => {
      resolve({ success: true, text: result.trim() });
    });

    python.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

module.exports = { speak, startRecording, stopRecording };
