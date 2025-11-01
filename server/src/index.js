import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { ocppService } from './services/ocpp.service.js';
import logger from './utils/logger.js';
import config from './config/config.js';

// Create Express application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  });
});

// API Routes
app.get('/api/stations', (req, res) => {
  try {
    const stations = ocppService.getConnectedStations();
    res.json(stations);
  } catch (error) {
    logger.error('Error fetching stations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stations/:id/status', (req, res) => {
  try {
    const status = ocppService.getStationStatus(req.params.id);
    res.json({ status });
  } catch (error) {
    logger.error(`Error getting status for station ${req.params.id}:`, error);
    res.status(404).json({ error: 'Station not found' });
  }
});

app.post('/api/stations/:id/start', async (req, res) => {
  try {
    const { connectorId = 1, idTag = 'default' } = req.body;
    const result = await ocppService.sendRemoteStartTransaction(
      req.params.id,
      connectorId,
      idTag
    );
    res.json(result);
  } catch (error) {
    logger.error(`Error starting transaction on station ${req.params.id}:`, error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/stations/:id/stop', async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) {
      return res.status(400).json({ error: 'transactionId is required' });
    }
    
    const result = await ocppService.sendRemoteStopTransaction(
      req.params.id,
      transactionId
    );
    res.json(result);
  } catch (error) {
    logger.error(`Error stopping transaction on station ${req.params.id}:`, error);
    res.status(400).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    await mongoose.connect(config.mongo.uri, config.mongo.options);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start the server
const startServer = async () => {
  try {
    await connectToDatabase();
    
    const server = app.listen(config.port, config.host, () => {
      logger.info(`Server running on http://${config.host}:${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');
      
      try {
        // Close the HTTP server
        await new Promise((resolve) => server.close(resolve));
        
        // Close the OCPP service
        await ocppService.close();
        
        // Close MongoDB connection
        await mongoose.connection.close();
        
        logger.info('Server has been shut down');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle process termination signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
