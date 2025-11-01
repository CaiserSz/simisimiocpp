import React from 'react';
import { styled } from '@mui/material/styles';
import { 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent,
  Divider,
  Box
} from '@mui/material';
import {
  EvStation as EvStationIcon,
  FlashOn as FlashIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon
} from '@mui/icons-material';

const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
  textAlign: 'center',
}));

const StatIcon = styled('div')(({ theme }) => ({
  fontSize: 50,
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main,
}));

const StatValue = styled(Typography)(({ theme }) => ({
  fontSize: '2.5rem',
  fontWeight: 'bold',
  margin: theme.spacing(1, 0),
}));

const StatLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

const StatCardComponent = ({ icon: Icon, title, value, color = 'primary' }) => {
  return (
    <StatCard>
      <CardContent>
        <StatIcon>
          <Icon fontSize="inherit" color={color} />
        </StatIcon>
        <StatValue variant="h4">
          {value}
        </StatValue>
        <StatLabel variant="subtitle1">
          {title}
        </StatLabel>
      </CardContent>
    </StatCard>
  );
};

const Dashboard = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Genel Bakış
      </Typography>
      <Divider sx={{ marginBottom: 4 }} />
      
      <Grid container spacing={3}>
        {[
          { id: 1, title: 'Aktif İstasyonlar', value: '12', icon: EvStationIcon, color: '#4caf50' },
          { id: 2, title: 'Toplam Enerji (kWh)', value: '1,245', icon: FlashIcon, color: '#ff9800' },
          { id: 3, title: 'Ortalama Güç (kW)', value: '22.5', icon: SpeedIcon, color: '#2196f3' },
          { id: 4, title: 'Ortalama Süre (dk)', value: '45', icon: TimerIcon, color: '#9c27b0' },
        ].map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.id}>
            <StatCardComponent 
              icon={stat.icon} 
              title={stat.title} 
              value={stat.value}
              color={stat.color}
            />
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Son Etkinlikler
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Typography>Şarj başlatıldı - İstasyon #3 - 10:23:45</Typography>
          <Typography>Yeni istasyon bağlandı - 10:15:22</Typography>
          <Typography>Şarj tamamlandı - İstasyon #7 - 09:45:12</Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
