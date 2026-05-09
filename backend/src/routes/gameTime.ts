import { Router, Request, Response } from 'express';
import calendarService from '../services/calendarService';

const router = Router();

// Get current game time
router.get('/', (_req: Request, res: Response) => {
  const state = calendarService.getState();
  res.json({
    ...state,
    formatted: calendarService.formatGameTime(state),
  });
});

// Set game time
router.put('/', (req: Request, res: Response) => {
  const { era, year, month, day, hour, minute, second } = req.body;
  if (era !== undefined && year !== undefined && month !== undefined && day !== undefined) {
    calendarService.setGameTime({
      era: era ?? state.era,
      year: year ?? state.year,
      month: month ?? state.month,
      day: day ?? state.day,
      hour: hour ?? state.hour,
      minute: minute ?? state.minute,
      second: second ?? state.second,
    });
  }
  const state = calendarService.getState();
  res.json({ ...state, formatted: calendarService.formatGameTime(state) });
});

// Pause
router.post('/pause', (_req: Request, res: Response) => {
  const state = calendarService.pause();
  res.json({ ...state, formatted: calendarService.formatGameTime(state) });
});

// Resume
router.post('/resume', (_req: Request, res: Response) => {
  const state = calendarService.resume();
  res.json({ ...state, formatted: calendarService.formatGameTime(state) });
});

// Advance time
router.post('/advance', (req: Request, res: Response) => {
  const { seconds, minutes, hours, days } = req.body;
  if (days) calendarService.advanceDays(days);
  else if (hours) calendarService.advanceHours(hours);
  else if (minutes) calendarService.advanceMinutes(minutes);
  else if (seconds) calendarService.advanceSeconds(seconds);
  const state = calendarService.getState();
  res.json({ ...state, formatted: calendarService.formatGameTime(state) });
});

export default router;
