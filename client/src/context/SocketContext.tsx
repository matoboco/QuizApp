import React, { createContext, useContext, useMemo } from 'react';
import { useSocket } from '@/socket/useSocket';
import type { AppSocket } from '@/socket/socket';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

interface SocketContextValue {
  socket: AppSocket | null;
  isConnected: boolean;
  error: string | null;
}

const SocketContext = createContext<SocketContextValue | null>(null);

/**
 * Provides a shared socket connection status to the component tree.
 * This is optional -- the game-specific hooks (useHostGameSocket,
 * usePlayerGameSocket) manage their own sockets. Use this provider when
 * you need a global indicator of whether the user is connected via
 * WebSocket (e.g. a connection status badge in the header).
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY) ?? undefined;
  const { socket, isConnected, error } = useSocket(token);

  const value = useMemo<SocketContextValue>(
    () => ({ socket, isConnected, error }),
    [socket, isConnected, error]
  );

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook to consume the SocketContext. Must be used within a <SocketProvider>.
 */
export function useSocketContext(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}
