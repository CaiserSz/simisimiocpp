import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Chip
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Download, Refresh } from '@mui/icons-material';
import { format, subDays, subHours } from 'date-fns';

const AnalyticsView = ({ socket }) => {
  const [timeRange, setTimeRange] = useState('24h');
  const [metric, setMetric] = useState('power');
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    powerTrends: [],
    utilizationData: [],
    protocolStats: [],
    sessionStats: [],
    performanceMetrics: {}
  });

  useEffect(() => {
    fetchAnalytics();
    
    // Real-time updates for current metrics
    const unsubscribeMeter = socket.on('meter:values', (data) => {
      updateRealTimeMetrics(data);
    });

    return () => {
      unsubscribeMeter();
    };
  }, [timeRange, metric, socket]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch multiple analytics endpoints
      const [metricsResponse, overviewResponse] = await Promise.all([
        fetch(`/api/dashboard/metrics?metric=${metric}&duration=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/dashboard/overview', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const metricsData = await metricsResponse.json();
      const overviewData = await overviewResponse.json();

      if (metricsData.success && overviewData.success) {
        // Generate mock analytics data based on current state
        const overview = overviewData.data;
        generateAnalyticsData(overview, metricsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalyticsData = (overview, metricsData) => {
    // Generate time-series data for the selected time range
    const timePoints = generateTimePoints(timeRange);
    
    const powerTrends = timePoints.map((time, index) => ({
      time: format(time, 'HH:mm'),
      totalPower: Math.random() * overview.power.totalActivePower + (overview.power.totalActivePower * 0.3),
      averagePower: Math.random() * overview.power.averagePowerPerStation + (overview.power.averagePowerPerStation * 0.3),
      peakPower: Math.random() * overview.power.peakPower + (overview.power.peakPower * 0.5)
    }));

    const utilizationData = timePoints.map((time, index) => ({
      time: format(time, 'HH:mm'),
      utilization: Math.random() * 30 + (overview.connectors.utilizationRate || 0),
      activeConnectors: Math.floor(Math.random() * overview.connectors.active + (overview.connectors.active * 0.5))
    }));

    const protocolStats = [
      { 
        name: 'OCPP 1.6J', 
        value: overview.stations.byProtocol['OCPP 1.6J'] || 0,
        sessions: Math.floor(Math.random() * 100),
        avgDuration: Math.floor(Math.random() * 120 + 30),
        color: '#8884d8'
      },
      { 
        name: 'OCPP 2.0.1', 
        value: overview.stations.byProtocol['OCPP 2.0.1'] || 0,
        sessions: Math.floor(Math.random() * 80),
        avgDuration: Math.floor(Math.random() * 100 + 40),
        color: '#82ca9d'
      }
    ];

    const sessionStats = timePoints.slice(-7).map((time, index) => ({
      date: format(time, 'MMM dd'),
      sessions: Math.floor(Math.random() * 50 + 10),
      energy: Math.random() * 500 + 100,
      revenue: Math.random() * 200 + 50
    }));

    const performanceMetrics = {
      avgResponseTime: Math.floor(Math.random() * 100 + 50),
      successRate: 99.5 + Math.random() * 0.5,
      errorRate: Math.random() * 0.5,
      uptime: 99.8 + Math.random() * 0.2,
      throughput: Math.floor(Math.random() * 500 + 200)
    };

    setAnalyticsData({
      powerTrends,
      utilizationData,
      protocolStats,
      sessionStats,
      performanceMetrics
    });
  };

  const generateTimePoints = (range) => {
    const now = new Date();
    const points = [];
    
    switch (range) {
      case '1h':
        for (let i = 60; i >= 0; i -= 5) {
          points.push(subHours(now, i / 60));
        }
        break;
      case '6h':
        for (let i = 360; i >= 0; i -= 30) {
          points.push(subHours(now, i / 60));
        }
        break;
      case '24h':
        for (let i = 24; i >= 0; i -= 2) {
          points.push(subHours(now, i));
        }
        break;
      case '7d':
        for (let i = 7; i >= 0; i--) {
          points.push(subDays(now, i));
        }
        break;
      default:
        points.push(now);
    }
    
    return points;
  };

  const updateRealTimeMetrics = (data) => {
    // Update real-time data points
    setAnalyticsData(prev => ({
      ...prev,
      powerTrends: [...prev.powerTrends.slice(-19), {
        time: format(new Date(), 'HH:mm:ss'),
        totalPower: data.values.power / 1000,
        averagePower: data.values.power / 1000,
        peakPower: data.values.power / 1000
      }]
    }));
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/dashboard/export?format=csv&timeRange=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  return (
    <Box>
      {/* Header Controls */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Analytics & Insights
        </Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="6h">Last 6 Hours</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Metric</InputLabel>
            <Select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              label="Metric"
            >
              <MenuItem value="power">Power</MenuItem>
              <MenuItem value="energy">Energy</MenuItem>
              <MenuItem value="utilization">Utilization</MenuItem>
              <MenuItem value="sessions">Sessions</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchAnalytics}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Power Trends */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Power Consumption Trends
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analyticsData.powerTrends}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="totalPower"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    name="Total Power (kW)"
                  />
                  <Area
                    type="monotone"
                    dataKey="averagePower"
                    stroke="#82ca9d"
                    fillOpacity={1}
                    fill="url(#colorAverage)"
                    name="Average Power (kW)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Protocol Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Protocol Usage
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.protocolStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analyticsData.protocolStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <Box mt={2}>
                {analyticsData.protocolStats.map((protocol, index) => (
                  <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Chip
                      label={protocol.name}
                      size="small"
                      sx={{ bgcolor: protocol.color, color: 'white' }}
                    />
                    <Typography variant="body2">
                      {protocol.sessions} sessions
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Utilization Trends */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Station Utilization
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.utilizationData}>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="utilization"
                    stroke="#ff7300"
                    strokeWidth={2}
                    name="Utilization %"
                  />
                  <Line
                    type="monotone"
                    dataKey="activeConnectors"
                    stroke="#8dd1e1"
                    strokeWidth={2}
                    name="Active Connectors"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Session Statistics */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Daily Session Statistics
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.sessionStats}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sessions" fill="#8884d8" name="Sessions" />
                  <Bar dataKey="energy" fill="#82ca9d" name="Energy (kWh)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Performance Metrics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {analyticsData.performanceMetrics.avgResponseTime}ms
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Response Time
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {analyticsData.performanceMetrics.successRate?.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">
                      {analyticsData.performanceMetrics.errorRate?.toFixed(2)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Error Rate
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {analyticsData.performanceMetrics.uptime?.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Uptime
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={2.4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">
                      {analyticsData.performanceMetrics.throughput}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Requests/min
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsView;
