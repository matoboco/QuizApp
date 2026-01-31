import { config } from './config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { initializeDatabase } from './db/schema';
import { closeDb } from './db/connection';
import { setupSocketHandlers } from './socket/socket.handler';
import { gameEngine } from './game/game.engine';
import { gameCleanup } from './game/game-cleanup';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '../../shared/types/socket-events';

// ---------------------------------------------------------------------------
// HTTP + Socket.IO servers
// ---------------------------------------------------------------------------
const httpServer = createServer(app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ---------------------------------------------------------------------------
// Database initialisation
// ---------------------------------------------------------------------------
try {
  initializeDatabase();
  console.log('[db] Database initialised successfully');
} catch (err) {
  console.error('[db] Failed to initialise database:', err);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Socket.IO - initialize game engine and set up event handlers
// ---------------------------------------------------------------------------
gameEngine.initialize(io);
setupSocketHandlers(io);
console.log('[socket.io] Socket handlers registered');

// ---------------------------------------------------------------------------
// Game cleanup - start periodic stale-session cleanup
// ---------------------------------------------------------------------------
gameCleanup.startCleanupInterval();

// ---------------------------------------------------------------------------
// Start listening
// ---------------------------------------------------------------------------
httpServer.listen(config.port, () => {
  console.log(
    `[server] Quiz App server running on http://localhost:${config.port} (${config.nodeEnv})`,
  );
});

// ---------------------------------------------------------------------------
// Handle uncaught errors so the process doesn't crash silently
// ---------------------------------------------------------------------------
process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught exception:', err);
  // Attempt a graceful shutdown on fatal errors
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
let isShuttingDown = false;

function gracefulShutdown(signal: string) {
  if (isShuttingDown) return; // prevent double-shutdown
  isShuttingDown = true;

  console.log(`\n[server] ${signal} received - shutting down gracefully...`);

  // Stop the game cleanup interval
  gameCleanup.stopCleanupInterval();

  // Stop accepting new connections
  httpServer.close(() => {
    console.log('[server] HTTP server closed');
  });

  // Close all Socket.IO connections
  io.close(() => {
    console.log('[server] Socket.IO server closed');
  });

  // Close the SQLite database
  try {
    closeDb();
    console.log('[server] Database connection closed');
  } catch (err) {
    console.error('[server] Error closing database:', err);
  }

  // Give existing connections a moment to finish, then exit
  setTimeout(() => {
    console.log('[server] Forcing exit');
    process.exit(0);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ---------------------------------------------------------------------------
// Exports for use by other modules (e.g. game socket handlers)
// ---------------------------------------------------------------------------
export { httpServer, io };
