import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'EV Charging Station Simulator API',
            version: '1.0.0',
            description: 'RESTful API for managing EV charging station simulations with OCPP 1.6J and 2.0.1 support',
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [{
                url: 'http://localhost:3001',
                description: 'Development server'
            },
            {
                url: 'https://api.example.com',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token obtained from /api/auth/login'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'string',
                            example: 'Error message'
                        },
                        details: {
                            type: 'string',
                            example: 'Detailed error information'
                        }
                    }
                },
                Station: {
                    type: 'object',
                    properties: {
                        stationId: {
                            type: 'string',
                            example: 'station-001'
                        },
                        vendor: {
                            type: 'string',
                            example: 'TestVendor'
                        },
                        model: {
                            type: 'string',
                            example: 'SimCharger Pro'
                        },
                        ocppVersion: {
                            type: 'string',
                            enum: ['1.6J', '2.0.1'],
                            example: '2.0.1'
                        },
                        connectorCount: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 10,
                            example: 2
                        },
                        maxPower: {
                            type: 'integer',
                            example: 22000
                        },
                        csmsUrl: {
                            type: 'string',
                            format: 'uri',
                            example: 'ws://localhost:9220'
                        },
                        status: {
                            type: 'string',
                            enum: ['Available', 'Preparing', 'Charging', 'SuspendedEVSE', 'SuspendedEV', 'Finishing', 'Reserved', 'Unavailable', 'Faulted'],
                            example: 'Available'
                        },
                        isOnline: {
                            type: 'boolean',
                            example: true
                        }
                    }
                },
                StationConfig: {
                    type: 'object',
                    required: ['ocppVersion', 'csmsUrl'],
                    properties: {
                        vendor: {
                            type: 'string',
                            example: 'TestVendor'
                        },
                        model: {
                            type: 'string',
                            example: 'SimCharger Pro'
                        },
                        ocppVersion: {
                            type: 'string',
                            enum: ['1.6J', '2.0.1'],
                            example: '2.0.1'
                        },
                        connectorCount: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 10,
                            default: 1,
                            example: 2
                        },
                        maxPower: {
                            type: 'integer',
                            minimum: 1000,
                            example: 22000
                        },
                        csmsUrl: {
                            type: 'string',
                            pattern: '^wss?://.+',
                            example: 'ws://localhost:9220'
                        },
                        heartbeatInterval: {
                            type: 'integer',
                            minimum: 60,
                            maximum: 3600,
                            default: 300,
                            example: 300
                        }
                    }
                },
                Statistics: {
                    type: 'object',
                    properties: {
                        totalStations: {
                            type: 'integer',
                            example: 5
                        },
                        activeStations: {
                            type: 'integer',
                            example: 3
                        },
                        totalConnectors: {
                            type: 'integer',
                            example: 10
                        },
                        activeConnectors: {
                            type: 'integer',
                            example: 4
                        },
                        totalEnergy: {
                            type: 'number',
                            example: 1250.5
                        },
                        totalTransactions: {
                            type: 'integer',
                            example: 150
                        }
                    }
                }
            }
        },
        tags: [{
                name: 'Authentication',
                description: 'User authentication and authorization endpoints'
            },
            {
                name: 'Simulator',
                description: 'Charging station simulation management'
            },
            {
                name: 'Dashboard',
                description: 'Real-time dashboard data endpoints'
            },
            {
                name: 'Health',
                description: 'Health check and system status'
            }
        ]
    },
    apis: [
        './src/routes/**/*.js',
        './src/controllers/**/*.js'
    ]
};

// Note: This file requires swagger-jsdoc and swagger-ui-express packages
// Install with: npm install swagger-jsdoc swagger-ui-express

let swaggerSpec = null;

// Setup Swagger
export const swaggerSetup = async(app) => {
    try {
        if (!swaggerSpec) {
            swaggerSpec = swaggerJsdoc(options);
        }
    } catch (error) {
        console.warn('Swagger setup failed:', error.message);
        return null;
    }

    // Swagger JSON endpoint
    app.get('/api/docs/json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    // Swagger UI
    app.use('/api/docs', swaggerUi.serve);
    app.get('/api/docs', swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'EV Charging Station Simulator API',
        customfavIcon: '/favicon.ico',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
            tryItOutEnabled: true
        }
    }));

    return swaggerSpec;
};

export default swaggerSetup;