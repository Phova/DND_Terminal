import express from 'express';
import cors from 'cors';
import http from 'http';
import fs from 'fs';
import { initDatabase } from './db/database';
import { getDataDir } from './config/runtime';
import { initializeSocketIO } from './services/socketService';
import calendarService from './services/calendarService';
import characterRoutes from './routes/characters';
import partyRoutes from './routes/party';
import monsterRoutes from './routes/monsters';
import spellRoutes from './routes/spells';
import encounterRoutes from './routes/encounters';
import diceRoutes from './routes/dice';
import appRoutes from './routes/apps';
import gameTimeRoutes from './routes/gameTime';
import settingsRoutes from './routes/settings';
import messageRoutes from './routes/messages';
import broadcastRoutes from './routes/broadcast';

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.DRAGONTAIL_BACKEND_PORT || process.env.PORT || 3100);
const HOST = process.env.DRAGONTAIL_BACKEND_HOST || '0.0.0.0';

async function startServer() {
  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  await initDatabase();
  initializeSocketIO(server);

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.use((_req, _res, next) => {
    // Silent in dev
    next();
  });

  // API Routes
  app.use('/api/characters', characterRoutes);
  app.use('/api/party', partyRoutes);
  app.use('/api/monsters', monsterRoutes);
  app.use('/api/spells', spellRoutes);
  app.use('/api/encounters', encounterRoutes);
  app.use('/api/dice', diceRoutes);
  app.use('/api/apps', appRoutes);
  app.use('/api/game-time', gameTimeRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/broadcast', broadcastRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', name: 'Dragontail Backend', timestamp: new Date().toISOString() });
  });

  app.get('/', (_req, res) => {
    const time = calendarService.formatGameTime(calendarService.getCurrentGameTime());
    res.json({
      name: 'Dragontail Terminal — Backend',
      version: '0.1.0',
      status: 'running',
      gameTime: time,
      endpoints: {
        characters: '/api/characters',
        party: '/api/party',
        monsters: '/api/monsters',
        spells: '/api/spells',
        encounters: '/api/encounters',
        dice: '/api/dice',
        apps: '/api/apps',
        gameTime: '/api/game-time',
        settings: '/api/settings',
        health: '/api/health',
      },
    });
  });

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  server.listen(PORT, HOST, () => {
    console.log('═══════════════════════════════════');
    console.log('  Dragontail Terminal Backend v0.1');
    console.log('═══════════════════════════════════');
    console.log(`  HTTP:    http://${HOST}:${PORT}`);
    console.log(`  WS:      ws://${HOST}:${PORT}`);
    console.log('═══════════════════════════════════');
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
