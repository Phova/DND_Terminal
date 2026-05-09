export default function DivineLight() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999,
      background: 'radial-gradient(ellipse at 50% 0%, rgba(255, 215, 0, 0.15) 0%, rgba(255, 180, 0, 0.05) 40%, transparent 70%)',
    }}>
      <style>{`
        @keyframes divine-rays {
          0% { opacity: 0.3; transform: rotate(0deg); }
          100% { opacity: 0.5; transform: rotate(360deg); }
        }
        @keyframes divine-fall {
          0% { transform: translateY(-10px) scale(0.8); opacity: 0.6; }
          50% { transform: translateY(10px) scale(1); opacity: 1; }
          100% { transform: translateY(-10px) scale(0.8); opacity: 0.6; }
        }
      `}</style>
      {/* Light rays from top */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: -20,
          left: `${5 + i * 12}%`,
          width: 2,
          height: '80%',
          background: `linear-gradient(0deg, transparent, rgba(255,215,0,${0.08 + i * 0.02}), rgba(255,255,200,0.12))`,
          transform: `rotate(${-15 + i * 4}deg)`,
          transformOrigin: 'top center',
          animation: `divine-rays ${8 + i * 2}s linear infinite`,
        }} />
      ))}
      {/* Floating light motes */}
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={`mote-${i}`} style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 80}%`,
          width: 4 + Math.random() * 8,
          height: 4 + Math.random() * 8,
          background: 'rgba(255, 240, 150, 0.5)',
          borderRadius: '50%',
          boxShadow: '0 0 8px rgba(255, 215, 0, 0.4)',
          animation: `divine-fall ${2 + Math.random() * 3}s ${Math.random() * 2}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}
