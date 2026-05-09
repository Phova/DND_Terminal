import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { SocketEvent, SocketEventPayload, Character } from '../types';
import CharacterRepository from '../repositories/CharacterRepository';
import { persistPlayerActivity } from './playerActivityService';

let io: SocketIOServer | null = null;
const playerSockets: Map<number, Socket> = new Map();

function broadcastPlayerActivity(characterId: number, character: Character, appChanged: boolean) {
  if (appChanged) {
    emitSocketEvent(SocketEvent.CHARACTER_APP_CHANGED, {
      characterId,
      appId: character.current_app_id,
      character,
    });
  }
  emitSocketEvent(SocketEvent.CHARACTER_ACTIVITY_UPDATED, {
    characterId,
    appId: character.current_app_id,
    section: character.current_section,
    lastActivityAt: character.last_activity_at,
    character,
  });
}

export function initializeSocketIO(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.data = socket.data || {};
    socket.data.characterId = undefined;
    socket.data.skipDisconnectActivity = false;

    // Player session bind — a player logged in
    socket.on(SocketEvent.PLAYER_SESSION_BIND, async (payload: any) => {
      try {
        const characterId = Number(payload?.characterId);
        if (!characterId || Number.isNaN(characterId)) return;

        // Unbind previous if any
        const previousId = socket.data.characterId;
        if (previousId && previousId !== characterId) {
          playerSockets.delete(previousId);
        }

        // Conflict: another socket already for this character
        const existingSocket = playerSockets.get(characterId);
        if (existingSocket && existingSocket.id !== socket.id) {
          existingSocket.data.skipDisconnectActivity = true;
          existingSocket.emit(SocketEvent.PLAYER_SESSION_CONFLICT, {
            message: '你的角色已在另一个终端登录。',
            characterId,
          });
          playerSockets.delete(characterId);
          existingSocket.disconnect(true);
        }

        socket.data.characterId = characterId;
        socket.data.skipDisconnectActivity = false;
        playerSockets.set(characterId, socket);
      } catch (e) { console.error('Session bind error:', e); }
    });

    // Player session unbind
    socket.on(SocketEvent.PLAYER_SESSION_UNBIND, (payload: any = {}) => {
      const rawId = payload?.characterId ?? socket.data.characterId;
      const characterId = typeof rawId === 'number' ? rawId : Number(rawId);
      if (!characterId || Number.isNaN(characterId)) return;
      if (playerSockets.get(characterId)?.id === socket.id) {
        playerSockets.delete(characterId);
      }
      socket.data.characterId = undefined;
      socket.data.skipDisconnectActivity = Boolean(payload?.suppressDisconnectActivity);
    });

    // Player reports activity (what app/section they're viewing)
    socket.on(SocketEvent.PLAYER_ACTIVITY_REPORT, async (payload: any) => {
      try {
        const characterId = Number(payload?.characterId);
        if (!characterId || Number.isNaN(characterId)) return;

        const { character, appChanged } = await persistPlayerActivity({
          characterId,
          current_app_id: payload?.current_app_id ?? undefined,
          section: payload?.section ?? undefined,
          last_activity_at: typeof payload?.last_activity_at === 'string' ? payload.last_activity_at : undefined,
        });
        broadcastPlayerActivity(characterId, character, appChanged);
      } catch (e) { console.error('Activity report error:', e); }
    });

    // Sync request
    socket.on(SocketEvent.SYNC_REQUEST, async () => {
      try {
        const characters = CharacterRepository.findAll();
        socket.emit(SocketEvent.SYNC_RESPONSE, {
          event: SocketEvent.SYNC_RESPONSE,
          data: { characters, message: 'Dragontail — 实时同步已建立' },
          timestamp: Date.now(),
        } as SocketEventPayload);
      } catch (e) { console.error('Sync error:', e); }
    });

    emitSocketEvent(SocketEvent.CLIENT_CONNECTED, {
      socketId: socket.id,
      timestamp: Date.now(),
    });

    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id}`);
      const characterId: number | undefined = socket.data?.characterId;
      if (characterId && playerSockets.get(characterId)?.id === socket.id) {
        playerSockets.delete(characterId);
      }
      if (characterId && !socket.data?.skipDisconnectActivity) {
        try {
          const { character, appChanged } = await persistPlayerActivity({
            characterId,
            current_app_id: null,
            section: '下线',
          });
          broadcastPlayerActivity(characterId, character, appChanged);
        } catch (e) { console.error('Disconnect activity error:', e); }
      }
      emitSocketEvent(SocketEvent.CLIENT_DISCONNECTED, {
        socketId: socket.id,
        timestamp: Date.now(),
      });
    });
  });

  console.log('Socket.IO initialized with player activity tracking');
  return io;
}

export function emitSocketEvent(event: SocketEvent, data: any) {
  if (!io) { console.warn('Socket.IO not initialized'); return; }
  const payload: SocketEventPayload = { event, data, timestamp: Date.now() };
  io.emit(event, payload);
}

export function getIO(): SocketIOServer | null {
  return io;
}
