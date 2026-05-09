import { useEffect, useState } from 'react';

interface GlowParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  symbol: string;
}

const RUNES = ['ᛟ', 'ᚹ', 'ᛖ', 'ᚨ', 'ᛚ', 'ᛏ', 'ᛗ', 'ᛞ', 'ᛒ', '✦', '✧', '⚝'];

export default function ArcaneGlow() {
  const [particles, setParticles] = useState<GlowParticle[]>([]);

  useEffect(() => {
    const p = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 16 + Math.random() * 32,
      duration: 6 + Math.random() * 8,
      delay: Math.random() * 4,
      symbol: RUNES[Math.floor(Math.random() * RUNES.length)],
    }));
    setParticles(p);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999,
      background: 'radial-gradient(ellipse at 50% 50%, rgba(75, 0, 130, 0.12) 0%, transparent 70%)',
      animation: 'arcane-pulse 3s ease-in-out infinite',
    }}>
      <style>{`
        @keyframes arcane-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        @keyframes arcane-rise {
          0% { transform: translateY(0) scale(1); opacity: 0.8; }
          100% { transform: translateY(-40vh) scale(1.4); opacity: 0; }
        }
        @keyframes arcane-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {/* Rotating ring */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 300, height: 300, margin: '-150px 0 0 -150px',
        border: '2px solid rgba(123, 47, 190, 0.25)',
        borderRadius: '50%',
        animation: 'arcane-spin 20s linear infinite',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 200, height: 200, margin: '-100px 0 0 -100px',
        border: '1px solid rgba(123, 47, 190, 0.15)',
        borderRadius: '50%',
        animation: 'arcane-spin 14s linear infinite reverse',
      }} />
      {/* Floating runes */}
      {particles.map(p => (
        <span key={p.id} style={{
          position: 'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          fontSize: p.size,
          color: 'rgba(160, 100, 255, 0.5)',
          textShadow: '0 0 12px rgba(160, 100, 255, 0.6)',
          fontFamily: 'serif',
          animation: `arcane-rise ${p.duration}s ${p.delay}s ease-in infinite`,
          opacity: 0,
        }}>
          {p.symbol}
        </span>
      ))}
    </div>
  );
}
