/**
 * Test Mocks - WebSocket
 * 
 * Created: 2025-01-11
 * Purpose: Mock WebSocket connections for testing
 */

export const createMockSocket = (id = 'mock-socket-id', user = null) => {
    return {
        id,
        user: user || { id: 'anonymous', username: 'anonymous', role: 'user' },
        rooms: new Set(),
        emit: jest.fn(),
        join: jest.fn(),
        leave: jest.fn(),
        disconnect: jest.fn(),
        on: jest.fn()
    };
};

export const createMockWebSocketServer = () => {
    return {
        sockets: {
            sockets: new Map(),
            emit: jest.fn(),
            to: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis()
        },
        on: jest.fn(),
        close: jest.fn()
    };
};

export default {
    createMockSocket,
    createMockWebSocketServer
};