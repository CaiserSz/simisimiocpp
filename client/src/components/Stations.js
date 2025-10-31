import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  IconButton,
  Chip,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box
} from '@material-ui/core';
import { 
  Add as AddIcon, 
  PowerSettingsNew as PowerIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  table: {
    minWidth: 650,
  },
  statusChip: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionButton: {
    marginRight: theme.spacing(1),
  },
  formControl: {
    minWidth: 200,
    marginRight: theme.spacing(2),
  },
  dialogContent: {
    paddingTop: theme.spacing(2),
  },
}));

const statusMap = {
  available: { label: 'Müsait', color: '#4caf50' },
  charging: { label: 'Şarj Ediyor', color: '#ff9800' },
  faulted: { label: 'Arızalı', color: '#f44336' },
  unavailable: { label: 'Kullanım Dışı', color: '#9e9e9e' },
};

const connectorTypes = [
  'Type 1',
  'Type 2',
  'CCS',
  'CHAdeMO',
  'Tesla',
];

const initialFormState = {
  id: '',
  name: '',
  model: '',
  connectorType: 'Type 2',
  maxPower: 22,
  status: 'available',
};

const Stations = () => {
  const classes = useStyles();
  const [stations, setStations] = useState([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);

  // Örnek veriler
  useEffect(() => {
    // Gerçek uygulamada burada API'den veri çekilecek
    const mockStations = [
      { id: 'CS001', name: 'Ana İstasyon', model: 'ABB Terra 54', connectorType: 'CCS', maxPower: 50, status: 'available', lastSeen: '2 dakika önce' },
      { id: 'CS002', name: 'Yan İstasyon', model: 'ABB Terra 24', connectorType: 'Type 2', maxPower: 22, status: 'charging', lastSeen: '1 dakika önce' },
      { id: 'CS003', name: 'Arka Bahçe', model: 'Siemens VersiCharge', connectorType: 'Type 2', maxPower: 11, status: 'unavailable', lastSeen: '1 saat önce' },
    ];
    setStations(mockStations);
  }, []);

  const handleOpenAddDialog = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setOpen(true);
  };

  const handleOpenEditDialog = (station) => {
    setFormData(station);
    setIsEditing(true);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isEditing) {
      // Güncelleme işlemi
      setStations(stations.map(station => 
        station.id === formData.id ? formData : station
      ));
    } else {
      // Yeni ekleme işlemi
      const newStation = {
        ...formData,
        id: `CS${String(stations.length + 1).padStart(3, '0')}`,
        lastSeen: 'Şimdi',
      };
      setStations([...stations, newStation]);
    }
    
    setOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bu istasyonu silmek istediğinizden emin misiniz?')) {
      setStations(stations.filter(station => station.id !== id));
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setStations(stations.map(station => 
      station.id === id ? { ...station, status: newStatus } : station
    ));
  };

  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <Typography variant="h4">Şarj İstasyonları</Typography>
        <div>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Yeni İstasyon Ekle
          </Button>
        </div>
      </div>

      <TableContainer component={Paper}>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>İsim</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Konnektör Tipi</TableCell>
              <TableCell>Maks. Güç (kW)</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>Son Görülme</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stations.map((station) => (
              <TableRow key={station.id}>
                <TableCell>{station.id}</TableCell>
                <TableCell>{station.name}</TableCell>
                <TableCell>{station.model}</TableCell>
                <TableCell>{station.connectorType}</TableCell>
                <TableCell>{station.maxPower} kW</TableCell>
                <TableCell>
                  <Chip 
                    label={statusMap[station.status]?.label || station.status}
                    style={{ 
                      backgroundColor: statusMap[station.status]?.color || '#9e9e9e',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                    size="small"
                  />
                </TableCell>
                <TableCell>{station.lastSeen}</TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    className={classes.actionButton}
                    onClick={() => handleStatusChange(station.id, 
                      station.status === 'available' ? 'unavailable' : 'available'
                    )}
                  >
                    <PowerIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    className={classes.actionButton}
                    onClick={() => handleOpenEditDialog(station)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="secondary"
                    onClick={() => handleDelete(station.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {isEditing ? 'İstasyonu Düzenle' : 'Yeni İstasyon Ekle'}
          </DialogTitle>
          <DialogContent className={classes.dialogContent}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="İstasyon Adı"
                  fullWidth
                  variant="outlined"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="model"
                  label="Model"
                  fullWidth
                  variant="outlined"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel>Konnektör Tipi</InputLabel>
                  <Select
                    name="connectorType"
                    value={formData.connectorType}
                    onChange={handleInputChange}
                    label="Konnektör Tipi"
                    required
                  >
                    {connectorTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="maxPower"
                  label="Maksimum Güç (kW)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={formData.maxPower}
                  onChange={handleInputChange}
                  inputProps={{ min: 3.7, max: 350, step: 0.1 }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel>Durum</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    label="Durum"
                    required
                  >
                    {Object.entries(statusMap).map(([key, { label }]) => (
                      <MenuItem key={key} value={key}>
                        <Box display="flex" alignItems="center">
                          <Box 
                            width={12} 
                            height={12} 
                            bgcolor={statusMap[key]?.color} 
                            borderRadius="50%"
                            mr={1}
                          />
                          {label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              İptal
            </Button>
            <Button type="submit" color="primary" variant="contained">
              {isEditing ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default Stations;
