// frontend/src/components/Modal.jsx
// Modal de configuración con tabs: Apps, Tareas, Noticias, Config

import React, { useState, useEffect } from 'react';

const TAB_STYLE = (active) => ({
  padding: '6px 14px',
  borderRadius: 8,
  border: 'none',
  background: active ? 'rgba(0,245,212,0.15)' : 'transparent',
  color: active ? '#00f5d4' : '#8892aa',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'Space Mono, monospace',
  letterSpacing: '0.05em',
  transition: 'all 0.2s',
  borderBottom: active ? '1px solid rgba(0,245,212,0.4)' : '1px solid transparent',
});

const INPUT_STYLE = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  padding: '8px 12px',
  color: '#f0f4ff',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
};

const BTN_PRIMARY = {
  background: 'linear-gradient(135deg, rgba(0,245,212,0.2), rgba(124,58,237,0.2))',
  border: '1px solid rgba(0,245,212,0.4)',
  borderRadius: 10,
  color: '#00f5d4',
  padding: '8px 18px',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'Space Mono, monospace',
  letterSpacing: '0.05em',
  transition: 'all 0.2s',
};

// ─── TAB: APPS ────────────────────────────────────────────────────────────────
function AppsTab({ api, speak }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState({});

  useEffect(() => {
    api.getAppsList().then(setApps);
  }, [api]);

  const handleOpen = async (appKey, appName) => {
    setLoading(prev => ({ ...prev, [appKey]: true }));
    const result = await api.openApp(appKey);
    await speak(result.success ? `Abriendo ${appName}` : `No se encontró ${appName}`);
    setLoading(prev => ({ ...prev, [appKey]: false }));
  };

  return (
    <div>
      <p style={{ color: '#8892aa', fontSize: 12, marginBottom: 14 }}>
        Toca una app para abrirla al instante
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {apps.map(app => (
          <button
            key={app.key}
            onClick={() => handleOpen(app.key, app.name)}
            disabled={loading[app.key]}
            style={{
              background: loading[app.key] ? 'rgba(0,245,212,0.1)' : 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '12px 14px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
              color: '#f0f4ff',
            }}
          >
            <span style={{ fontSize: 20 }}>{app.icon}</span>
            <span style={{ fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{app.name}</span>
            {loading[app.key] && <span style={{ fontSize: 10, color: '#00f5d4', marginLeft: 'auto' }}>...</span>}
          </button>
        ))}
      </div>

      {/* Campo URL personalizada */}
      <div style={{ marginTop: 16 }}>
        <p style={{ color: '#8892aa', fontSize: 11, marginBottom: 8 }}>Abrir URL personalizada:</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            id="custom-url"
            placeholder="https://..."
            style={{ ...INPUT_STYLE, flex: 1 }}
          />
          <button
            onClick={() => {
              const url = document.getElementById('custom-url').value;
              if (url) api.openApp(url).then(() => speak(`Abriendo ${url}`));
            }}
            style={{ ...BTN_PRIMARY, padding: '8px 14px' }}
          >
            Abrir
          </button>
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
      <div style={{ marginBottom: 16 }}>
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
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ color: '#8892aa', fontSize: 11 }}>Tareas de hoy ({tasks.filter(t => t !== '(sin tareas)').length}):</p>
          <button onClick={handleReadTasks} style={{ ...BTN_PRIMARY, padding: '4px 10px', fontSize: 11 }}>
            🔊 Leer
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
          🔊 Leer
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
      <div style={{ marginBottom: 12 }}>
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

      <div style={{ marginBottom: 16 }}>
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
export default function Modal({ onClose, api, speak }) {
  const [tab, setTab] = useState('apps');

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(10, 12, 20, 0.96)',
      backdropFilter: 'blur(20px)',
      borderRadius: 18,
      border: '1px solid rgba(0,245,212,0.12)',
      boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'fade-in 0.25s ease',
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
          color: '#00f5d4',
          letterSpacing: '0.1em',
        }}>
          ◈ PANEL DE CONTROL
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
        {[['apps', '🚀 Apps'], ['tareas', '📋 Tareas'], ['noticias', '📰 Noticias'], ['config', '⚙️ Config']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={TAB_STYLE(tab === key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Contenido del tab */}
      <div style={{ flex: 1, padding: '16px 18px', overflowY: 'auto' }}>
        {tab === 'apps' && <AppsTab api={api} speak={speak} />}
        {tab === 'tareas' && <TareasTab api={api} speak={speak} />}
        {tab === 'noticias' && <NoticiasTab api={api} speak={speak} />}
        {tab === 'config' && <ConfigTab api={api} speak={speak} />}
      </div>
    </div>
  );
}
