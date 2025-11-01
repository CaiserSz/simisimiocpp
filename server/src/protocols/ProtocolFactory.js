/**
 * OCPP Protocol Factory
 * Handles creation of protocol-specific handlers
 */

import OCPP16JHandler from './handlers/OCPP16JHandler.js';
import OCPP201Handler from './handlers/OCPP201Handler.js';

class ProtocolFactory {
  /**
   * Create a protocol handler based on version
   * @param {string} protocolVersion - OCPP protocol version ('ocpp1.6j' or 'ocpp2.0.1')
   * @param {object} options - Protocol-specific options
   * @returns {IProtocolHandler} Protocol handler instance
   */
  static createHandler(protocolVersion, options = {}) {
    switch (protocolVersion.toLowerCase()) {
      case 'ocpp1.6j':
        return new OCPP16JHandler(options);
      case 'ocpp2.0.1':
        return new OCPP201Handler(options);
      default:
        throw new Error(`Unsupported protocol version: ${protocolVersion}`);
    }
  }

  /**
   * Get supported protocol versions
   * @returns {Array} List of supported protocol versions
   */
  static getSupportedVersions() {
    return [
      { id: 'ocpp1.6j', name: 'OCPP 1.6J' },
      { id: 'ocpp2.0.1', name: 'OCPP 2.0.1' }
    ];
  }
}

export default ProtocolFactory;
