require('dotenv').config();
const express = require('express');
const { Server } = require('ws');
const { OCPPServer } = require('ocpp');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB bağlantısı
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/charging-simulator', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// WebSocket sunucusu
const wss = new Server({ port: 8080 });

// OCPP sunucusu
const ocppServer = new OCPPServer({
  protocols: ['ocpp2.0.1'],
  strictMode: false,
  disableOptimization: false
});

// WebSocket bağlantı yönetimi
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    console.log('Received message:', message);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// OCPP olayları
ocppServer.on('connection', (client) => {
  console.log('New OCPP client connected:', client.id);

  client.on('BootNotification', (params, cb) => {
    console.log('BootNotification received:', params);
    cb({
      status: 'Accepted',
      interval: 300,
      currentTime: new Date().toISOString()
    });
  });

  // Diğer OCPP mesajları için olay dinleyicileri buraya eklenecek
});

// API rotaları
app.get('/api/status', (req, res) => {
  res.json({ status: 'Server is running', version: '1.0.0' });
});

// Web sunucusunu başlat
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});
