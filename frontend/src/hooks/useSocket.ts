import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const socket = useRef<Socket | undefined>(undefined);

  useEffect(() => {
    socket.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5900', {
      transports: ['websocket'],
    });

    return () => {
      socket.current?.disconnect();
    };
  }, []);

  return socket.current;
};
