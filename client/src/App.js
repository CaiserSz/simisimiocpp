import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Container from '@material-ui/core/Container';
import Box from '@material-ui/core/Box';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import DashboardIcon from '@material-ui/icons/Dashboard';
import PowerIcon from '@material-ui/icons/Power';
import SettingsIcon from '@material-ui/icons/Settings';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles } from '@material-ui/core/styles';
import Dashboard from './components/Dashboard';
import Stations from './components/Stations';
import Configuration from './components/Configuration';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  toolbar: theme.mixins.toolbar,
}));

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  const classes = useStyles();
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className={classes.root}>
          <AppBar position="fixed" className={classes.appBar}>
            <Toolbar>
              <Typography variant="h6" noWrap>
                AC Şarj İstasyonu Simülatörü
              </Typography>
            </Toolbar>
          </AppBar>
          
          <div className={classes.drawer}>
            <div className={classes.toolbar} />
            <Divider />
            <List>
              <ListItem 
                button 
                selected={activeTab === 'dashboard'}
                onClick={() => setActiveTab('dashboard')}
              >
                <ListItemIcon><DashboardIcon /></ListItemIcon>
                <ListItemText primary="Gösterge Paneli" />
              </ListItem>
              <ListItem 
                button 
                selected={activeTab === 'stations'}
                onClick={() => setActiveTab('stations')}
              >
                <ListItemIcon><PowerIcon /></ListItemIcon>
                <ListItemText primary="Şarj İstasyonları" />
              </ListItem>
              <ListItem 
                button 
                selected={activeTab === 'configuration'}
                onClick={() => setActiveTab('configuration')}
              >
                <ListItemIcon><SettingsIcon /></ListItemIcon>
                <ListItemText primary="Yapılandırma" />
              </ListItem>
            </List>
          </div>
          
          <main className={classes.content}>
            <div className={classes.toolbar} />
            <Container maxWidth="lg">
              <Box my={4}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/stations" element={<Stations />} />
                  <Route path="/configuration" element={<Configuration />} />
                </Routes>
              </Box>
            </Container>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
