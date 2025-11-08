/**
 * Swagger Setup
 * OpenAPI documentation setup
 * 
 * Created: 2025-01-11
 * Purpose: Initialize Swagger UI
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import swaggerConfig from '../../swagger.config.js';
import logger from '../utils/logger.js';

export async function swaggerSetup(app) {
  try {
    const specs = swaggerJsdoc(swaggerConfig);
    
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'EV Simulator API Docs',
    }));
    
    // Serve OpenAPI JSON
    app.get('/api/docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    });
    
    logger.info('📚 Swagger documentation available at /api/docs');
    return true;
  } catch (error) {
    logger.warn('Swagger setup failed:', error.message);
    return false;
  }
}

export default swaggerSetup;
