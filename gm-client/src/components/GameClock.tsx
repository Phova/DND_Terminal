import { useState, useEffect } from 'react';

export default function GameClock() {
  const [time, setTime] = useState<string>('Loading...');

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const res = await fetch('/api/game-time');
        const data = await res.json();
        setTime(data.formatted || JSON.stringify(data));
      } catch {
        setTime('Time lost in the Feywild...');
      }
    };
    fetchTime();
    const interval = setInterval(fetchTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="game-clock">
      🕯️ {time}
    </div>
  );
}
