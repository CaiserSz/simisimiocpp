import { createServer } from 'http';
import Client from 'socket.io-client';
import jwt from 'jsonwebtoken';
import WebSocketServer from '../../services/WebSocketServer.js';
import config from '../../config/config.js';

const originalEnableAuth = config.security.enableAuth;
const originalJwtSecret = config.security.jwtSecret;

describe('WebSocket Authentication (Integration)', () => {
    let server;
    let wsServer;
    let port;

    beforeAll((done) => {
        config.security.enableAuth = true;
        config.security.jwtSecret = originalJwtSecret || 'integration-secret';

        server = createServer();
        server.listen(0, () => {
            const address = server.address();
            port = typeof address === 'object' && address ? address.port : 0;
            wsServer = new WebSocketServer();
            wsServer.initialize(server);
            done();
        });
    });

    afterAll((done) => {
        config.security.enableAuth = originalEnableAuth;
        config.security.jwtSecret = originalJwtSecret;

        if (wsServer?.io) {
            wsServer.io.close();
        }

        if (server) {
            server.close(done);
        } else {
            done();
        }
    });

    test('rejects connections without token', (done) => {
        const socket = new Client(`http://localhost:${port}`, {
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            socket.close();
            done.fail('Connection should not succeed without token');
        });

        socket.on('connect_error', (error) => {
            expect(error.message).toContain('Authentication error');
            socket.close();
            done();
        });
    });

    test('accepts connections with valid token', (done) => {
        const token = jwt.sign(
            { id: 'integration-user', username: 'integration', role: 'admin' },
            config.security.jwtSecret,
            { expiresIn: '1h' }
        );

        const socket = new Client(`http://localhost:${port}`, {
            transports: ['websocket'],
            auth: { token },
        });

        socket.on('connect', () => {
            expect(socket.connected).toBe(true);
            socket.close();
            done();
        });

        socket.on('connect_error', (error) => {
            socket.close();
            done.fail(`Expected successful connection, received: ${error.message}`);
        });
    });
});
