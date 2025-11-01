import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Grid, 
  TextField, 
  Button, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Box,
  Tabs,
  Tab,
  styled
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { Save as SaveIcon, Restore as RestoreIcon } from '@mui/icons-material';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  minWidth: 200,
  marginRight: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const ActionButtons = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  '& > *': {
    marginRight: theme.spacing(2),
  },
}));

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index) => ({
  id: `config-tab-${index}`,
  'aria-controls': `config-tabpanel-${index}`,
});

const Configuration = () => {
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  
  // Yapılandırma durumları
  const [generalConfig, setGeneralConfig] = useState({
    systemName: 'AC Şarj İstasyonu Simülatörü',
    timezone: 'Europe/Istanbul',
    language: 'tr',
    enableLogging: true,
    logRetentionDays: 30,
  });
  
  const [ocppConfig, setOcppConfig] = useState({
    ocppVersion: '2.0.1',
    heartbeatInterval: 300,
    bootNotificationRetryInterval: 60,
    allowOfflineTransactions: false,
    localAuthListEnabled: true,
  });
  
  const [networkConfig, setNetworkConfig] = useState({
    serverPort: 8080,
    webSocketPingInterval: 30,
    webSocketTimeout: 30,
    maxConnections: 100,
  });
  
  const [securityConfig, setSecurityConfig] = useState({
    useTLS: true,
    requireAuth: true,
    authType: 'basic', // basic, oauth, certificate
    apiKey: '',
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleGeneralChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGeneralConfig({
      ...generalConfig,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleOcppChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOcppConfig({
      ...ocppConfig,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleNetworkChange = (e) => {
    const { name, value } = e.target;
    setNetworkConfig({
      ...networkConfig,
      [name]: value,
    });
  };

  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecurityConfig({
      ...securityConfig,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSave = () => {
    // Burada API'ye kaydetme işlemi yapılacak
    console.log('Saving configuration:', {
      general: generalConfig,
      ocpp: ocppConfig,
      network: networkConfig,
      security: securityConfig,
    });
    
    setSnackbar({
      open: true,
      message: 'Ayarlar başarıyla kaydedildi.',
      severity: 'success',
    });
  };

  const handleReset = () => {
    // Varsayılan ayarlara dön
    setGeneralConfig({
      systemName: 'AC Şarj İstasyonu Simülatörü',
      timezone: 'Europe/Istanbul',
      language: 'tr',
      enableLogging: true,
      logRetentionDays: 30,
    });
    
    setOcppConfig({
      ocppVersion: '2.0.1',
      heartbeatInterval: 300,
      bootNotificationRetryInterval: 60,
      allowOfflineTransactions: false,
      localAuthListEnabled: true,
    });
    
    setNetworkConfig({
      serverPort: 8080,
      webSocketPingInterval: 30,
      webSocketTimeout: 30,
      maxConnections: 100,
    });
    
    setSnackbar({
      open: true,
      message: 'Varsayılan ayarlara dönüldü.',
      severity: 'info',
    });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sistem Yapılandırması
      </Typography>
      
      <StyledPaper>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="yapılandırma sekmeleri"
        >
          <Tab label="Genel" {...a11yProps(0)} />
          <Tab label="OCPP" {...a11yProps(1)} />
          <Tab label="Ağ" {...a11yProps(2)} />
          <Tab label="Güvenlik" {...a11yProps(3)} />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <SectionTitle variant="h6">
            Genel Ayarlar
          </SectionTitle>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sistem Adı"
                name="systemName"
                value={generalConfig.systemName}
                onChange={handleGeneralChange}
                variant="outlined"
                margin="normal"
                sx={{ mb: 2 }}
              />
              
              <StyledFormControl variant="outlined" fullWidth>
                <InputLabel>Zaman Dilimi</InputLabel>
                <Select
                  name="timezone"
                  value={generalConfig.timezone}
                  onChange={handleGeneralChange}
                  label="Zaman Dilimi"
                >
                  <MenuItem value="Europe/Istanbul">İstanbul (UTC+3)</MenuItem>
                  <MenuItem value="Europe/London">Londra (UTC+0)</MenuItem>
                  <MenuItem value="Europe/Berlin">Berlin (UTC+1)</MenuItem>
                  <MenuItem value="America/New_York">New York (UTC-5)</MenuItem>
                  <MenuItem value="Asia/Tokyo">Tokyo (UTC+9)</MenuItem>
                </Select>
              </StyledFormControl>
              
              <StyledFormControl variant="outlined" fullWidth>
                <InputLabel>Dil</InputLabel>
                <Select
                  name="language"
                  value={generalConfig.language}
                  onChange={handleGeneralChange}
                  label="Dil"
                >
                  <MenuItem value="tr">Türkçe</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                </Select>
              </StyledFormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={generalConfig.enableLogging}
                    onChange={handleGeneralChange}
                    name="enableLogging"
                    color="primary"
                  />
                }
                label="Sistem Kayıtlarını Aktif Et"
              />
              
              {generalConfig.enableLogging && (
                <TextField
                  fullWidth
                  label="Kayıt Tutma Süresi (gün)"
                  name="logRetentionDays"
                  type="number"
                  value={generalConfig.logRetentionDays}
                  onChange={handleGeneralChange}
                  variant="outlined"
                  margin="normal"
                  inputProps={{ min: 1, max: 365 }}
                />
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <SectionTitle variant="h6">
            OCPP Ayarları
          </SectionTitle>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StyledFormControl variant="outlined" fullWidth>
                <InputLabel>OCPP Sürümü</InputLabel>
                <Select
                  name="ocppVersion"
                  value={ocppConfig.ocppVersion}
                  onChange={handleOcppChange}
                  label="OCPP Sürümü"
                >
                  <MenuItem value="1.6">OCPP 1.6</MenuItem>
                  <MenuItem value="2.0">OCPP 2.0</MenuItem>
                  <MenuItem value="2.0.1">OCPP 2.0.1</MenuItem>
                </Select>
              </StyledFormControl>
              
              <TextField
                fullWidth
                label="Kalp Atışı Aralığı (saniye)"
                name="heartbeatInterval"
                type="number"
                value={ocppConfig.heartbeatInterval}
                onChange={handleOcppChange}
                variant="outlined"
                margin="normal"
                inputProps={{ min: 30, max: 86400 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={ocppConfig.allowOfflineTransactions}
                    onChange={handleOcppChange}
                    name="allowOfflineTransactions"
                    color="primary"
                  />
                }
                label="Çevrimdışı İşlemlere İzin Ver"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Önyükleme Bildirimi Tekrar Aralığı (saniye)"
                name="bootNotificationRetryInterval"
                type="number"
                value={ocppConfig.bootNotificationRetryInterval}
                onChange={handleOcppChange}
                variant="outlined"
                margin="normal"
                inputProps={{ min: 10, max: 600 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={ocppConfig.localAuthListEnabled}
                    onChange={handleOcppChange}
                    name="localAuthListEnabled"
                    color="primary"
                  />
                }
                label="Yerel Yetkilendirme Listesini Etkinleştir"
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <SectionTitle variant="h6">
            Ağ Ayarları
          </SectionTitle>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Sunucu Portu"
                name="serverPort"
                type="number"
                value={networkConfig.serverPort}
                onChange={handleNetworkChange}
                variant="outlined"
                margin="normal"
                inputProps={{ min: 1, max: 65535 }}
              />
              
              <TextField
                fullWidth
                label="Maksimum Bağlantı Sayısı"
                name="maxConnections"
                type="number"
                value={networkConfig.maxConnections}
                onChange={handleNetworkChange}
                variant="outlined"
                margin="normal"
                inputProps={{ min: 1, max: 10000 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="WebSocket Ping Aralığı (saniye)"
                name="webSocketPingInterval"
                type="number"
                value={networkConfig.webSocketPingInterval}
                onChange={handleNetworkChange}
                variant="outlined"
                margin="normal"
                inputProps={{ min: 5, max: 300 }}
              />
              
              <TextField
                fullWidth
                label="WebSocket Zaman Aşımı (saniye)"
                name="webSocketTimeout"
                type="number"
                value={networkConfig.webSocketTimeout}
                onChange={handleNetworkChange}
                variant="outlined"
                margin="normal"
                inputProps={{ min: 10, max: 600 }}
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <SectionTitle variant="h6">
            Güvenlik Ayarları
          </SectionTitle>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={securityConfig.useTLS}
                    onChange={handleSecurityChange}
                    name="useTLS"
                    color="primary"
                  />
                }
                label="TLS/SSL Kullan"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={securityConfig.requireAuth}
                    onChange={handleSecurityChange}
                    name="requireAuth"
                    color="primary"
                  />
                }
                label="Kimlik Doğrulama Gerekli"
              />
              
              {securityConfig.requireAuth && (
                <StyledFormControl variant="outlined" fullWidth>
                  <InputLabel>Kimlik Doğrulama Türü</InputLabel>
                  <Select
                    name="authType"
                    value={securityConfig.authType}
                    onChange={handleSecurityChange}
                    label="Kimlik Doğrulama Türü"
                  >
                    <MenuItem value="none">Yok</MenuItem>
                    <MenuItem value="basic">Temel Kimlik Doğrulama</MenuItem>
                    <MenuItem value="jwt">JWT</MenuItem>
                    <MenuItem value="oauth2">OAuth 2.0</MenuItem>
                  </Select>
                </StyledFormControl>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              {securityConfig.requireAuth && (
                <>
                  <TextField
                    fullWidth
                    label="API Anahtarı"
                    name="apiKey"
                    type="password"
                    value={securityConfig.apiKey}
                    onChange={handleSecurityChange}
                    variant="outlined"
                    margin="normal"
                    placeholder="Mevcut anahtarı değiştirmek için yazın"
                  />
                  
                  <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={() => {
                      // Rastgele bir API anahtarı oluştur
                      const randomKey = Array(32).fill(0).map(() => 
                        Math.random().toString(36).charAt(2)
                      ).join('');
                      
                      setSecurityConfig({
                        ...securityConfig,
                        apiKey: randomKey,
                      });
                      
                      setSnackbar({
                        open: true,
                        message: 'Yeni API anahtarı oluşturuldu.',
                        severity: 'info',
                      });
                    }}
                  >
                    Rastgele Anahtar Oluştur
                  </Button>
                </>
              )}
            </Grid>
          </Grid>
        </TabPanel>
        
        <Divider sx={{ my: 2 }} />
        
        <ActionButtons>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Kaydet
          </Button>
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RestoreIcon />}
            onClick={handleReset}
          >
            Varsayılanlara Dön
          </Button>
        </ActionButtons>
      </StyledPaper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Configuration;
