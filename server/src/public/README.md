# 🔌 EV Station Simulator Dashboard

## Overview

This is a **Simple Embedded Dashboard** for the EV Station Simulator, providing a visual interface for monitoring and controlling charging stations in real-time.

## Features

### 📊 Real-time Monitoring
- **System Overview**: Total stations, online status, active sessions, power consumption
- **Live Metrics**: Real-time charts with power and session data
- **Station Grid**: Visual station cards with status indicators

### 🎛️ Station Management
- **Quick Creation**: Create new stations with OCPP 1.6J or 2.0.1
- **Bulk Operations**: Start/stop all stations at once
- **Individual Control**: Start, stop, or delete specific stations

### 🌐 Real-time Updates
- **WebSocket Integration**: Live updates without page refresh
- **Connection Status**: Visual indicator for WebSocket connection
- **Toast Notifications**: Success/error feedback for all operations

## Access

1. **Start the server**: `npm start`
2. **Open Dashboard**: Navigate to `http://localhost:3001/dashboard`
3. **Authentication**: Uses existing JWT authentication system

## Technical Details

### Architecture
- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework dependencies)
- **Real-time**: WebSocket communication for live updates
- **Charts**: Chart.js for metrics visualization
- **UI Framework**: Bootstrap 5 for responsive design
- **Icons**: Bootstrap Icons

### API Integration
- **REST API**: Uses existing simulator API endpoints
- **WebSocket**: Real-time updates via WebSocket server
- **Authentication**: JWT token-based authentication

### File Structure
```
server/src/public/
├── index.html          # Main dashboard page
└── README.md           # This documentation
```

## Default Credentials

For testing purposes, use these default credentials:

- **Admin**: `admin@simulator.local` / `admin123`
- **Operator**: `operator@simulator.local` / `operator123`
- **Viewer**: `viewer@simulator.local` / `viewer123`

## Usage Examples

### Creating a Station
1. Fill in the "Quick Station Control" form
2. Set Station ID (e.g., `STATION_001`)
3. Select OCPP version (1.6J or 2.0.1)
4. Click "Create & Start Station"

### Monitoring Stations
- Watch the **System Overview** cards for live statistics
- View the **Station Grid** for individual station status
- Monitor the **Real-time Metrics** chart for power/session trends

### Bulk Operations
- **Start All**: Starts all created stations
- **Stop All**: Stops all running stations
- **Refresh**: Manually refresh station data

## Customization

This is a minimal implementation. For advanced features:

1. **Enhanced UI**: Add more sophisticated charts and layouts
2. **Custom Themes**: Modify CSS for company branding
3. **Additional Metrics**: Add new data points from the simulator
4. **Mobile Optimization**: Enhance responsive design

## Troubleshooting

### Common Issues

1. **Dashboard not loading**: Check if server is running on port 3001
2. **WebSocket connection failed**: Verify WebSocket server is initialized
3. **Authentication required**: Login through `/api/auth/login` first
4. **Stations not appearing**: Check if simulator service is running

### Development

To modify the dashboard:
1. Edit `/server/src/public/index.html`
2. Restart the server to see changes
3. Use browser dev tools for debugging

## Security Notes

- Dashboard inherits server security settings
- Authentication required for all operations
- Role-based access control applied
- WebSocket connections are authenticated

## Performance

- **Lightweight**: Single HTML file, no build process
- **Fast Loading**: Minimal dependencies, CDN resources
- **Real-time**: 5-second update intervals
- **Responsive**: Works on desktop and mobile devices

---

**Ready for demos, development, and production monitoring!** 🚀
