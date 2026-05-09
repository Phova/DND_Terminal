import { useEffect, useState } from 'react';

interface Spark {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  drift: number;
}

const COLORS = [
  'rgba(255, 100, 30, 0.9)',  // fire
  'rgba(255, 200, 40, 0.8)',  // ember
  'rgba(80, 200, 255, 0.8)',  // ice
  'rgba(200, 240, 255, 0.9)', // frost
];

export default function ElementalBurst() {
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    const s = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: 35 + Math.random() * 30,
      y: 35 + Math.random() * 30,
      size: 3 + Math.random() * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      duration: 1.5 + Math.random() * 3,
      delay: Math.random() * 1.5,
      drift: (Math.random() - 0.5) * 80,
    }));
    setSparks(s);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999,
      background: 'radial-gradient(ellipse at 50% 50%, rgba(255, 100, 30, 0.08) 0%, transparent 60%)',
    }}>
      <style>{`
        @keyframes burst-out {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
        }
        @keyframes burst-flash {
          0%, 100% { opacity: 0; }
          10%, 30% { opacity: 0.15; }
        }
      `}</style>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(255, 200, 60, 0.15), transparent 60%)',
        animation: 'burst-flash 2s ease-out infinite',
      }} />
      {sparks.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          background: s.color,
          borderRadius: '50%',
          boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
          animation: `burst-out ${s.duration}s ${s.delay}s ease-out infinite`,
          '--dx': `${s.drift}vw`,
          '--dy': `${-30 - Math.random() * 60}vh`,
          opacity: 0,
        } as React.CSSProperties} />
      ))}
    </div>
  );
}
