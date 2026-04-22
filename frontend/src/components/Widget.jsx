// frontend/src/components/Widget.jsx
// Widget flotante con animación de ondas y controles principales

import React, { useRef, useEffect } from 'react';

function IconButton({ title, onClick, active = false, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        border: `1px solid ${active ? 'rgba(34,211,238,0.45)' : 'rgba(148,163,184,0.25)'}`,
        background: active ? 'rgba(34,211,238,0.14)' : 'rgba(15,23,42,0.72)',
        color: active ? '#67e8f9' : '#cbd5e1',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontFamily: 'Space Mono, monospace',
        transition: 'all 0.2s ease',
        WebkitAppRegion: 'no-drag',
      }}
    >
      {children}
    </button>
  );
}

// Animación de ondas usando Canvas
function WaveCanvas({ isSpeaking, isRecording, width = 380, height = 52 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const waves = [
      { freq: 0.025, amp: isSpeaking ? 18 : isRecording ? 10 : 4, speed: 0.08, color: '#00f5d4', phase: 0 },
      { freq: 0.018, amp: isSpeaking ? 14 : isRecording ? 8 : 3, speed: 0.06, color: '#7c3aed', phase: 1 },
      { freq: 0.032, amp: isSpeaking ? 10 : isRecording ? 6 : 2, speed: 0.10, color: '#f472b6', phase: 2 },
    ];

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      timeRef.current += 0.05;

      waves.forEach(wave => {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);

        for (let x = 0; x <= width; x++) {
          const y = height / 2 + Math.sin(x * wave.freq + timeRef.current * wave.speed * 20 + wave.phase) * wave.amp
            + Math.sin(x * wave.freq * 1.5 + timeRef.current * wave.speed * 15 + wave.phase + 1) * (wave.amp * 0.5);
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = isSpeaking ? 0.9 : isRecording ? 0.7 : 0.45;
        ctx.shadowBlur = isSpeaking ? 12 : 6;
        ctx.shadowColor = wave.color;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isSpeaking, isRecording, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'block' }}
    />
  );
}

const DRAG_ZONE = {
  WebkitAppRegion: 'drag',
  cursor: 'grab',
};

const NO_DRAG = {
  WebkitAppRegion: 'no-drag',
};

export default function Widget({ isSpeaking, isRecording, onOpenModal, onVoiceRecord, notification, lastCommand, api }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(2,6,23,0.95) 100%)',
        backdropFilter: 'blur(20px)',
        borderRadius: '18px',
        border: '1px solid rgba(148,163,184,0.22)',
        boxShadow: '0 14px 40px rgba(2,6,23,0.7)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Barra superior: arrastre nativo (Electron) en la zona del título; botones excluidos */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px 4px',
        flexShrink: 0,
      }}>
        {/* Logo / nombre — zona de arrastre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, ...DRAG_ZONE }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isSpeaking ? '#22d3ee' : isRecording ? '#a78bfa' : '#64748b',
            boxShadow: isSpeaking ? '0 0 10px rgba(34,211,238,0.9)' : isRecording ? '0 0 10px rgba(167,139,250,0.8)' : 'none',
            transition: 'all 0.3s',
          }} />
          <span style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 11,
            color: '#94a3b8',
            letterSpacing: '0.08em',
          }}>
            VOX<span style={{ color: '#00f5d4' }}>_</span>ASSISTANT
          </span>
        </div>

        {/* Botones: no-drag para que sigan respondiendo al clic */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, ...NO_DRAG }}>
          <IconButton onClick={onVoiceRecord} title={isRecording ? 'Detener grabación' : 'Comando de voz'} active={isRecording}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 10.5a7 7 0 0 0 14 0" />
              <path d="M12 18.5v3" />
            </svg>
          </IconButton>

          <IconButton onClick={onOpenModal} title="Configuración">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.4V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.4 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.4-1H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.4-1 1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3h.1a1.6 1.6 0 0 0 1-1.4V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.4h.1a1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7v.1a1.6 1.6 0 0 0 1.4 1H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z" />
            </svg>
          </IconButton>

          <IconButton onClick={() => window.electronAPI?.minimizeWindow?.()} title="Minimizar">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </IconButton>

          <IconButton onClick={() => { if (window.electronAPI?.closeApp) window.electronAPI.closeApp(); }} title="Cerrar">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          </IconButton>
        </div>
      </div>

      {/* Ondas — también arrastrable (cursor suele salir del borde; drag nativo lo sigue bien) */}
      <div style={{ padding: '0 14px', flexShrink: 0, ...DRAG_ZONE }}>
        <WaveCanvas isSpeaking={isSpeaking} isRecording={isRecording} width={388} height={48} />
      </div>

      {/* Notificación / estado */}
      {notification && (
        <div style={{
          padding: '2px 14px 6px',
          fontSize: 10,
          color: '#00f5d4',
          fontFamily: 'Space Mono, monospace',
          letterSpacing: '0.05em',
          animation: 'fade-in 0.3s ease',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          ...DRAG_ZONE,
        }}>
          ▶ {notification.text}
        </div>
      )}
    </div>
  );
}
