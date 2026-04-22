// frontend/src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Widget from './components/Widget';
import Modal from './components/Modal';

// Mock del API de Electron para desarrollo en navegador
const api = window.electronAPI || {
  speak: async (t) => { console.log('SPEAK:', t); return { success: true }; },
  getConfig: async () => ({ appsHabilitadas: ['docker', 'vscode', 'obsidian', 'warp'] }),
  saveConfig: async (c) => ({ success: true }),
  openApp: async (a) => { console.log('OPEN APP:', a); return { success: true }; },
  getAppsList: async () => [
    { key: 'docker', name: 'Docker', icon: '🐳' },
    { key: 'vscode', name: 'VS Code', icon: '💻' },
    { key: 'obsidian', name: 'Obsidian', icon: '📝' },
    { key: 'warp', name: 'Warp', icon: '⚡' },
    { key: 'cursor', name: 'Cursor', icon: '✏️' },
    { key: 'edge', name: 'Edge', icon: '🌐' },
  ],
  getTasks: async (d) => ({ tasks: ['Revisar PRs', 'Actualizar docs'], date: d }),
  addTask: async (t) => ({ success: true }),
  getWeeklyTasks: async () => ({ content: '# Semana\n\n## Lunes\n\n- [ ] Ejemplo\n' }),
  getNews: async (k) => ({ news: [
    { source: 'WIRED ES', title: 'IA transforma el desarrollo de software en 2026' },
    { source: 'Infobae', title: 'Nueva vulnerabilidad crítica en sistemas Windows' },
  ], keyword: k }),
  startRecording: async () => ({ success: true }),
  stopRecording: async () => ({ success: true, text: 'abrir vscode' }),
  expandWindow: async () => {},
  collapseWindow: async () => {},
  dragWindow: async () => {},
  minimizeWindow: async () => {},
  selectStartupMusic: async () => ({ canceled: true }),
  pathToFileUrl: async () => '',
  on: (ch, cb) => {},
  off: (ch, cb) => {},
};

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [notification, setNotification] = useState(null);
  const [customApps, setCustomApps] = useState([]);
  const [startupMusic, setStartupMusic] = useState(null);
  const startupAudioRef = useRef(null);

  // Abrir/cerrar modal + redimensionar ventana
  const handleOpenModal = useCallback(async () => {
    setModalOpen(true);
    await api.expandWindow();
  }, []);

  const handleCloseModal = useCallback(async () => {
    setModalOpen(false);
    await api.collapseWindow();
  }, []);

  // Hablar texto
  const speak = useCallback(async (text) => {
    setIsSpeaking(true);
    setNotification({ type: 'speaking', text });
    await api.speak(text);
    setIsSpeaking(false);
    setTimeout(() => setNotification(null), 2000);
  }, []);

  // Comando de voz: procesar texto reconocido
  const processVoiceCommand = useCallback(async (command) => {
    const cmd = command.toLowerCase().trim();
    setLastCommand(cmd);

    // Noticias
    if (cmd.includes('noticias')) {
      const keyword = cmd.includes('ia') ? 'IA'
        : cmd.includes('seguridad') ? 'ciberseguridad'
        : cmd.includes('web') ? 'desarrollo web'
        : 'tecnología';
      const result = await api.getNews(keyword);
      if (result.news?.length > 0) {
        const titles = result.news.slice(0, 3).map(n => n.title).join('. ');
        await speak(`Noticias de ${keyword}: ${titles}`);
      }
      return;
    }

    // Tareas
    if (cmd.includes('tarea') || cmd.includes('pendiente')) {
      const result = await api.getTasks('hoy');
      if (result.tasks?.length > 0) {
        await speak(`Tienes ${result.tasks.length} tareas: ${result.tasks.join(', ')}`);
      } else {
        await speak('No tienes tareas pendientes para hoy.');
      }
      return;
    }

    // Abrir apps
    const apps = ['docker', 'vscode', 'obsidian', 'warp', 'cursor', 'edge', 'chrome'];
    for (const app of apps) {
      if (cmd.includes(app)) {
        const result = await api.openApp(app);
        await speak(result.success ? `Abriendo ${app}` : `No encontré ${app}`);
        return;
      }
    }

    // Abrir apps personalizadas por alias o nombre
    const wantsWeb = cmd.includes('web');
    const wantsApp = cmd.includes('aplicacion') || cmd.includes('aplicación') || cmd.includes('app');
    for (const app of customApps) {
      const alias = (app.alias || '').toLowerCase().trim();
      const name = (app.name || '').toLowerCase().trim();
      const targetType = app.targetType || (String(app.target || app.url || '').startsWith('http') ? 'web' : 'app');
      if (wantsWeb && targetType !== 'web') continue;
      if (wantsApp && targetType !== 'app') continue;
      if ((alias && cmd.includes(alias)) || (name && cmd.includes(name))) {
        const target = app.target || app.url || app.key;
        const result = await api.openApp(target);
        await speak(result.success ? `Abriendo ${app.name}` : `No pude abrir ${app.name}`);
        return;
      }
    }

    // Configuración
    if (cmd.includes('configur') || cmd.includes('ajuste')) {
      handleOpenModal();
      await speak('Abriendo configuración');
      return;
    }

    await speak(`No entendí el comando: ${command}`);
  }, [speak, handleOpenModal, customApps]);

  // Iniciar grabación de voz
  const handleVoiceRecord = useCallback(async () => {
    if (isRecording) {
      setIsRecording(false);
      const result = await api.stopRecording();
      if (result.text) {
        await processVoiceCommand(result.text);
      }
    } else {
      setIsRecording(true);
      await api.startRecording();
      // Auto-stop después de 8 segundos
      setTimeout(async () => {
        if (isRecording) {
          setIsRecording(false);
          const result = await api.stopRecording();
          if (result.text) await processVoiceCommand(result.text);
        }
      }, 8000);
    }
  }, [isRecording, processVoiceCommand]);

  useEffect(() => {
    let mounted = true;
    api.getConfig().then((cfg) => {
      if (!mounted) return;
      setCustomApps(cfg.customApps || []);
      const sm = cfg.startupMusic && typeof cfg.startupMusic === 'object'
        ? { path: '', enabled: true, volume: 0.45, ...cfg.startupMusic }
        : { path: '', enabled: true, volume: 0.45 };
      setStartupMusic(sm);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!startupMusic || !startupAudioRef.current) return;
    const el = startupAudioRef.current;
    if (!startupMusic.path || startupMusic.enabled === false) {
      el.pause();
      el.removeAttribute('src');
      el.load();
      return;
    }
    let cancelled = false;
    (async () => {
      const url = await api.pathToFileUrl(startupMusic.path);
      if (cancelled || !url || !startupAudioRef.current) return;
      el.src = url;
      el.volume = Math.min(1, Math.max(0, startupMusic.volume ?? 0.45));
      try {
        await el.play();
      } catch {
        /* autoplay o codec: se ignora */
      }
    })();
    return () => { cancelled = true; };
  }, [startupMusic]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <audio ref={startupAudioRef} style={{ display: 'none' }} preload="auto" />
      {/* Widget siempre visible */}
      <Widget
        isSpeaking={isSpeaking}
        isRecording={isRecording}
        onOpenModal={handleOpenModal}
        onVoiceRecord={handleVoiceRecord}
        notification={notification}
        lastCommand={lastCommand}
        api={api}
      />

      {/* Modal de configuración */}
      {modalOpen && (
        <Modal
          onClose={handleCloseModal}
          speak={speak}
          api={api}
          onAppsUpdated={setCustomApps}
          onStartupMusicChange={setStartupMusic}
        />
      )}
    </div>
  );
}
