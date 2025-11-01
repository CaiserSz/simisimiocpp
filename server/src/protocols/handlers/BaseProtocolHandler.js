/**
 * Base Protocol Handler Interface
 * All protocol handlers must implement these methods
 */
class BaseProtocolHandler {
  constructor(options = {}) {
    this.options = options;
    this.connected = false;
    this.callbacks = new Map();
  }

  /**
   * Connect to the charging station
   * @param {object} params - Connection parameters
   * @returns {Promise<boolean>} Connection status
   */
  async connect(params) {
    throw new Error('connect() method must be implemented');
  }

  /**
   * Disconnect from the charging station
   * @returns {Promise<boolean>} Disconnection status
   */
  async disconnect() {
    throw new Error('disconnect() method must be implemented');
  }

  /**
   * Send a command to the charging station
   * @param {string} command - Command name
   * @param {object} params - Command parameters
   * @returns {Promise<object>} Command response
   */
  async sendCommand(command, params = {}) {
    throw new Error('sendCommand() method must be implemented');
  }

  /**
   * Register a callback for specific message types
   * @param {string} messageType - Message type to listen for
   * @param {Function} callback - Callback function
   */
  on(messageType, callback) {
    if (!this.callbacks.has(messageType)) {
      this.callbacks.set(messageType, []);
    }
    this.callbacks.get(messageType).push(callback);
    return this;
  }

  /**
   * Emit an event to all registered callbacks
   * @param {string} messageType - Message type
   * @param {*} data - Data to pass to callbacks
   */
  emit(messageType, data) {
    const callbacks = this.callbacks.get(messageType) || [];
    callbacks.forEach(callback => callback(data));
  }

  /**
   * Handle incoming message
   * @param {object} message - Incoming message
   */
  handleMessage(message) {
    // Default implementation - should be overridden by specific protocol handlers
    this.emit('message', message);
  }
}

module.exports = BaseProtocolHandler;
