import { useEffect, useRef, useState, useCallback } from 'react';

interface GameTimeState {
  era: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  is_paused: boolean;
  real_time_ref: number;
}

export type TickPulse = 'pulse-a' | 'pulse-b';

const addSecondsToTime = (time: GameTimeState, seconds: number): GameTimeState => {
  let { era, year, month, day, hour, minute, second } = time;
  second += seconds;

  while (second >= 60) { second -= 60; minute += 1; }
  while (second < 0) { second += 60; minute -= 1; }
  while (minute >= 60) { minute -= 60; hour += 1; }
  while (minute < 0) { minute += 60; hour -= 1; }
  while (hour >= 24) { hour -= 24; day += 1; }
  while (hour < 0) { hour += 24; day -= 1; }
  while (day > 30) { day -= 30; month += 1; }
  while (day < 1) { day += 30; month -= 1; }
  while (month > 12) { month -= 12; year += 1; }
  while (month < 1) { month += 12; year -= 1; }

  return { ...time, era, year, month, day, hour, minute, second };
};

export function useGameClock(gameTime: GameTimeState | null) {
  const [displayTime, setDisplayTime] = useState<GameTimeState | null>(gameTime);
  const [tickPulse, setTickPulse] = useState<TickPulse>('pulse-a');
  const gameTimeRef = useRef(gameTime);

  useEffect(() => {
    gameTimeRef.current = gameTime;
  }, [gameTime]);

  useEffect(() => {
    if (!gameTime) return;
    if (gameTime.is_paused) {
      setDisplayTime(gameTime);
      return;
    }

    const intervalId = setInterval(() => {
      const ref = gameTimeRef.current;
      if (!ref || ref.is_paused) return;
      const now = Date.now();
      const elapsedMs = now - ref.real_time_ref;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const calculatedTime = addSecondsToTime(ref, elapsedSeconds);
      setDisplayTime(calculatedTime);
    }, 100);

    return () => clearInterval(intervalId);
  }, [gameTime]);

  useEffect(() => {
    if (displayTime) {
      setTickPulse(prev => (prev === 'pulse-a' ? 'pulse-b' : 'pulse-a'));
    }
  }, [displayTime?.second]);

  return { displayTime, tickPulse };
}
