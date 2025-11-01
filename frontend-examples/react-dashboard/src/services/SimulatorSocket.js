import { io } from 'socket.io-client';

class SimulatorSocket {
  constructor() {
    this.socket = null;
    this.eventHandlers = new Map();
    this.connectionStatus = 'disconnected';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(token) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventHandlers();
    return this.socket;
  }

  setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🟢 Connected to simulator');
      this.connectionStatus = 'connected';
      this.reconnectAttempts = 0;
      this.emit('connection:status', { status: 'connected' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Disconnected from simulator:', reason);
      this.connectionStatus = 'disconnected';
      this.emit('connection:status', { status: 'disconnected', reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      this.connectionStatus = 'error';
      this.emit('connection:status', { status: 'error', error: error.message });
      this.handleReconnection();
    });

    // Simulation events
    this.socket.on('simulation:started', (data) => {
      this.emit('notification', {
        severity: 'success',
        message: `Simulation started with ${data.stationCount} stations`
      });
      this.emit('simulation:started', data);
    });

    this.socket.on('simulation:stopped', (data) => {
      this.emit('notification', {
        severity: 'info',
        message: `Simulation stopped after ${Math.round(data.duration)}s`
      });
      this.emit('simulation:stopped', data);
    });

    // Station events
    this.socket.on('station:created', (data) => {
      this.emit('notification', {
        severity: 'success',
        message: `Station ${data.station.stationId} created`
      });
      this.emit('station:created', data);
    });

    this.socket.on('station:started', (data) => {
      this.emit('station:started', data);
    });

    this.socket.on('station:stopped', (data) => {
      this.emit('station:stopped', data);
    });

    // Charging events
    this.socket.on('charging:started', (data) => {
      this.emit('charging:started', data);
    });

    this.socket.on('charging:stopped', (data) => {
      const energyText = data.transaction.energyDelivered 
        ? ` - ${data.transaction.energyDelivered.toFixed(2)} kWh delivered`
        : '';
      
      this.emit('notification', {
        severity: 'info',
        message: `Charging stopped on ${data.stationId}:${data.connectorId}${energyText}`
      });
      this.emit('charging:stopped', data);
    });

    // Real-time data
    this.socket.on('meter:values', (data) => {
      this.emit('meter:values', data);
    });

    // Error events
    this.socket.on('station:error', (data) => {
      this.emit('notification', {
        severity: 'error',
        message: `Station ${data.stationId}: ${data.error}`
      });
      this.emit('station:error', data);
    });

    // Dashboard events
    this.socket.on('dashboard:summary', (data) => {
      this.emit('dashboard:summary', data);
    });
  }

  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(() => {
      console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.socket?.connect();
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionStatus = 'disconnected';
  }

  // Event handling
  on(eventName, handler) {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    this.eventHandlers.get(eventName).add(handler);

    return () => {
      const handlers = this.eventHandlers.get(eventName);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  emit(eventName, data) {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventName}:`, error);
        }
      });
    }
  }

  // Server communication
  subscribeToStation(stationId) {
    if (this.socket?.connected) {
      this.socket.emit('subscribe:station', { stationId });
    }
  }

  sendStationCommand(stationId, command, params = {}) {
    if (this.socket?.connected) {
      this.socket.emit('station:command', { stationId, command, params });
    }
  }

  // Utility methods
  getConnectionStatus() {
    return this.connectionStatus;
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export default SimulatorSocket;
