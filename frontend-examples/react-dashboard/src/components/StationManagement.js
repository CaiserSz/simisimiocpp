import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  LinearProgress,
  Tooltip,
  Alert,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Delete,
  Add,
  MoreVert,
  EvStation,
  FlashOn,
  SwapHoriz,
  Refresh,
  Settings,
  Cable,
  BatteryChargingFull
} from '@mui/icons-material';

const StationManagement = ({ socket }) => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedStation, setSelectedStation] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profiles, setProfiles] = useState({});
  const [scenarios, setScenarios] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuStation, setMenuStation] = useState(null);

  // New station form
  const [newStation, setNewStation] = useState({
    vendor: 'TestVendor',
    model: 'TestModel',
    ocppVersion: '1.6J',
    connectorCount: 2,
    maxPower: 22000,
    csmsUrl: 'ws://localhost:9220'
  });

  const [bulkCreate, setBulkCreate] = useState({
    profileId: '',
    count: 5,
    csmsUrl: 'ws://localhost:9220'
  });

  useEffect(() => {
    fetchStations();
    fetchProfiles();
    fetchScenarios();

    // Real-time updates
    const unsubscribeStationStarted = socket.on('station:started', (data) => {
      updateStationInList(data.stationId, { isOnline: true });
    });

    const unsubscribeStationStopped = socket.on('station:stopped', (data) => {
      updateStationInList(data.stationId, { isOnline: false });
    });

    const unsubscribeStationCreated = socket.on('station:created', () => {
      fetchStations();
    });

    const unsubscribeChargingStarted = socket.on('charging:started', (data) => {
      updateStationConnector(data.stationId, data.connectorId, {
        status: 'Occupied',
        hasActiveTransaction: true
      });
    });

    const unsubscribeChargingStopped = socket.on('charging:stopped', (data) => {
      updateStationConnector(data.stationId, data.connectorId, {
        status: 'Available',
        hasActiveTransaction: false
      });
    });

    const unsubscribeMeterValues = socket.on('meter:values', (data) => {
      updateStationConnector(data.stationId, data.connectorId, {
        currentPower: data.values.power,
        energyDelivered: data.values.energy
      });
    });

    return () => {
      unsubscribeStationStarted();
      unsubscribeStationStopped();
      unsubscribeStationCreated();
      unsubscribeChargingStarted();
      unsubscribeChargingStopped();
      unsubscribeMeterValues();
    };
  }, [socket]);

  const fetchStations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/stations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStations(data.data.stations);
      }
    } catch (error) {
      console.error('Failed to fetch stations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/simulator/profiles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProfiles(data.data.profiles);
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  const fetchScenarios = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/simulator/scenarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setScenarios(data.data.scenarios);
      }
    } catch (error) {
      console.error('Failed to fetch scenarios:', error);
    }
  };

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

  const handleStationAction = async (stationId, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/simulator/stations/${stationId}/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        fetchStations();
      }
    } catch (error) {
      console.error(`Failed to ${action} station:`, error);
    }
  };

  const handleCreateStation = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/simulator/stations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newStation)
      });

      if (response.ok) {
        setCreateDialogOpen(false);
        fetchStations();
        setNewStation({
          vendor: 'TestVendor',
          model: 'TestModel',
          ocppVersion: '1.6J',
          connectorCount: 2,
          maxPower: 22000,
          csmsUrl: 'ws://localhost:9220'
        });
      }
    } catch (error) {
      console.error('Failed to create station:', error);
    }
  };

  const handleBulkCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/simulator/stations/from-profile', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bulkCreate)
      });

      if (response.ok) {
        setProfileDialogOpen(false);
        fetchStations();
      }
    } catch (error) {
      console.error('Failed to create stations from profile:', error);
    }
  };

  const handleDeleteStation = async (stationId) => {
    if (window.confirm('Are you sure you want to delete this station?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/simulator/stations/${stationId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          fetchStations();
        }
      } catch (error) {
        console.error('Failed to delete station:', error);
      }
    }
  };

  const handleConnectorAction = async (stationId, connectorId, action) => {
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let method = 'POST';
      let body = {};

      switch (action) {
        case 'connect_vehicle':
          endpoint = `/api/simulator/stations/${stationId}/connectors/${connectorId}/vehicle/connect`;
          body = {
            vehicleType: 'sedan',
            initialSoC: 30,
            targetSoC: 80
          };
          break;
        case 'start_charging':
          endpoint = `/api/simulator/stations/${stationId}/connectors/${connectorId}/charging/start`;
          body = {
            idTag: `RFID_${Date.now()}`
          };
          break;
        case 'stop_charging':
          endpoint = `/api/simulator/stations/${stationId}/connectors/${connectorId}/charging/stop`;
          break;
        case 'disconnect_vehicle':
          endpoint = `/api/simulator/stations/${stationId}/connectors/${connectorId}/vehicle`;
          method = 'DELETE';
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined
      });

      if (response.ok) {
        fetchStations();
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    }
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

  const getConnectorActions = (connector) => {
    if (!connector.hasVehicle) {
      return [
        { label: 'Connect Vehicle', action: 'connect_vehicle', icon: <Cable /> }
      ];
    }

    const actions = [];
    if (!connector.hasActiveTransaction) {
      actions.push(
        { label: 'Start Charging', action: 'start_charging', icon: <BatteryChargingFull /> }
      );
    } else {
      actions.push(
        { label: 'Stop Charging', action: 'stop_charging', icon: <Stop /> }
      );
    }
    
    actions.push(
      { label: 'Disconnect Vehicle', action: 'disconnect_vehicle', icon: <Cable /> }
    );

    return actions;
  };

  const handleMenuOpen = (event, station) => {
    setAnchorEl(event.currentTarget);
    setMenuStation(station);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuStation(null);
  };

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Station Management
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchStations}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<EvStation />}
            onClick={() => setProfileDialogOpen(true)}
          >
            Bulk Create
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add Station
          </Button>
        </Box>
      </Box>

      {/* Stations Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Station ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Protocol</TableCell>
                <TableCell>Connectors</TableCell>
                <TableCell>Power</TableCell>
                <TableCell>Utilization</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stations
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((station) => (
                  <TableRow key={station.stationId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {station.stationId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {station.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={station.isOnline ? 'Online' : 'Offline'}
                        color={station.isOnline ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={station.protocol}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        {station.connectors.map((connector) => (
                          <Tooltip
                            key={connector.id}
                            title={
                              <div>
                                <div>Connector {connector.id}</div>
                                <div>Status: {connector.status}</div>
                                <div>Power: {(connector.currentPower / 1000).toFixed(1)} kW</div>
                                {connector.energyDelivered > 0 && (
                                  <div>Energy: {connector.energyDelivered.toFixed(2)} kWh</div>
                                )}
                              </div>
                            }
                          >
                            <Chip
                              size="small"
                              label={connector.id}
                              color={getStatusColor(connector.status)}
                              variant={connector.hasActiveTransaction ? 'filled' : 'outlined'}
                            />
                          </Tooltip>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {station.totalPower} / {station.maxPower} kW
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(station.totalPower / station.maxPower) * 100}
                        sx={{ mt: 0.5, height: 4 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Box width="100%" mr={1}>
                          <LinearProgress
                            variant="determinate"
                            value={station.utilizationRate}
                            sx={{ height: 6 }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ minWidth: 35 }}>
                          {station.utilizationRate}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleStationAction(
                            station.stationId, 
                            station.isOnline ? 'stop' : 'start'
                          )}
                          color={station.isOnline ? 'error' : 'success'}
                        >
                          {station.isOnline ? <Stop /> : <PlayArrow />}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, station)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={stations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Station Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          setSelectedStation(menuStation);
          handleMenuClose();
        }}>
          <ListItemIcon><Settings /></ListItemIcon>
          <ListItemText>Configure</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          socket.subscribeToStation(menuStation.stationId);
          handleMenuClose();
        }}>
          <ListItemIcon><FlashOn /></ListItemIcon>
          <ListItemText>Monitor Real-time</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            handleDeleteStation(menuStation.stationId);
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Delete Station</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create Station Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Station</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vendor"
                value={newStation.vendor}
                onChange={(e) => setNewStation(prev => ({ ...prev, vendor: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                value={newStation.model}
                onChange={(e) => setNewStation(prev => ({ ...prev, model: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="OCPP Version"
                value={newStation.ocppVersion}
                onChange={(e) => setNewStation(prev => ({ ...prev, ocppVersion: e.target.value }))}
              >
                <MenuItem value="1.6J">OCPP 1.6J</MenuItem>
                <MenuItem value="2.0.1">OCPP 2.0.1</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Connector Count"
                value={newStation.connectorCount}
                onChange={(e) => setNewStation(prev => ({ ...prev, connectorCount: parseInt(e.target.value) }))}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Power (W)"
                value={newStation.maxPower}
                onChange={(e) => setNewStation(prev => ({ ...prev, maxPower: parseInt(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CSMS URL"
                value={newStation.csmsUrl}
                onChange={(e) => setNewStation(prev => ({ ...prev, csmsUrl: e.target.value }))}
                placeholder="ws://localhost:9220"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateStation} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Stations from Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Station Profile"
                value={bulkCreate.profileId}
                onChange={(e) => setBulkCreate(prev => ({ ...prev, profileId: e.target.value }))}
              >
                {Object.entries(profiles).map(([id, profile]) => (
                  <MenuItem key={id} value={id}>
                    {profile.name} - {profile.maxPower / 1000}kW - {profile.ocppVersion}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Station Count"
                value={bulkCreate.count}
                onChange={(e) => setBulkCreate(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                inputProps={{ min: 1, max: 50 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CSMS URL"
                value={bulkCreate.csmsUrl}
                onChange={(e) => setBulkCreate(prev => ({ ...prev, csmsUrl: e.target.value }))}
              />
            </Grid>
          </Grid>

          {bulkCreate.profileId && profiles[bulkCreate.profileId] && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>{profiles[bulkCreate.profileId].name}</strong><br />
              {profiles[bulkCreate.profileId].description}<br />
              Power: {profiles[bulkCreate.profileId].maxPower / 1000}kW | 
              Connectors: {profiles[bulkCreate.profileId].connectorCount} | 
              Protocol: {profiles[bulkCreate.profileId].ocppVersion}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleBulkCreate} 
            variant="contained" 
            disabled={!bulkCreate.profileId}
          >
            Create {bulkCreate.count} Stations
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Actions FAB */}
      <Box position="fixed" bottom={16} right={16}>
        <Fab 
          color="primary" 
          onClick={() => setCreateDialogOpen(true)}
          sx={{ mr: 1 }}
        >
          <Add />
        </Fab>
      </Box>
    </Box>
  );
};

export default StationManagement;
