// frontend/src/components/Modal.jsx
// Modal de configuración con tabs: Apps, Tareas, Noticias, Config

import React, { useState, useEffect, useRef } from 'react';

const TAB_STYLE = (active) => ({
  padding: '6px 14px',
  borderRadius: 10,
  border: `1px solid ${active ? 'rgba(34,211,238,0.35)' : 'rgba(148,163,184,0.18)'}`,
  background: active ? 'rgba(34,211,238,0.14)' : 'rgba(15,23,42,0.65)',
  color: active ? '#67e8f9' : '#94a3b8',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'Space Mono, monospace',
  letterSpacing: '0.05em',
  transition: 'all 0.2s',
  boxShadow: active ? '0 4px 20px rgba(34,211,238,0.12)' : 'none',
});

const INPUT_STYLE = {
  width: '100%',
  background: 'rgba(15,23,42,0.75)',
  border: '1px solid rgba(148,163,184,0.22)',
  borderRadius: 10,
  padding: '8px 12px',
  color: '#e2e8f0',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
};

const BTN_PRIMARY = {
  background: 'rgba(15,23,42,0.8)',
  border: '1px solid rgba(148,163,184,0.25)',
  borderRadius: 10,
  color: '#cbd5e1',
  padding: '8px 18px',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'Space Mono, monospace',
  letterSpacing: '0.05em',
  transition: 'all 0.2s ease',
};

const CARD_STYLE = {
  background: 'rgba(15,23,42,0.55)',
  border: '1px solid rgba(148,163,184,0.16)',
  borderRadius: 12,
  padding: '12px',
};

// ─── TAB: APPS ────────────────────────────────────────────────────────────────
function AppsTab({ api, speak, onAppsUpdated }) {
  const [customApps, setCustomApps] = useState([]);
  const [loading, setLoading] = useState({});
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    alias: '',
    target: '',
    targetType: 'app',
  });

  const loadCustomApps = async () => {
    const config = await api.getConfig();
    const savedApps = config.customApps || [];
    setCustomApps(savedApps);
    onAppsUpdated?.(savedApps);
  };

  useEffect(() => {
    loadCustomApps();
  }, [api]);

  const handleSaveCustomApp = async () => {
    const name = form.name.trim();
    const alias = form.alias.trim().toLowerCase();
    const target = form.target.trim();
    const targetType = form.targetType;
    if (!name || !alias || !target) return;

    const config = await api.getConfig();
    const currentApps = config.customApps || [];
    const nextApps = [
      ...currentApps.filter(app => app.alias?.toLowerCase() !== alias),
      { key: `custom-${alias}`, name, alias, target, targetType }
    ];

    setSaving(true);
    await api.saveConfig({ customApps: nextApps });
    setSaving(false);
    setForm({ name: '', alias: '', target: '', targetType: 'app' });
    await loadCustomApps();
    await speak(`App guardada: ${name}. Alias ${alias}`);
  };

  const handleOpen = async (app) => {
    setLoading(prev => ({ ...prev, [app.alias]: true }));
    const result = await api.openApp(app.target || app.url || app.key);
    await speak(result.success ? `Abriendo ${app.name}` : `No se pudo abrir ${app.name}`);
    setLoading(prev => ({ ...prev, [app.alias]: false }));
  };

  const handleDelete = async (alias) => {
    const config = await api.getConfig();
    const currentApps = config.customApps || [];
    const nextApps = currentApps.filter(app => app.alias?.toLowerCase() !== alias.toLowerCase());
    await api.saveConfig({ customApps: nextApps });
    await loadCustomApps();
  };

  return (
    <div>
      <p style={{ color: '#8892aa', fontSize: 12, marginBottom: 14 }}>
        Guarda apps personalizadas con alias para abrirlas por voz.
      </p>

      <div style={{ ...CARD_STYLE, display: 'grid', gap: 8 }}>
        <input
          value={form.name}
          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Nombre: YouTube, Notion, CRM..."
          style={INPUT_STYLE}
        />
        <input
          value={form.alias}
          onChange={(e) => setForm(prev => ({ ...prev, alias: e.target.value }))}
          placeholder="Alias por voz: youtube, trabajo, ventas..."
          style={INPUT_STYLE}
        />
        <input
          value={form.target}
          onChange={(e) => setForm(prev => ({ ...prev, target: e.target.value }))}
          placeholder={form.targetType === 'web' ? 'URL: https://...' : 'Aplicacion: vscode, docker, cursor...'}
          style={INPUT_STYLE}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setForm(prev => ({ ...prev, targetType: 'app' }))}
            style={{ ...BTN_PRIMARY, flex: 1, borderColor: form.targetType === 'app' ? 'rgba(0,245,212,0.5)' : 'rgba(255,255,255,0.14)', color: form.targetType === 'app' ? '#00f5d4' : '#d8e1f2' }}
          >
            Aplicacion
          </button>
          <button
            onClick={() => setForm(prev => ({ ...prev, targetType: 'web' }))}
            style={{ ...BTN_PRIMARY, flex: 1, borderColor: form.targetType === 'web' ? 'rgba(0,245,212,0.5)' : 'rgba(255,255,255,0.14)', color: form.targetType === 'web' ? '#00f5d4' : '#d8e1f2' }}
          >
            Web
          </button>
        </div>
        <button onClick={handleSaveCustomApp} disabled={saving} style={{ ...BTN_PRIMARY, width: '100%' }}>
          {saving ? 'Guardando...' : '+ Guardar app personalizada'}
        </button>
      </div>

      <div style={{ marginTop: 16, ...CARD_STYLE }}>
        <p style={{ color: '#8892aa', fontSize: 11, marginBottom: 8 }}>Apps guardadas:</p>
        <div style={{ display: 'grid', gap: 6, maxHeight: 170, overflowY: 'auto' }}>
          {customApps.length === 0 ? (
            <p style={{ color: '#4a5568', fontSize: 12, fontStyle: 'italic' }}>
              Aún no hay apps guardadas
            </p>
          ) : customApps.map(app => (
            <div key={app.alias} style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: 6,
              alignItems: 'center',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '8px 10px',
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: '#f0f4ff', fontSize: 12 }}>{app.name}</div>
                <div style={{ color: '#8892aa', fontSize: 11 }}>
                  alias: {app.alias} • tipo: {app.targetType || 'app'}
                </div>
              </div>
              <button onClick={() => handleOpen(app)} disabled={loading[app.alias]} style={{ ...BTN_PRIMARY, padding: '5px 10px', fontSize: 11 }}>
                {loading[app.alias] ? '...' : 'Abrir'}
              </button>
              <button onClick={() => handleDelete(app.alias)} style={{
                ...BTN_PRIMARY,
                padding: '5px 10px',
                fontSize: 11,
                color: '#fca5a5',
                borderColor: 'rgba(252,165,165,0.4)',
              }}>
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TAB: TAREAS ──────────────────────────────────────────────────────────────
function TareasTab({ api, speak }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const result = await api.getTasks('hoy');
    setTasks(result.tasks || []);
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    setLoading(true);
    await api.addTask({ text: newTask, date: taskDate });
    await speak(`Tarea agregada: ${newTask}`);
    setNewTask('');
    await loadTasks();
    setLoading(false);
  };

  const handleReadTasks = async () => {
    if (tasks.length === 0) {
      await speak('No tienes tareas para hoy.');
    } else {
      await speak(`Tienes ${tasks.length} tareas: ${tasks.filter(t => t !== '(sin tareas)').join('. ')}`);
    }
  };

  return (
    <div>
      {/* Agregar tarea */}
      <div style={{ marginBottom: 16, ...CARD_STYLE }}>
        <p style={{ color: '#8892aa', fontSize: 11, marginBottom: 8 }}>Nueva tarea:</p>
        <input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleAddTask()}
          placeholder="Ej: Revisar pull requests"
          style={INPUT_STYLE}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            type="date"
            value={taskDate}
            onChange={e => setTaskDate(e.target.value)}
            style={{ ...INPUT_STYLE, flex: 1, fontSize: 12 }}
          />
          <button
            onClick={handleAddTask}
            disabled={loading}
            style={{ ...BTN_PRIMARY, padding: '8px 14px' }}
          >
            {loading ? '...' : '+ Agregar'}
          </button>
        </div>
      </div>

      {/* Lista tareas de hoy */}
      <div style={{ marginBottom: 12, ...CARD_STYLE }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ color: '#8892aa', fontSize: 11 }}>Tareas de hoy ({tasks.filter(t => t !== '(sin tareas)').length}):</p>
          <button onClick={handleReadTasks} style={{ ...BTN_PRIMARY, padding: '4px 10px', fontSize: 11 }}>
            Leer
          </button>
        </div>
        <div style={{ maxHeight: 160, overflowY: 'auto' }}>
          {tasks.filter(t => t !== '(sin tareas)').length === 0 ? (
            <p style={{ color: '#4a5568', fontSize: 12, fontStyle: 'italic', padding: '8px 0' }}>
              Sin tareas para hoy
            </p>
          ) : (
            tasks.filter(t => t !== '(sin tareas)').map((task, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                marginBottom: 4,
                fontSize: 12,
                color: '#d1d9e6',
              }}>
                <span style={{ color: '#00f5d4', fontSize: 10 }}>◦</span>
                {task}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TAB: NOTICIAS ────────────────────────────────────────────────────────────
function NoticiasTab({ api, speak }) {
  const [news, setNews] = useState([]);
  const [keyword, setKeyword] = useState('IA');
  const [loading, setLoading] = useState(false);

  const KEYWORDS = ['IA', 'ciberseguridad', 'desarrollo web', 'vulnerabilidad'];

  const fetchNews = async (kw) => {
    setLoading(true);
    setKeyword(kw);
    const result = await api.getNews(kw);
    setNews(result.news || []);
    setLoading(false);
  };

  const readNews = async () => {
    if (news.length === 0) return;
    const titles = news.slice(0, 3).map(n => `${n.source}: ${n.title}`).join('. ');
    await speak(`Noticias de ${keyword}: ${titles}`);
  };

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {KEYWORDS.map(kw => (
          <button
            key={kw}
            onClick={() => fetchNews(kw)}
            style={{
              ...BTN_PRIMARY,
              padding: '5px 12px',
              fontSize: 11,
              background: keyword === kw ? 'rgba(0,245,212,0.2)' : 'rgba(255,255,255,0.04)',
              borderColor: keyword === kw ? 'rgba(0,245,212,0.5)' : 'rgba(255,255,255,0.08)',
              color: keyword === kw ? '#00f5d4' : '#8892aa',
            }}
          >
            {kw}
          </button>
        ))}
        <button onClick={readNews} style={{ ...BTN_PRIMARY, padding: '5px 12px', fontSize: 11, marginLeft: 'auto' }}>
          Leer
        </button>
      </div>

      {/* Lista noticias */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#00f5d4', padding: 20, fontSize: 12 }}>
          Buscando noticias...
        </div>
      ) : news.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#4a5568', padding: 20, fontSize: 12 }}>
          Selecciona una categoría para buscar
        </div>
      ) : (
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {news.map((item, i) => (
            <div key={i} style={{
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 8,
              marginBottom: 6,
              borderLeft: '2px solid rgba(0,245,212,0.3)',
            }}>
              <span style={{ fontSize: 9, color: '#00f5d4', fontFamily: 'Space Mono', display: 'block', marginBottom: 3 }}>
                {item.source}
              </span>
              <span style={{ fontSize: 12, color: '#d1d9e6', lineHeight: 1.4 }}>{item.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DEFAULT_STARTUP_MUSIC = { path: '', enabled: true, volume: 0.45 };

// ─── TAB: MÚSICA AL INICIAR ───────────────────────────────────────────────────
function SonidoTab({ api, speak, onStartupMusicChange }) {
  const [startupMusic, setStartupMusic] = useState(DEFAULT_STARTUP_MUSIC);
  const [saving, setSaving] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    api.getConfig().then((c) => {
      setStartupMusic({ ...DEFAULT_STARTUP_MUSIC, ...(c.startupMusic || {}) });
    });
  }, [api]);

  const fileLabel = startupMusic.path
    ? startupMusic.path.replace(/\\/g, '/').split('/').pop()
    : 'Ningún archivo';

  const pickFile = async () => {
    const res = await api.selectStartupMusic?.();
    if (!res || res.canceled || !res.filePath) return;
    const name = res.filePath.replace(/\\/g, '/').split('/').pop();
    setStartupMusic((prev) => ({ ...prev, path: res.filePath }));
    await speak(`Archivo seleccionado: ${name}`);
  };

  const saveMusic = async () => {
    setSaving(true);
    await api.saveConfig({ startupMusic });
    setSaving(false);
    await speak('Música de inicio guardada');
    onStartupMusicChange?.({ ...startupMusic });
  };

  const clearMusic = async () => {
    const next = { ...startupMusic, path: '' };
    setStartupMusic(next);
    await api.saveConfig({ startupMusic: next });
    await speak('Archivo de música quitado');
    onStartupMusicChange?.(next);
  };

  const testPlay = async () => {
    if (!startupMusic.path || !previewRef.current) {
      await speak('Primero elige un archivo de audio');
      return;
    }
    const url = await api.pathToFileUrl?.(startupMusic.path);
    if (!url) {
      await speak('No se pudo leer el archivo');
      return;
    }
    previewRef.current.src = url;
    previewRef.current.volume = Math.min(1, Math.max(0, startupMusic.volume ?? 0.45));
    try {
      await previewRef.current.play();
    } catch {
      await speak('No se pudo reproducir la vista previa');
    }
  };

  const testStop = () => {
    if (!previewRef.current) return;
    previewRef.current.pause();
    previewRef.current.currentTime = 0;
  };

  return (
    <div>
      <audio ref={previewRef} style={{ display: 'none' }} preload="metadata" />
      <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12, lineHeight: 1.45 }}>
        Elige un archivo de audio local. Se guarda en la configuración y se reproduce al abrir la app
        (puedes cambiarlo cuando quieras).
      </p>

      <div style={{ ...CARD_STYLE, marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Archivo actual</p>
        <p style={{ fontSize: 12, color: '#e2e8f0', wordBreak: 'break-all', fontFamily: 'Space Mono, monospace' }}>
          {fileLabel}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          <button type="button" onClick={pickFile} style={{ ...BTN_PRIMARY, padding: '8px 14px' }}>
            Elegir archivo…
          </button>
          <button type="button" onClick={testPlay} style={{ ...BTN_PRIMARY, padding: '8px 14px' }}>
            Probar
          </button>
          <button type="button" onClick={testStop} style={{ ...BTN_PRIMARY, padding: '8px 14px' }}>
            Detener prueba
          </button>
          <button type="button" onClick={clearMusic} disabled={!startupMusic.path} style={{
            ...BTN_PRIMARY,
            padding: '8px 14px',
            color: '#fca5a5',
            borderColor: 'rgba(252,165,165,0.35)',
            opacity: startupMusic.path ? 1 : 0.45,
          }}>
            Quitar archivo
          </button>
        </div>
      </div>

      <div style={{ ...CARD_STYLE, marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={startupMusic.enabled !== false}
            onChange={(e) => setStartupMusic((prev) => ({ ...prev, enabled: e.target.checked }))}
          />
          Reproducir al iniciar la aplicación
        </label>
        <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginTop: 12, marginBottom: 6 }}>
          Volumen: {Math.round((startupMusic.volume ?? 0.45) * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={startupMusic.volume ?? 0.45}
          onChange={(e) => setStartupMusic((prev) => ({ ...prev, volume: parseFloat(e.target.value) }))}
          style={{ width: '100%', accentColor: '#22d3ee' }}
        />
      </div>

      <button type="button" onClick={saveMusic} disabled={saving} style={{ ...BTN_PRIMARY, width: '100%' }}>
        {saving ? 'Guardando…' : 'Guardar música de inicio'}
      </button>
    </div>
  );
}

// ─── TAB: CONFIG ──────────────────────────────────────────────────────────────
function ConfigTab({ api, speak }) {
  const [config, setConfig] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getConfig().then(setConfig);
  }, [api]);

  const handleSave = async () => {
    await api.saveConfig(config);
    setSaved(true);
    await speak('Configuración guardada');
    setTimeout(() => setSaved(false), 2000);
  };

  if (!config) return <div style={{ color: '#8892aa', fontSize: 12 }}>Cargando...</div>;

  return (
    <div>
      <div style={{ marginBottom: 12, ...CARD_STYLE }}>
        <label style={{ fontSize: 11, color: '#8892aa', display: 'block', marginBottom: 6 }}>
          Mensaje de bienvenida:
        </label>
        <input
          value={config.mensajesPersonalizados?.bienvenida || ''}
          onChange={e => setConfig(prev => ({
            ...prev,
            mensajesPersonalizados: { ...prev.mensajesPersonalizados, bienvenida: e.target.value }
          }))}
          style={INPUT_STYLE}
          placeholder="Buenos días, listo para trabajar."
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 11, color: '#8892aa', display: 'block', marginBottom: 6 }}>
          Velocidad de voz: {config.voz?.velocidad || 150}
        </label>
        <input
          type="range" min="80" max="250"
          value={config.voz?.velocidad || 150}
          onChange={e => setConfig(prev => ({
            ...prev,
            voz: { ...prev.voz, velocidad: parseInt(e.target.value) }
          }))}
          style={{ width: '100%', accentColor: '#00f5d4' }}
        />
      </div>

      <div style={{ marginBottom: 16, ...CARD_STYLE }}>
        <label style={{ fontSize: 11, color: '#8892aa', display: 'block', marginBottom: 6 }}>
          Ruta Obsidian (opcional):
        </label>
        <input
          value={config.recordatorios?.rutaObsidian || ''}
          onChange={e => setConfig(prev => ({
            ...prev,
            recordatorios: { ...prev.recordatorios, rutaObsidian: e.target.value }
          }))}
          style={INPUT_STYLE}
          placeholder="G:\Mi unidad\Obsidian\Diario"
        />
      </div>

      <button onClick={handleSave} style={{ ...BTN_PRIMARY, width: '100%' }}>
        {saved ? '✓ Guardado' : 'Guardar configuración'}
      </button>
    </div>
  );
}

// ─── MODAL PRINCIPAL ──────────────────────────────────────────────────────────
export default function Modal({ onClose, api, speak, onAppsUpdated, onStartupMusicChange }) {
  const [tab, setTab] = useState('apps');

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(15,23,42,0.97) 0%, rgba(2,6,23,0.97) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: 18,
      border: '1px solid rgba(148,163,184,0.2)',
      boxShadow: '0 30px 80px rgba(2,6,23,0.8)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'fade-in 0.25s ease',
      WebkitAppRegion: 'no-drag',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 18px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 12,
          color: '#67e8f9',
          letterSpacing: '0.1em',
        }}>
          CONTROL PANEL
        </span>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          color: '#8892aa',
          width: 28, height: 28,
          cursor: 'pointer',
          fontSize: 12,
        }}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        padding: '10px 14px 0',
        gap: 4,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {[['apps', 'Apps'], ['tareas', 'Tareas'], ['noticias', 'Noticias'], ['musica', 'Música'], ['config', 'Config']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={TAB_STYLE(tab === key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Contenido del tab */}
      <div style={{ flex: 1, padding: '16px 18px', overflowY: 'auto' }}>
        {tab === 'apps' && <AppsTab api={api} speak={speak} onAppsUpdated={onAppsUpdated} />}
        {tab === 'tareas' && <TareasTab api={api} speak={speak} />}
        {tab === 'noticias' && <NoticiasTab api={api} speak={speak} />}
        {tab === 'musica' && <SonidoTab api={api} speak={speak} onStartupMusicChange={onStartupMusicChange} />}
        {tab === 'config' && <ConfigTab api={api} speak={speak} />}
      </div>
    </div>
  );
}
