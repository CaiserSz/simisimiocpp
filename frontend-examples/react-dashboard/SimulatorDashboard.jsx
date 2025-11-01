import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const SimulatorDashboard = ({ token }) => {
  // State management
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [overview, setOverview] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [powerData, setPowerData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  const socketRef = useRef(null);
  const powerChartRef = useRef([]);

  useEffect(() => {
    initializeSocket();
    fetchInitialData();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  const initializeSocket = () => {
    socketRef.current = io('http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    // Connection events
    socket.on('connect', () => {
      setConnectionStatus('connected');
      addNotification('Connected to simulator', 'success');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      addNotification('Disconnected from simulator', 'warning');
    });

    socket.on('error', (error) => {
      addNotification(`Connection error: ${error.message}`, 'error');
    });

    // Simulation events
    socket.on('simulation:started', (data) => {
      addNotification('Simulation started', 'info');
      fetchDashboardOverview();
    });

    socket.on('simulation:stopped', (data) => {
      addNotification('Simulation stopped', 'info');
      fetchDashboardOverview();
    });

    // Station events
    socket.on('station:created', (data) => {
      addNotification(`Station ${data.station.stationId} created`, 'success');
      fetchStations();
    });

    socket.on('station:started', (data) => {
      updateStationInList(data.stationId, { isOnline: true });
      addNotification(`Station ${data.stationId} started`, 'success');
    });

    socket.on('station:stopped', (data) => {
      updateStationInList(data.stationId, { isOnline: false });
      addNotification(`Station ${data.stationId} stopped`, 'info');
    });

    // Charging events
    socket.on('charging:started', (data) => {
      updateStationConnector(data.stationId, data.connectorId, {
        status: 'Occupied',
        hasActiveTransaction: true
      });
      addNotification(`Charging started on ${data.stationId}:${data.connectorId}`, 'success');
    });

    socket.on('charging:stopped', (data) => {
      updateStationConnector(data.stationId, data.connectorId, {
        status: 'Available',
        hasActiveTransaction: false
      });
      addNotification(
        `Charging stopped on ${data.stationId}:${data.connectorId} - ${data.transaction.energyDelivered?.toFixed(2)} kWh`,
        'info'
      );
    });

    // Real-time meter values
    socket.on('meter:values', (data) => {
      updatePowerChart(data);
      updateStationConnector(data.stationId, data.connectorId, {
        currentPower: data.values.power,
        energyDelivered: data.values.energy,
        temperature: data.values.temperature
      });
    });

    // Error events
    socket.on('station:error', (data) => {
      addAlert({
        id: Date.now(),
        severity: 'error',
        message: `Station ${data.stationId}: ${data.error}`,
        timestamp: new Date().toISOString()
      });
    });
  };

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchDashboardOverview(),
        fetchStations(),
        fetchAlerts()
      ]);
    } catch (error) {
      addNotification('Failed to fetch initial data', 'error');
    }
  };

  const fetchDashboardOverview = async () => {
    try {
      const response = await fetch('/api/dashboard/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch overview:', error);
    }
  };

  const fetchStations = async () => {
    try {
      const response = await fetch('/api/dashboard/stations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStations(data.data.stations);
      }
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/dashboard/alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setAlerts(data.data.alerts);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  // Utility functions
  const updateStationInList = (stationId, updates) => {
    setStations(prev => prev.map(station => 
      station.stationId === stationId 
        ? { ...station, ...updates }
        : station
    ));
  };

  const updateStationConnector = (stationId, connectorId, updates) => {
    setStations(prev => prev.map(station => 
      station.stationId === stationId
        ? {
            ...station,
            connectors: station.connectors.map(connector =>
              connector.id === connectorId
                ? { ...connector, ...updates }
                : connector
            )
          }
        : station
    ));
  };

  const updatePowerChart = (data) => {
    if (selectedStation?.stationId === data.stationId) {
      const newPoint = {
        time: new Date(data.timestamp).toLocaleTimeString(),
        power: data.values.power / 1000, // Convert to kW
        connector: data.connectorId
      };

      setPowerData(prev => {
        const updated = [...prev, newPoint];
        // Keep only last 50 points for performance
        return updated.slice(-50);
      });
    }
  };

  const addNotification = (message, severity) => {
    const notification = {
      id: Date.now(),
      message,
      severity,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [notification, ...prev].slice(0, 10));
  };

  const addAlert = (alert) => {
    setAlerts(prev => [alert, ...prev]);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Available': 'success',
      'Occupied': 'warning', 
      'Faulted': 'error',
      'Unavailable': 'default'
    };
    return colors[status] || 'default';
  };

  const subscribeToStation = (stationId) => {
    if (socketRef.current) {
      socketRef.current.emit('subscribe:station', { stationId });
      setSelectedStation(stations.find(s => s.stationId === stationId));
      setPowerData([]); // Clear chart data
    }
  };

  const sendStationCommand = (stationId, command) => {
    if (socketRef.current) {
      socketRef.current.emit('station:command', { stationId, command });
    }
  };

  const startSimulation = async () => {
    try {
      const response = await fetch('/api/simulator/stations/start-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to start simulation');
    } catch (error) {
      addNotification('Failed to start simulation', 'error');
    }
  };

  const stopSimulation = async () => {
    try {
      const response = await fetch('/api/simulator/stations/stop-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to stop simulation');
    } catch (error) {
      addNotification('Failed to stop simulation', 'error');
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          EV Charging Station Simulator
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <Chip 
            label={connectionStatus} 
            color={connectionStatus === 'connected' ? 'success' : 'error'}
            variant="filled"
          />
          <Button 
            variant="contained" 
            onClick={startSimulation}
            color="success"
          >
            Start Simulation
          </Button>
          <Button 
            variant="outlined" 
            onClick={stopSimulation}
            color="error"
          >
            Stop Simulation
          </Button>
        </Box>
      </Box>

      {/* Overview Cards */}
      {overview && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Stations
                </Typography>
                <Typography variant="h4">
                  {overview.stations.total}
                </Typography>
                <Typography variant="body2">
                  {overview.stations.online} online
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Charging
                </Typography>
                <Typography variant="h4">
                  {overview.connectors.active}
                </Typography>
                <Typography variant="body2">
                  {overview.connectors.utilizationRate}% utilization
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Power
                </Typography>
                <Typography variant="h4">
                  {overview.power.totalActivePower} kW
                </Typography>
                <Typography variant="body2">
                  Peak: {overview.power.peakPower} kW
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Energy Delivered
                </Typography>
                <Typography variant="h4">
                  {overview.energy.totalDelivered} kWh
                </Typography>
                <Typography variant="body2">
                  {overview.energy.totalSessions} sessions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* Stations List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Charging Stations
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Station ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Protocol</TableCell>
                      <TableCell>Power</TableCell>
                      <TableCell>Utilization</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stations.map((station) => (
                      <TableRow 
                        key={station.stationId}
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: selectedStation?.stationId === station.stationId ? 'rgba(25, 118, 210, 0.08)' : 'inherit'
                        }}
                        onClick={() => subscribeToStation(station.stationId)}
                      >
                        <TableCell>{station.stationId}</TableCell>
                        <TableCell>
                          <Chip 
                            label={station.isOnline ? 'Online' : 'Offline'} 
                            color={station.isOnline ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{station.protocol}</TableCell>
                        <TableCell>{station.totalPower} kW</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Box width="100%" mr={1}>
                              <LinearProgress 
                                variant="determinate" 
                                value={station.utilizationRate} 
                              />
                            </Box>
                            <Typography variant="body2">
                              {station.utilizationRate}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              sendStationCommand(station.stationId, station.isOnline ? 'stop' : 'start');
                            }}
                          >
                            {station.isOnline ? 'Stop' : 'Start'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Real-time Chart */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Real-time Power
                {selectedStation && ` - ${selectedStation.stationId}`}
              </Typography>
              {powerData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={powerData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="power" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box 
                  height={300} 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center"
                >
                  <Typography color="textSecondary">
                    {selectedStation ? 'Waiting for data...' : 'Select a station to view chart'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Alerts
            </Typography>
            {alerts.slice(0, 5).map((alert) => (
              <Alert 
                key={alert.id} 
                severity={alert.severity} 
                sx={{ mb: 1 }}
              >
                {alert.message}
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Notifications */}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={6000}
          onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
        >
          <Alert severity={notification.severity}>
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </Box>
  );
};

export default SimulatorDashboard;
