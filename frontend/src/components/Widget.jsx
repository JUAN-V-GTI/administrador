// frontend/src/components/Widget.jsx
// Widget flotante con animación de ondas y controles principales

import React, { useRef, useEffect, useState } from 'react';

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

export default function Widget({ isSpeaking, isRecording, onOpenModal, onVoiceRecord, notification, lastCommand, api }) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (window.electronAPI) {
      window.electronAPI.dragWindow?.({ deltaX, deltaY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        width: '100%',
        height: '100%',
        background: 'rgba(10, 12, 20, 0.92)',
        backdropFilter: 'blur(20px)',
        borderRadius: '18px',
        border: '1px solid rgba(0, 245, 212, 0.15)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,245,212,0.05)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'relative',
      }}
    >
      {/* Barra superior: nombre + botones */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px 4px',
        flexShrink: 0,
      }}>
        {/* Logo / nombre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isSpeaking ? '#00f5d4' : isRecording ? '#f472b6' : '#4a5568',
            boxShadow: isSpeaking ? '0 0 8px #00f5d4' : isRecording ? '0 0 8px #f472b6' : 'none',
            transition: 'all 0.3s',
          }} />
          <span style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 11,
            color: '#8892aa',
            letterSpacing: '0.08em',
          }}>
            VOX<span style={{ color: '#00f5d4' }}>_</span>ASSISTANT
          </span>
        </div>

        {/* Botones de control */}
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Micrófono */}
          <button
            onClick={onVoiceRecord}
            title={isRecording ? 'Detener grabación' : 'Comando de voz'}
            style={{
              width: 28, height: 28,
              borderRadius: 8,
              border: `1px solid ${isRecording ? 'rgba(244,114,182,0.5)' : 'rgba(255,255,255,0.08)'}`,
              background: isRecording ? 'rgba(244,114,182,0.15)' : 'rgba(255,255,255,0.04)',
              color: isRecording ? '#f472b6' : '#8892aa',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13,
              transition: 'all 0.2s',
              animation: isRecording ? 'pulse-glow 1s infinite' : 'none',
            }}
          >
            🎤
          </button>

          {/* Configuración */}
          <button
            onClick={onOpenModal}
            title="Configuración"
            style={{
              width: 28, height: 28,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: '#8892aa',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13,
              transition: 'all 0.2s',
            }}
          >
            ⚙️
          </button>

          {/* Cerrar */}
          <button
            onClick={() => { if (window.electronAPI?.closeApp) window.electronAPI.closeApp(); }}
            title="Cerrar"
            style={{
              width: 28, height: 28,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: '#8892aa',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11,
              transition: 'all 0.2s',
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Ondas */}
      <div style={{ padding: '0 14px', flexShrink: 0 }}>
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
        }}>
          ▶ {notification.text}
        </div>
      )}
    </div>
  );
}
