import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Paper
} from '@mui/material';
import {
  EvStation,
  FlashOn,
  Speed,
  TrendingUp,
  Refresh,
  PlayArrow,
  Stop,
  Settings
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';

const DashboardOverview = ({ socket }) => {
  const [overview, setOverview] = useState(null);
  const [realtimeData, setRealtimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulationRunning, setSimulationRunning] = useState(false);

  useEffect(() => {
    fetchOverview();
    
    // Setup real-time updates
    const unsubscribe = socket.on('dashboard:summary', (data) => {
      setOverview(prev => ({ ...prev, ...data }));
    });

    const unsubscribeMeter = socket.on('meter:values', (data) => {
      setRealtimeData(prev => {
        const newData = [...prev, {
          time: format(new Date(), 'HH:mm:ss'),
          power: data.values.power / 1000, // Convert to kW
          energy: data.values.energy,
          timestamp: data.timestamp
        }].slice(-20); // Keep last 20 points
        return newData;
      });
    });

    const unsubscribeSimulation = socket.on('simulation:started', () => {
      setSimulationRunning(true);
      fetchOverview();
    });

    const unsubscribeSimulationStop = socket.on('simulation:stopped', () => {
      setSimulationRunning(false);
      fetchOverview();
    });

    return () => {
      unsubscribe();
      unsubscribeMeter();
      unsubscribeSimulation();
      unsubscribeSimulationStop();
    };
  }, [socket]);

  const fetchOverview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setOverview(data.data);
        setSimulationRunning(data.data.simulation?.isRunning || false);
      }
    } catch (error) {
      console.error('Failed to fetch overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulationToggle = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = simulationRunning ? 'stop-all' : 'start-all';
      
      const response = await fetch(`/api/simulator/stations/${endpoint}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setSimulationRunning(!simulationRunning);
        setTimeout(fetchOverview, 1000); // Refresh after 1 second
      }
    } catch (error) {
      console.error('Failed to toggle simulation:', error);
    }
  };

  const MetricCard = ({ title, value, subtitle, icon, color = 'primary', progress }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ mb: 1 }}>
              {loading ? '...' : value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
            {progress !== undefined && (
              <Box mt={2}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {progress.toFixed(1)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const pieData = overview ? [
    { name: 'OCPP 1.6J', value: overview.stations.byProtocol['OCPP 1.6J'], color: '#8884d8' },
    { name: 'OCPP 2.0.1', value: overview.stations.byProtocol['OCPP 2.0.1'], color: '#82ca9d' }
  ] : [];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Simulator Overview
        </Typography>
        <Box display="flex" gap={2}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchOverview}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={simulationRunning ? <Stop /> : <PlayArrow />}
            onClick={handleSimulationToggle}
            color={simulationRunning ? 'error' : 'success'}
          >
            {simulationRunning ? 'Stop Simulation' : 'Start Simulation'}
          </Button>
        </Box>
      </Box>

      {/* Status Banner */}
      {overview && (
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: simulationRunning ? 'success.light' : 'warning.light',
            color: simulationRunning ? 'success.contrastText' : 'warning.contrastText'
          }}
        >
          <Typography variant="h6">
            Simulation Status: {simulationRunning ? 'RUNNING' : 'STOPPED'}
            {simulationRunning && overview.simulation.uptime && (
              <Typography component="span" sx={{ ml: 2, opacity: 0.8 }}>
                Uptime: {Math.floor(overview.simulation.uptime / 60)}m {Math.floor(overview.simulation.uptime % 60)}s
              </Typography>
            )}
          </Typography>
        </Paper>
      )}

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Stations"
            value={overview?.stations.total || 0}
            subtitle={`${overview?.stations.online || 0} online`}
            icon={<EvStation fontSize="large" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Charging"
            value={overview?.connectors.active || 0}
            subtitle={`${overview?.connectors.available || 0} available`}
            icon={<FlashOn fontSize="large" />}
            color="warning"
            progress={overview?.connectors.utilizationRate || 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Power"
            value={`${overview?.power.totalActivePower || 0} kW`}
            subtitle={`Peak: ${overview?.power.peakPower || 0} kW`}
            icon={<Speed fontSize="large" />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Energy Delivered"
            value={`${overview?.energy.totalDelivered || 0} kWh`}
            subtitle={`${overview?.energy.totalSessions || 0} sessions`}
            icon={<TrendingUp fontSize="large" />}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Real-time Power Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Real-time Power Consumption
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={realtimeData}>
                  <defs>
                    <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="power"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorPower)"
                    name="Power (kW)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Protocol Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Protocol Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Station Status Summary */}
      {overview && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Station Status Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {overview.stations.byStatus.available || 0}
                  </Typography>
                  <Typography color="text.secondary">Available</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="warning.main">
                    {overview.stations.byStatus.occupied || 0}
                  </Typography>
                  <Typography color="text.secondary">Occupied</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="error.main">
                    {overview.stations.byStatus.faulted || 0}
                  </Typography>
                  <Typography color="text.secondary">Faulted</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box textAlign="center">
                  <Typography variant="h4" color="text.secondary">
                    {overview.stations.byStatus.unavailable || 0}
                  </Typography>
                  <Typography color="text.secondary">Unavailable</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DashboardOverview;
