import { useState, useEffect, useRef, useCallback } from 'react';
import { createSocket, type AppSocket } from './socket';

interface UseSocketReturn {
  socket: AppSocket | null;
  isConnected: boolean;
  error: string | null;
}

/**
 * Base hook that manages a Socket.IO client connection lifecycle.
 * Creates a socket on mount, connects it, and cleans up on unmount.
 * If the token changes, the existing socket is disconnected and a new one
 * is created with the updated token.
 *
 * @param token - Optional JWT token passed in the auth handshake.
 * @returns The socket instance, connection status, and any error message.
 */
export function useSocket(token?: string): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<AppSocket | null>(null);
  const tokenRef = useRef<string | undefined>(token);

  // Stable disconnect helper
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  useEffect(() => {
    // If the token changed, tear down the old socket so we recreate with the new token
    if (socketRef.current && tokenRef.current !== token) {
      disconnectSocket();
      setIsConnected(false);
      setError(null);
    }
    tokenRef.current = token;

    // Create a fresh socket
    const socket = createSocket(token);
    socketRef.current = socket;

    const onConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onConnectError = (err: Error) => {
      setIsConnected(false);
      setError(err.message || 'Connection error');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, disconnectSocket]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
  };
}
