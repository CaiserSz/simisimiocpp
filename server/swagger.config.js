/**
 * Swagger/OpenAPI Configuration
 * API documentation configuration
 * 
 * Created: 2025-01-11
 * Purpose: OpenAPI documentation generation
 */

export default {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EV Charging Station Simulator API',
      version: '1.0.0',
      description: 'Enterprise-grade OCPP simulator REST API for managing charging station simulations',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Station: {
          type: 'object',
          properties: {
            stationId: {
              type: 'string',
              description: 'Unique station identifier',
              example: 'STATION_001',
            },
            vendor: {
              type: 'string',
              description: 'Station vendor name',
              example: 'TestVendor',
            },
            model: {
              type: 'string',
              description: 'Station model',
              example: 'TestModel',
            },
            ocppVersion: {
              type: 'string',
              enum: ['1.6J', '2.0.1'],
              description: 'OCPP protocol version',
              example: '1.6J',
            },
            connectorCount: {
              type: 'integer',
              description: 'Number of connectors',
              example: 2,
            },
            maxPower: {
              type: 'number',
              description: 'Maximum power in Watts',
              example: 22000,
            },
            csmsUrl: {
              type: 'string',
              description: 'CSMS WebSocket URL',
              example: 'ws://localhost:9220',
            },
          },
          required: ['stationId', 'ocppVersion'],
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Error message',
                },
                code: {
                  type: 'string',
                  example: 'ERROR_CODE',
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

