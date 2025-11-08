import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Client from 'socket.io-client';
import WebSocketServer from '../../../services/WebSocketServer.js';
import jwt from 'jsonwebtoken';
import config from '../../../config/config.js';

const runWebSocketSuite = process.env.WS_TESTS === 'true';
const describeOrSkip = runWebSocketSuite ? describe : describe.skip;

describeOrSkip('WebSocketServer', () => {
  let httpServer;
  let webSocketServer;
  let clientSocket;
  let serverPort;

  beforeAll((done) => {
    httpServer = createServer();
    
    httpServer.listen(0, () => {
      const address = httpServer.address();
      serverPort = typeof address === 'object' && address ? address.port : 0;

      webSocketServer = new WebSocketServer();
      webSocketServer.initialize(httpServer);
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket) {
      clientSocket.close();
    }
    if (webSocketServer && webSocketServer.io) {
      webSocketServer.io.close();
    }
    if (httpServer) {
      httpServer.close(done);
    } else {
      done();
    }
  });

  beforeEach((done) => {
    // Create valid JWT token for testing
    const token = jwt.sign(
      { id: 'test', username: 'test', role: 'admin' },
      config.security.jwtSecret,
      { expiresIn: '1h' }
    );

    clientSocket = new Client(`http://localhost:${serverPort}`, {
      auth: { token },
      transports: ['websocket']
    });

    clientSocket.on('connect', done);
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.close();
      clientSocket = null;
    }
  });

  describe('Connection Management', () => {
    test('should accept authenticated connection', (done) => {
      // Connection is already established in beforeEach
      expect(clientSocket.connected).toBe(true);
      done();
    });

    test('should reject connection without token', (done) => {
      const unauthenticatedClient = new Client(`http://localhost:${serverPort}`, {
        transports: ['websocket']
      });

      const failTimer = setTimeout(() => {
        unauthenticatedClient.close();
        done(new Error('Expected authentication error'));
      }, 2000);
      failTimer.unref?.();

      unauthenticatedClient.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication error');
        unauthenticatedClient.close();
        clearTimeout(failTimer);
        done();
      });
    });

    test('should reject connection with invalid token', (done) => {
      const invalidClient = new Client(`http://localhost:${serverPort}`, {
        auth: { token: 'invalid.jwt.token' },
        transports: ['websocket']
      });

      const failTimer = setTimeout(() => {
        invalidClient.close();
        done(new Error('Expected authentication error'));
      }, 2000);
      failTimer.unref?.();

      invalidClient.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication error');
        invalidClient.close();
        clearTimeout(failTimer);
        done();
      });
    });

    test('should track connected users', () => {
      const stats = webSocketServer.getStatistics();
      expect(stats.totalConnections).toBeGreaterThan(0);
    });

    test('should handle disconnection', (done) => {
      const initialConnections = webSocketServer.getStatistics().totalConnections;
      
      clientSocket.on('disconnect', () => {
        const timer = setTimeout(() => {
          const finalConnections = webSocketServer.getStatistics().totalConnections;
          expect(finalConnections).toBeLessThan(initialConnections);
          done();
        }, 100);
        timer.unref?.();
      });

      clientSocket.close();
    });
  });

  describe('Station Subscriptions', () => {
    test('should allow subscription to station events', (done) => {
      clientSocket.emit('subscribe:station', 'TEST_STATION_001');
      
      clientSocket.on('subscription:confirmed', (data) => {
        expect(data.stationId).toBe('TEST_STATION_001');
        expect(data.type).toBe('station');
        done();
      });
    });

    test('should allow unsubscription from station events', (done) => {
      // First subscribe
      clientSocket.emit('subscribe:station', 'TEST_STATION_002');
      
      clientSocket.on('subscription:confirmed', () => {
        // Then unsubscribe
        clientSocket.emit('unsubscribe:station', 'TEST_STATION_002');
        
        clientSocket.on('subscription:removed', (data) => {
          expect(data.stationId).toBe('TEST_STATION_002');
          expect(data.type).toBe('station');
          done();
        });
      });
    });

    test('should broadcast station events to subscribers', (done) => {
      const stationId = 'BROADCAST_TEST_STATION';
      
      clientSocket.emit('subscribe:station', stationId);
      
      clientSocket.on('subscription:confirmed', () => {
        // Simulate a station event
        webSocketServer.broadcastStationEvent(stationId, 'stationStarted', {
          stationId,
          timestamp: new Date().toISOString()
        });
      });

      clientSocket.on('station:started', (data) => {
        expect(data.stationId).toBe(stationId);
        expect(data.timestamp).toBeDefined();
        done();
      });
    });

    test('should not broadcast to unsubscribed clients', (done) => {
      const stationId = 'UNSUBSCRIBED_TEST';
      let eventReceived = false;

      // Don't subscribe to this station
      clientSocket.on('station:started', () => {
        eventReceived = true;
      });

      // Broadcast event
      webSocketServer.broadcastStationEvent(stationId, 'stationStarted', {
        stationId,
        timestamp: new Date().toISOString()
      });

      // Wait and check that event was not received
      const waitHandle = setTimeout(() => {
        expect(eventReceived).toBe(false);
        done();
      }, 100);
      waitHandle.unref?.();
    });
  });

  describe('Dashboard Updates', () => {
    test('should broadcast dashboard updates', (done) => {
      const dashboardData = {
        totalStations: 10,
        onlineStations: 8,
        totalPower: 150.5,
        timestamp: new Date().toISOString()
      };

      clientSocket.on('dashboard:update', (data) => {
        expect(data.totalStations).toBe(10);
        expect(data.onlineStations).toBe(8);
        expect(data.totalPower).toBe(150.5);
        expect(data.timestamp).toBeDefined();
        done();
      });

      webSocketServer.broadcastDashboardUpdate(dashboardData);
    });

    test('should broadcast metrics updates', (done) => {
      const metricsData = {
        powerConsumption: 200.5,
        energyDelivered: 1500.2,
        activeConnectors: 5,
        timestamp: new Date().toISOString()
      };

      clientSocket.on('metrics:update', (data) => {
        expect(data.powerConsumption).toBe(200.5);
        expect(data.energyDelivered).toBe(1500.2);
        expect(data.activeConnectors).toBe(5);
        done();
      });

      webSocketServer.broadcastMetricsUpdate(metricsData);
    });
  });

  describe('Real-time Events', () => {
    test('should broadcast charging started events', (done) => {
      const chargingData = {
        stationId: 'TEST_STATION',
        connectorId: 1,
        transactionId: 'TXN_123',
        timestamp: new Date().toISOString()
      };

      clientSocket.on('charging:started', (data) => {
        expect(data.stationId).toBe('TEST_STATION');
        expect(data.connectorId).toBe(1);
        expect(data.transactionId).toBe('TXN_123');
        done();
      });

      webSocketServer.broadcastChargingEvent('chargingStarted', chargingData);
    });

    test('should broadcast meter values', (done) => {
      const meterData = {
        stationId: 'TEST_STATION',
        connectorId: 1,
        values: {
          power: 7400,
          energy: 15.5,
          current: [10.2, 10.1, 10.3],
          voltage: [230, 230, 230]
        },
        timestamp: new Date().toISOString()
      };

      clientSocket.on('meter:values', (data) => {
        expect(data.stationId).toBe('TEST_STATION');
        expect(data.values.power).toBe(7400);
        expect(data.values.energy).toBe(15.5);
        done();
      });

      webSocketServer.broadcastMeterValues(meterData);
    });

    test('should broadcast system notifications', (done) => {
      const notification = {
        type: 'info',
        title: 'System Update',
        message: 'New station connected',
        timestamp: new Date().toISOString()
      };

      clientSocket.on('notification', (data) => {
        expect(data.type).toBe('info');
        expect(data.title).toBe('System Update');
        expect(data.message).toBe('New station connected');
        done();
      });

      webSocketServer.broadcastNotification(notification);
    });
  });

  describe('Statistics and Management', () => {
    test('should provide connection statistics', () => {
      const stats = webSocketServer.getStatistics();

      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('usersByRole');
      expect(stats).toHaveProperty('rooms');
      expect(stats).toHaveProperty('activeSubscriptions');
      expect(typeof stats.totalConnections).toBe('number');
    });

    test('should track user roles', () => {
      const stats = webSocketServer.getStatistics();
      
      // Our test user is admin
      expect(stats.usersByRole).toHaveProperty('admin');
      expect(stats.usersByRole.admin).toBeGreaterThan(0);
    });

    test('should provide health check', () => {
      const health = webSocketServer.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.connections).toBeDefined();
      expect(health.uptime).toBeDefined();
      expect(typeof health.connections).toBe('number');
      expect(typeof health.uptime).toBe('number');
    });

    test('should handle graceful shutdown', async () => {
      const shutdownResult = await webSocketServer.shutdown();
      
      expect(shutdownResult.success).toBe(true);
      expect(shutdownResult.connectionsTerminated).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid subscription requests', (done) => {
      clientSocket.emit('subscribe:station', null);
      
      clientSocket.on('error', (error) => {
        expect(error.message).toContain('Invalid station ID');
        done();
      });
    });

    test('should handle rate limiting', (done) => {
      // Simulate rapid requests
      for (let i = 0; i < 20; i++) {
        clientSocket.emit('subscribe:station', `RATE_LIMIT_TEST_${i}`);
      }

      clientSocket.on('rate_limit_exceeded', (data) => {
        expect(data.message).toContain('Rate limit exceeded');
        done();
      });
    });

    test('should handle malformed messages', (done) => {
      // Send malformed data
      clientSocket.emit('invalid:event', { malformed: 'data' });
      
      clientSocket.on('error', (error) => {
        expect(error.message).toContain('Invalid event');
        done();
      });
    });
  });

  describe('Room Management', () => {
    test('should manage user rooms correctly', (done) => {
      const roomName = 'test-room';
      
      clientSocket.emit('join:room', roomName);
      
      clientSocket.on('room:joined', (data) => {
        expect(data.room).toBe(roomName);
        
        const stats = webSocketServer.getStatistics();
        expect(stats.rooms).toBeGreaterThan(0);
        done();
      });
    });

    test('should broadcast to specific rooms', (done) => {
      const roomName = 'broadcast-test-room';
      
      clientSocket.emit('join:room', roomName);
      
      clientSocket.on('room:joined', () => {
        webSocketServer.broadcastToRoom(roomName, 'room:message', {
          message: 'Hello room!',
          timestamp: new Date().toISOString()
        });
      });

      clientSocket.on('room:message', (data) => {
        expect(data.message).toBe('Hello room!');
        done();
      });
    });

    test('should leave rooms properly', (done) => {
      const roomName = 'leave-test-room';
      
      clientSocket.emit('join:room', roomName);
      
      clientSocket.on('room:joined', () => {
        clientSocket.emit('leave:room', roomName);
      });

      clientSocket.on('room:left', (data) => {
        expect(data.room).toBe(roomName);
        done();
      });
    });
  });
});
