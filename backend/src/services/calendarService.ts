import { GameTime, GameTimeState, SocketEvent } from '../types';
import { emitSocketEvent } from './socketService';

const FANTASY_MONTHS = [
  '深冬之月', '冬日之爪', '日落之月',
  '风暴之月', '融雪之月', '花开之月',
  '夏潮之月', '高日之月', '凋零之月',
  '落叶之月', '腐叶之月', '岁末之月',
];

class CalendarService {
  private state: GameTimeState = {
    era: 3,     // 巨龙纪元
    year: 1492,
    month: 1,   // 深冬之月
    day: 1,
    hour: 8,
    minute: 0,
    second: 0,
    is_paused: true,
    real_time_ref: Date.now(),
  };

  getCurrentGameTime(): GameTime {
    if (this.state.is_paused) {
      return this.extractTime(this.state);
    }
    const now = Date.now();
    const elapsedMs = now - this.state.real_time_ref;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    return this.addSeconds(this.extractTime(this.state), elapsedSeconds);
  }

  getState(): GameTimeState {
    return { ...this.state };
  }

  setGameTime(time: GameTime): GameTimeState {
    this.state = { ...time, is_paused: this.state.is_paused, real_time_ref: Date.now() };
    emitSocketEvent(SocketEvent.GAME_TIME_UPDATED, this.getState());
    return this.getState();
  }

  pause(): GameTimeState {
    if (!this.state.is_paused) {
      const now = this.getCurrentGameTime();
      this.state = { ...now, is_paused: true, real_time_ref: Date.now() };
      emitSocketEvent(SocketEvent.GAME_TIME_PAUSED, this.getState());
    }
    return this.getState();
  }

  resume(): GameTimeState {
    if (this.state.is_paused) {
      this.state.is_paused = false;
      this.state.real_time_ref = Date.now();
      emitSocketEvent(SocketEvent.GAME_TIME_RESUMED, this.getState());
    }
    return this.getState();
  }

  advanceSeconds(seconds: number): GameTimeState {
    const newTime = this.addSeconds(this.getCurrentGameTime(), seconds);
    this.state = { ...newTime, is_paused: this.state.is_paused, real_time_ref: Date.now() };
    emitSocketEvent(SocketEvent.GAME_TIME_UPDATED, this.getState());
    return this.getState();
  }

  advanceMinutes(minutes: number): GameTimeState {
    return this.advanceSeconds(minutes * 60);
  }

  advanceHours(hours: number): GameTimeState {
    return this.advanceSeconds(hours * 3600);
  }

  advanceDays(days: number): GameTimeState {
    return this.advanceSeconds(days * 86400);
  }

  getMonthName(month: number): string {
    const idx = ((month - 1) % 12 + 12) % 12;
    return FANTASY_MONTHS[idx];
  }

  formatGameTime(time: GameTime): string {
    return `纪元${time.era}年 ${time.year}年 ${this.getMonthName(time.month)} ${time.day}日 ${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`;
  }

  private extractTime(state: GameTimeState): GameTime {
    return {
      era: state.era, year: state.year, month: state.month,
      day: state.day, hour: state.hour, minute: state.minute, second: state.second,
    };
  }

  private addSeconds(time: GameTime, seconds: number): GameTime {
    let { era, year, month, day, hour, minute, second } = time;
    second += seconds;

    while (second >= 60) { second -= 60; minute++; }
    while (second < 0) { second += 60; minute--; }
    while (minute >= 60) { minute -= 60; hour++; }
    while (minute < 0) { minute += 60; hour--; }
    while (hour >= 24) { hour -= 24; day++; }
    while (hour < 0) { hour += 24; day--; }
    while (day > 30) { day -= 30; month++; }
    while (day < 1) { day += 30; month--; }
    while (month > 12) { month -= 12; year++; }
    while (month < 1) { month += 12; year--; }

    return { era, year, month, day, hour, minute, second };
  }
}

export default new CalendarService();
