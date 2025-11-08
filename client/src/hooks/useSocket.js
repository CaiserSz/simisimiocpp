/**
 * Socket.IO Hook
 * React hook for Socket.IO connection
 * 
 * Created: 2025-01-11
 * Purpose: Centralized Socket.IO management
 */

import { io } from 'socket.io-client';
import { useEffect, useState } from 'useRef';

const SOCKET_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socketInstance = null;

export function useSocket() {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Create socket instance if not exists
        if (!socketInstance) {
            const token = localStorage.getItem('token');

            socketInstance = io(SOCKET_URL, {
                auth: {
                    token,
                },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5,
                transports: ['websocket', 'polling'],
            });

            socketInstance.on('connect', () => {
                console.log('✅ Socket.IO connected');
                setIsConnected(true);
            });

            socketInstance.on('disconnect', () => {
                console.log('🔌 Socket.IO disconnected');
                setIsConnected(false);
            });

            socketInstance.on('connect_error', (error) => {
                console.error('Socket.IO connection error:', error);
                setIsConnected(false);
            });
        }

        setSocket(socketInstance);

        return () => {
            // Don't disconnect on unmount, keep connection alive
        };
    }, []);

    return { socket, isConnected };
}