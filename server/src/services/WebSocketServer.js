import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import { authenticate, socketAuthenticate } from '../middleware/auth.middleware.js';
import stationManager from './StationManager.js';

/**
 * Enterprise WebSocket Server for Real-time Communication
 */
class WebSocketServer {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
    this.roomSubscriptions = new Map();
    this.messageQueue = new Map();
  }

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      maxHttpBufferSize: 1e6, // 1MB
      connectTimeout: 45000
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupStationManagerIntegration();

    logger.info('🚀 WebSocket Server initialized');
    return this.io;
  }

  /**
   * Setup authentication middleware
   */
  setupMiddleware() {
    // Authentication middleware
    this.io.use(socketAuthenticate);

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const clientId = socket.handshake.address;
      const now = Date.now();
      const windowMs = 60000; // 1 minute
      const maxRequests = 100;

      if (!this.messageQueue.has(clientId)) {
        this.messageQueue.set(clientId, []);
      }

      const requests = this.messageQueue.get(clientId);
      const validRequests = requests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return next(new Error('Rate limit exceeded'));
      }

      validRequests.push(now);
      this.messageQueue.set(clientId, validRequests);
      next();
    });
  }

  /**
   * Setup main event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new client connection
   */
  handleConnection(socket) {
    const user = socket.user;
    const clientInfo = {
      id: socket.id,
      userId: user.id,
      username: user.username,
      role: user.role,
      connectedAt: new Date(),
      lastActivity: new Date()
    };

    this.connectedClients.set(socket.id, clientInfo);

    logger.info(`👤 User ${user.username} connected (${socket.id})`);

    // Join user to personal room
    socket.join(`user:${user.id}`);

    // Join role-based rooms
    socket.join(`role:${user.role}`);

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to EV Charging Network',
      clientId: socket.id,
      timestamp: new Date().toISOString()
    });

    this.setupClientEventHandlers(socket);
    this.sendInitialData(socket, user);
  }

  /**
   * Setup client-specific event handlers
   */
  setupClientEventHandlers(socket) {
    const user = socket.user;

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle station subscription
    socket.on('subscribe:station', (data) => {
      this.handleStationSubscription(socket, data);
    });

    // Handle station unsubscription
    socket.on('unsubscribe:station', (data) => {
      this.handleStationUnsubscription(socket, data);
    });

    // Handle real-time station commands (admin/operator only)
    socket.on('station:command', async (data) => {
      if (['admin', 'operator'].includes(user.role)) {
        await this.handleStationCommand(socket, data);
      } else {
        socket.emit('error', { message: 'Insufficient permissions' });
      }
    });

    // Handle activity tracking
    socket.on('activity', () => {
      this.updateClientActivity(socket.id);
    });

    // Handle chat messages (if enabled)
    socket.on('chat:message', (data) => {
      this.handleChatMessage(socket, data);
    });

    // Handle ping-pong for connection health
    socket.on('ping', (data) => {
      socket.emit('pong', { ...data, serverTime: Date.now() });
    });
  }

  /**
   * Handle client disconnection
   */
  handleDisconnection(socket, reason) {
    const clientInfo = this.connectedClients.get(socket.id);
    
    if (clientInfo) {
      logger.info(`👋 User ${clientInfo.username} disconnected (${reason})`);
      this.connectedClients.delete(socket.id);
    }

    // Clean up room subscriptions
    if (this.roomSubscriptions.has(socket.id)) {
      this.roomSubscriptions.delete(socket.id);
    }
  }

  /**
   * Handle station subscription
   */
  handleStationSubscription(socket, data) {
    const { stationId } = data;
    
    if (!stationId) {
      socket.emit('error', { message: 'Station ID is required' });
      return;
    }

    const roomName = `station:${stationId}`;
    socket.join(roomName);

    // Track subscription
    if (!this.roomSubscriptions.has(socket.id)) {
      this.roomSubscriptions.set(socket.id, new Set());
    }
    this.roomSubscriptions.get(socket.id).add(roomName);

    logger.debug(`Client ${socket.id} subscribed to ${roomName}`);

    // Send current station status
    try {
      const station = stationManager.getStation(stationId);
      socket.emit('station:status', {
        stationId,
        data: station,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('error', { 
        message: 'Station not found',
        stationId 
      });
    }
  }

  /**
   * Handle station unsubscription
   */
  handleStationUnsubscription(socket, data) {
    const { stationId } = data;
    const roomName = `station:${stationId}`;
    
    socket.leave(roomName);

    if (this.roomSubscriptions.has(socket.id)) {
      this.roomSubscriptions.get(socket.id).delete(roomName);
    }

    logger.debug(`Client ${socket.id} unsubscribed from ${roomName}`);
  }

  /**
   * Handle station commands
   */
  async handleStationCommand(socket, data) {
    try {
      const { stationId, command, params = {} } = data;
      
      logger.info(`Station command: ${command} for ${stationId} by user ${socket.user.username}`);

      const result = await stationManager.sendCommand(stationId, command, params);

      socket.emit('station:command:result', {
        stationId,
        command,
        success: true,
        result,
        timestamp: new Date().toISOString()
      });

      // Broadcast to all subscribers
      this.broadcastToStation(stationId, 'station:command:executed', {
        stationId,
        command,
        executedBy: socket.user.username,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Station command failed:', error);
      socket.emit('station:command:result', {
        stationId: data.stationId,
        command: data.command,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle chat messages
   */
  handleChatMessage(socket, data) {
    const { message, room = 'general' } = data;
    const user = socket.user;

    if (!message || message.trim().length === 0) {
      return;
    }

    const chatData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: message.trim(),
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      room,
      timestamp: new Date().toISOString()
    };

    // Broadcast to room
    this.io.to(`chat:${room}`).emit('chat:message', chatData);

    logger.debug(`Chat message from ${user.username} in ${room}: ${message}`);
  }

  /**
   * Setup Station Manager integration
   */
  setupStationManagerIntegration() {
    // Listen to station events
    stationManager.on('station:connected', (data) => {
      this.broadcastToStation(data.stationId, 'station:connected', data);
      this.broadcastToRole('admin', 'station:connected', data);
      this.broadcastToRole('operator', 'station:connected', data);
    });

    stationManager.on('station:disconnected', (data) => {
      this.broadcastToStation(data.stationId, 'station:disconnected', data);
      this.broadcastToRole('admin', 'station:disconnected', data);
      this.broadcastToRole('operator', 'station:disconnected', data);
    });

    stationManager.on('station:status', (data) => {
      this.broadcastToStation(data.stationId, 'station:status', data);
    });

    stationManager.on('station:meter', (data) => {
      this.broadcastToStation(data.stationId, 'station:meter', data);
    });

    stationManager.on('station:error', (data) => {
      this.broadcastToStation(data.stationId, 'station:error', data);
      this.broadcastToRole('admin', 'station:error', data);
    });
  }

  /**
   * Send initial data to connected client
   */
  async sendInitialData(socket, user) {
    try {
      // Send station summary for dashboard
      const stations = stationManager.getAllStations();
      const summary = {
        total: stations.length,
        online: stations.filter(s => s.status === 'connected').length,
        charging: stations.filter(s => s.status === 'charging').length,
        available: stations.filter(s => s.status === 'available').length
      };

      socket.emit('dashboard:summary', {
        stations: summary,
        timestamp: new Date().toISOString()
      });

      // Send user-specific data based on role
      if (['admin', 'operator'].includes(user.role)) {
        socket.emit('stations:list', {
          stations,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      logger.error('Error sending initial data:', error);
    }
  }

  /**
   * Broadcast message to station subscribers
   */
  broadcastToStation(stationId, event, data) {
    this.io.to(`station:${stationId}`).emit(event, {
      stationId,
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    });
  }

  /**
   * Broadcast message to role-based room
   */
  broadcastToRole(role, event, data) {
    this.io.to(`role:${role}`).emit(event, {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    });
  }

  /**
   * Broadcast to all connected clients
   */
  broadcastToAll(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    });
  }

  /**
   * Update client activity
   */
  updateClientActivity(socketId) {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.lastActivity = new Date();
    }
  }

  /**
   * Get connected clients statistics
   */
  getStatistics() {
    const clients = Array.from(this.connectedClients.values());
    
    return {
      totalConnections: clients.length,
      usersByRole: clients.reduce((acc, client) => {
        acc[client.role] = (acc[client.role] || 0) + 1;
        return acc;
      }, {}),
      rooms: this.io.sockets.adapter.rooms.size,
      activeSubscriptions: this.roomSubscriptions.size
    };
  }

  /**
   * Send notification to specific user
   */
  sendToUser(userId, event, data) {
    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down WebSocket server...');
    
    // Notify all clients
    this.broadcastToAll('server:shutdown', {
      message: 'Server is shutting down for maintenance'
    });

    // Wait a moment for messages to be sent
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Close all connections
    this.io.close();
    
    logger.info('WebSocket server shutdown complete');
  }
}

export default new WebSocketServer();
