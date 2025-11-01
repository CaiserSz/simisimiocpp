import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import {
  Save,
  Refresh,
  Delete,
  Add,
  Security,
  Settings,
  Analytics,
  Notifications
} from '@mui/icons-material';

const SettingsPanel = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState({
    general: {
      simulatorName: 'EV Station Simulator',
      defaultCSMSUrl: 'ws://localhost:9220',
      maxStations: 100,
      autoStart: false,
      enableLogging: true,
      logLevel: 'info'
    },
    security: {
      requireAuthentication: true,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      enableRateLimit: true,
      rateLimitWindow: 15,
      rateLimitMax: 100
    },
    performance: {
      enableClustering: false,
      workerCount: 4,
      memoryLimit: 512,
      enableCaching: true,
      cacheExpiry: 300,
      enableCompression: true
    },
    notifications: {
      enableEmail: false,
      emailHost: '',
      emailPort: 587,
      emailUser: '',
      emailPassword: '',
      enableWebhooks: false,
      webhookUrl: ''
    }
  });
  
  const [saveStatus, setSaveStatus] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');

  useEffect(() => {
    loadSettings();
    loadApiKeys();
  }, []);

  const loadSettings = async () => {
    try {
      // In a real app, this would fetch from the API
      const savedSettings = localStorage.getItem('simulatorSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadApiKeys = async () => {
    try {
      // Mock API keys data
      setApiKeys([
        { id: '1', name: 'Production Dashboard', key: 'sk_live_...', created: '2024-01-15', lastUsed: '2024-01-20' },
        { id: '2', name: 'Development', key: 'sk_test_...', created: '2024-01-10', lastUsed: '2024-01-19' }
      ]);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    }
  };

  const handleSettingChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      // In a real app, this would save to the API
      localStorage.setItem('simulatorSettings', JSON.stringify(settings));
      setSaveStatus({ type: 'success', message: 'Settings saved successfully' });
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Failed to save settings' });
    }
  };

  const handleCreateApiKey = async () => {
    try {
      const newKey = {
        id: Date.now().toString(),
        name: newApiKeyName,
        key: `sk_${Math.random().toString(36).substr(2, 32)}`,
        created: new Date().toISOString().split('T')[0],
        lastUsed: 'Never'
      };
      
      setApiKeys(prev => [...prev, newKey]);
      setShowApiKeyDialog(false);
      setNewApiKeyName('');
      setSaveStatus({ type: 'success', message: 'API key created successfully' });
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Failed to create API key' });
    }
  };

  const handleDeleteApiKey = async (keyId) => {
    if (window.confirm('Are you sure you want to delete this API key?')) {
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      setSaveStatus({ type: 'success', message: 'API key deleted successfully' });
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" mb={3}>
        Settings & Configuration
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<Settings />} label="General" />
            <Tab icon={<Security />} label="Security" />
            <Tab icon={<Analytics />} label="Performance" />
            <Tab icon={<Notifications />} label="Notifications" />
          </Tabs>
        </Box>

        {/* General Settings */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Simulator Name"
                value={settings.general.simulatorName}
                onChange={(e) => handleSettingChange('general', 'simulatorName', e.target.value)}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Default CSMS URL"
                value={settings.general.defaultCSMSUrl}
                onChange={(e) => handleSettingChange('general', 'defaultCSMSUrl', e.target.value)}
                margin="normal"
                placeholder="ws://localhost:9220"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Maximum Stations"
                value={settings.general.maxStations}
                onChange={(e) => handleSettingChange('general', 'maxStations', parseInt(e.target.value))}
                margin="normal"
                inputProps={{ min: 1, max: 1000 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Log Level"
                value={settings.general.logLevel}
                onChange={(e) => handleSettingChange('general', 'logLevel', e.target.value)}
                margin="normal"
                SelectProps={{ native: true }}
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.general.autoStart}
                    onChange={(e) => handleSettingChange('general', 'autoStart', e.target.checked)}
                  />
                }
                label="Auto-start stations on creation"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.general.enableLogging}
                    onChange={(e) => handleSettingChange('general', 'enableLogging', e.target.checked)}
                  />
                }
                label="Enable detailed logging"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Settings */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Session Timeout (hours)"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                margin="normal"
                inputProps={{ min: 1, max: 168 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Login Attempts"
                value={settings.security.maxLoginAttempts}
                onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                margin="normal"
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Rate Limit Window (minutes)"
                value={settings.security.rateLimitWindow}
                onChange={(e) => handleSettingChange('security', 'rateLimitWindow', parseInt(e.target.value))}
                margin="normal"
                inputProps={{ min: 1, max: 60 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Rate Limit Max Requests"
                value={settings.security.rateLimitMax}
                onChange={(e) => handleSettingChange('security', 'rateLimitMax', parseInt(e.target.value))}
                margin="normal"
                inputProps={{ min: 10, max: 1000 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.security.requireAuthentication}
                    onChange={(e) => handleSettingChange('security', 'requireAuthentication', e.target.checked)}
                  />
                }
                label="Require authentication for all API access"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.security.enableRateLimit}
                    onChange={(e) => handleSettingChange('security', 'enableRateLimit', e.target.checked)}
                  />
                }
                label="Enable rate limiting"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">API Keys</Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowApiKeyDialog(true)}
                >
                  Create API Key
                </Button>
              </Box>
              
              <Paper>
                <List>
                  {apiKeys.map((apiKey) => (
                    <ListItem key={apiKey.id} divider>
                      <ListItemText
                        primary={apiKey.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              {apiKey.key}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              Created: {apiKey.created} | Last used: {apiKey.lastUsed}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteApiKey(apiKey.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Performance Settings */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Worker Count"
                value={settings.performance.workerCount}
                onChange={(e) => handleSettingChange('performance', 'workerCount', parseInt(e.target.value))}
                margin="normal"
                inputProps={{ min: 1, max: 16 }}
                helperText="Number of worker processes for clustering"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Memory Limit (MB)"
                value={settings.performance.memoryLimit}
                onChange={(e) => handleSettingChange('performance', 'memoryLimit', parseInt(e.target.value))}
                margin="normal"
                inputProps={{ min: 128, max: 2048 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Cache Expiry (seconds)"
                value={settings.performance.cacheExpiry}
                onChange={(e) => handleSettingChange('performance', 'cacheExpiry', parseInt(e.target.value))}
                margin="normal"
                inputProps={{ min: 60, max: 3600 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.performance.enableClustering}
                    onChange={(e) => handleSettingChange('performance', 'enableClustering', e.target.checked)}
                  />
                }
                label="Enable multi-core clustering"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.performance.enableCaching}
                    onChange={(e) => handleSettingChange('performance', 'enableCaching', e.target.checked)}
                  />
                }
                label="Enable Redis caching"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.performance.enableCompression}
                    onChange={(e) => handleSettingChange('performance', 'enableCompression', e.target.checked)}
                  />
                }
                label="Enable response compression"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Settings */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Email Notifications</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP Host"
                value={settings.notifications.emailHost}
                onChange={(e) => handleSettingChange('notifications', 'emailHost', e.target.value)}
                margin="normal"
                disabled={!settings.notifications.enableEmail}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="SMTP Port"
                value={settings.notifications.emailPort}
                onChange={(e) => handleSettingChange('notifications', 'emailPort', parseInt(e.target.value))}
                margin="normal"
                disabled={!settings.notifications.enableEmail}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SMTP Username"
                value={settings.notifications.emailUser}
                onChange={(e) => handleSettingChange('notifications', 'emailUser', e.target.value)}
                margin="normal"
                disabled={!settings.notifications.enableEmail}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="password"
                label="SMTP Password"
                value={settings.notifications.emailPassword}
                onChange={(e) => handleSettingChange('notifications', 'emailPassword', e.target.value)}
                margin="normal"
                disabled={!settings.notifications.enableEmail}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.enableEmail}
                    onChange={(e) => handleSettingChange('notifications', 'enableEmail', e.target.checked)}
                  />
                }
                label="Enable email notifications"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Webhook Notifications</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Webhook URL"
                value={settings.notifications.webhookUrl}
                onChange={(e) => handleSettingChange('notifications', 'webhookUrl', e.target.value)}
                margin="normal"
                disabled={!settings.notifications.enableWebhooks}
                placeholder="https://your-webhook-endpoint.com/events"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.enableWebhooks}
                    onChange={(e) => handleSettingChange('notifications', 'enableWebhooks', e.target.checked)}
                  />
                }
                label="Enable webhook notifications"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <Divider />
        
        {/* Save Button */}
        <Box p={3} display="flex" justifyContent="flex-end" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadSettings}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveSettings}
          >
            Save Settings
          </Button>
        </Box>
      </Card>

      {/* API Key Creation Dialog */}
      <Dialog open={showApiKeyDialog} onClose={() => setShowApiKeyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create API Key</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="API Key Name"
            value={newApiKeyName}
            onChange={(e) => setNewApiKeyName(e.target.value)}
            margin="normal"
            placeholder="e.g., Production Dashboard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApiKeyDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateApiKey} variant="contained" disabled={!newApiKeyName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Status Snackbar */}
      <Snackbar
        open={!!saveStatus}
        autoHideDuration={6000}
        onClose={() => setSaveStatus(null)}
      >
        <Alert 
          severity={saveStatus?.type || 'info'}
          onClose={() => setSaveStatus(null)}
        >
          {saveStatus?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPanel;
