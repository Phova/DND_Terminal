import { useEffect, useState } from 'react';

interface Tendril {
  id: number;
  x: number;
  length: number;
  angle: number;
  duration: number;
  delay: number;
}

export default function ShadowCorruption() {
  const [tendrils, setTendrils] = useState<Tendril[]>([]);

  useEffect(() => {
    const t = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      length: 30 + Math.random() * 120,
      angle: -90 + (Math.random() - 0.5) * 60,
      duration: 3 + Math.random() * 5,
      delay: Math.random() * 3,
    }));
    setTendrils(t);
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999,
      background: 'radial-gradient(ellipse at 30% 80%, rgba(20, 0, 30, 0.3) 0%, transparent 50%)',
    }}>
      <style>{`
        @keyframes shadow-creep {
          0% { transform: translateY(0) scaleY(0); opacity: 0.6; }
          30% { transform: translateY(-30vh) scaleY(1); opacity: 0.9; }
          70% { transform: translateY(-60vh) scaleY(1); opacity: 0.7; }
          100% { transform: translateY(-100vh) scaleY(0.3); opacity: 0; }
        }
        @keyframes shadow-vignette {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.55; }
        }
      `}</style>
      <div style={{
        position: 'absolute', inset: 0,
        boxShadow: 'inset 0 0 120px 40px rgba(0,0,0,0.6)',
        animation: 'shadow-vignette 4s ease-in-out infinite',
      }} />
      {tendrils.map(t => (
        <div key={t.id} style={{
          position: 'absolute',
          left: `${t.x}%`,
          bottom: 0,
          width: 3,
          height: t.length,
          background: `linear-gradient(0deg, rgba(80,0,120,0.7), rgba(30,0,60,0.2), transparent)`,
          transform: `rotate(${t.angle}deg)`,
          transformOrigin: 'bottom center',
          borderRadius: '2px',
          animation: `shadow-creep ${t.duration}s ${t.delay}s ease-in infinite`,
          opacity: 0,
          filter: 'blur(1px)',
        }} />
      ))}
      {/* Floating dark motes */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={`mote-${i}`} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: 2 + Math.random() * 4,
          height: 2 + Math.random() * 4,
          background: 'rgba(60, 20, 80, 0.5)',
          borderRadius: '50%',
          animation: `shadow-creep ${4 + Math.random() * 6}s ${Math.random() * 4}s ease-in infinite`,
          opacity: 0,
        }} />
      ))}
    </div>
  );
}
