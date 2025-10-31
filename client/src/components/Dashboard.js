import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent,
  Divider
} from '@material-ui/core';
import {
  Power as PowerIcon,
  FlashOn as FlashIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    height: '100%',
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2),
    textAlign: 'center',
  },
  icon: {
    fontSize: 50,
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    margin: theme.spacing(1, 0),
  },
  statLabel: {
    color: theme.palette.text.secondary,
  },
  section: {
    marginBottom: theme.spacing(4),
  },
}));

const StatCard = ({ icon: Icon, title, value, color = 'primary' }) => {
  const classes = useStyles();
  
  return (
    <Card className={classes.card}>
      <Icon className={classes.icon} style={{ color: color }} />
      <CardContent>
        <Typography variant="h3" className={classes.statValue}>
          {value}
        </Typography>
        <Typography variant="subtitle1" className={classes.statLabel}>
          {title}
        </Typography>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const classes = useStyles();
  
  // Örnek veriler
  const stats = [
    { id: 1, title: 'Aktif İstasyonlar', value: '12', icon: PowerIcon, color: '#4caf50' },
    { id: 2, title: 'Toplam Enerji (kWh)', value: '1,245', icon: FlashIcon, color: '#ff9800' },
    { id: 3, title: 'Ortalama Güç (kW)', value: '22.5', icon: SpeedIcon, color: '#2196f3' },
    { id: 4, title: 'Ortalama Süre (dk)', value: '45', icon: TimerIcon, color: '#9c27b0' },
  ];

  return (
    <div className={classes.root}>
      <Typography variant="h4" gutterBottom>
        Genel Bakış
      </Typography>
      
      <Divider className={classes.section} />
      
      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.id}>
            <StatCard 
              icon={stat.icon} 
              title={stat.title} 
              value={stat.value}
              color={stat.color}
            />
          </Grid>
        ))}
      </Grid>
      
      <div className={classes.section}>
        <Typography variant="h5" gutterBottom style={{ marginTop: '2rem' }}>
          Son Etkinlikler
        </Typography>
        <Paper className={classes.paper}>
          <Typography>Şarj başlatıldı - İstasyon #3 - 10:23:45</Typography>
          <Typography>Yeni istasyon bağlandı - 10:15:22</Typography>
          <Typography>Şarj tamamlandı - İstasyon #7 - 09:45:12</Typography>
        </Paper>
      </div>
    </div>
  );
};

export default Dashboard;
