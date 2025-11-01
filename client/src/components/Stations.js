import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { stationAPI } from '../api';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// Ayrı bir bileşen olarak StationRow
const StationRow = React.memo(({ station, onEdit, onDelete, onStart, onStop }) => {
  return (
    <TableRow>
      <TableCell>{station.name}</TableCell>
      <TableCell>{station.model}</TableCell>
      <TableCell>
        <Chip 
          label={station.status} 
          color={
            station.status === 'Available' ? 'success' : 
            station.status === 'Charging' ? 'error' : 'default'
          } 
        />
      </TableCell>
      <TableCell>
        <Chip 
          label={station.connector} 
          variant="outlined" 
          size="small" 
        />
      </TableCell>
      <TableCell>{station.power} kW</TableCell>
      <TableCell>
        <Box display="flex" gap={1}>
          <Tooltip title="Düzenle">
            <IconButton size="small" onClick={() => onEdit(station)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Sil">
            <IconButton size="small" onClick={() => onDelete(station.id)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {station.status === 'Available' ? (
            <Tooltip title="Şarjı Başlat">
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => onStart(station.id)}
              >
                <StartIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Şarjı Durdur">
              <IconButton 
                size="small" 
                color="secondary"
                onClick={() => onStop(station.id)}
              >
                <StopIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
});

const Stations = () => {
  // navigate değişkeni kaldırıldı çünkü kullanılmıyor
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStation, setSelectedStation] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Form doğrulama şeması
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('İstasyon adı zorunludur')
      .min(3, 'En az 3 karakter olmalıdır')
      .max(50, 'En fazla 50 karakter olabilir'),
    model: Yup.string()
      .required('Model adı zorunludur'),
    connector: Yup.string()
      .required('Konnektör tipi seçmelisiniz'),
    power: Yup.number()
      .required('Güç değeri zorunludur')
      .positive('Pozitif bir değer olmalıdır')
      .integer('Tam sayı olmalıdır')
  });

  // Verileri yükle
  const loadStations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await stationAPI.getAll();
      setStations(response.data);
      setError(null);
    } catch (err) {
      console.error('İstasyonlar yüklenirken hata:', err);
      setError('İstasyonlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      // Hata durumunda mock verileri göster
      setStations(mockStations);
    } finally {
      setLoading(false);
    }
  }, []);

  // Formik yapılandırması
  const formik = useFormik({
    initialValues: {
      name: '',
      model: '',
      connector: 'CCS',
      power: ''
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        setIsSubmitting(true);
        if (selectedStation) {
          await stationAPI.updateStation(selectedStation.id, values);
          setSnackbar({ open: true, message: 'İstasyon başarıyla güncellendi', severity: 'success' });
        } else {
          await stationAPI.addStation(values);
          setSnackbar({ open: true, message: 'İstasyon başarıyla eklendi', severity: 'success' });
        }
        await loadStations();
        setOpenDialog(false);
        resetForm();
      } catch (error) {
        console.error('İstasyon kaydedilirken hata oluştu:', error);
        setSnackbar({ 
          open: true, 
          message: error.response?.data?.message || 'Bir hata oluştu', 
          severity: 'error' 
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  // İstasyon düzenleme için formu doldur
  useEffect(() => {
    if (selectedStation) {
      formik.setValues({
        name: selectedStation.name || '',
        model: selectedStation.model || '',
        connector: selectedStation.connector || 'CCS',
        power: selectedStation.power || 22
      });
    } else {
      formik.resetForm();
    }
  }, [selectedStation, formik]);

  // İstasyon düzenle
  const handleEdit = (station) => {
    setSelectedStation(station);
    setOpenDialog(true);
  };

  // Yeni istasyon ekle
  const handleAddNew = () => {
    setSelectedStation(null);
    setOpenDialog(true);
  };

  // İstasyon sil
  const handleDelete = async (id) => {
    if (window.confirm('Bu istasyonu silmek istediğinize emin misiniz?')) {
      try {
        await stationAPI.delete(id);
        setStations(stations.filter(station => station.id !== id));
        showSnackbar('İstasyon başarıyla silindi.', 'success');
      } catch (err) {
        console.error('İstasyon silinirken hata:', err);
        showSnackbar(
          err.response?.data?.message || 'İstasyon silinirken bir hata oluştu.', 
          'error'
        );
      }
    }
  };

  // Şarj başlat
  const handleStartCharging = async (id) => {
    try {
      await stationAPI.startCharging(id);
      updateStationStatus(id, 'Charging');
      showSnackbar('Şarj başlatıldı.', 'success');
    } catch (err) {
      console.error('Şarj başlatılırken hata:', err);
      showSnackbar(
        err.response?.data?.message || 'Şarj başlatılırken bir hata oluştu.', 
        'error'
      );
    }
  };

  // Şarj durdur
  const handleStopCharging = async (id) => {
    try {
      await stationAPI.stopCharging(id);
      updateStationStatus(id, 'Available');
      showSnackbar('Şarj durduruldu.', 'success');
    } catch (err) {
      console.error('Şarj durdurulurken hata:', err);
      showSnackbar(
        err.response?.data?.message || 'Şarj durdurulurken bir hata oluştu.', 
        'error'
      );
    }
  };

  // İstasyon durumunu güncelle
  const updateStationStatus = (id, status) => {
    setStations(stations.map(station => 
      station.id === id ? { ...station, status } : station
    ));
  };

  // Snackbar göster
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Snackbar kapat
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Toplam istasyon sayısı
  const totalStations = useMemo(() => stations.length, [stations]);

  // Aktif şarj sayısı
  const activeCharging = useMemo(
    () => stations.filter(s => s.status === 'Charging').length,
    [stations]
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" component="h1" gutterBottom>
            Şarj İstasyonları
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Toplam {totalStations} istasyon • {activeCharging} aktif şarj
          </Typography>
        </Box>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
            sx={{ mr: 1 }}
          >
            Yeni İstasyon
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadStations}
          >
            Yenile
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>İsim</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>Konnektör</TableCell>
              <TableCell>Güç</TableCell>
              <TableCell align="right">İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stations.map(station => (
              <StationRow
                key={station.id}
                station={station}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStart={handleStartCharging}
                onStop={handleStopCharging}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* İstasyon Düzenleme Diyaloğu */}
      <Dialog 
        open={openDialog} 
        onClose={() => {
          setOpenDialog(false);
          formik.resetForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={formik.handleSubmit}>
          <DialogTitle>
            {selectedStation ? 'İstasyonu Düzenle' : 'Yeni İstasyon Ekle'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="İstasyon Adı"
              fullWidth
              variant="outlined"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              disabled={isSubmitting}
              sx={{ mt: 2 }}
            />
            
            <TextField
              margin="dense"
              name="model"
              label="Model"
              fullWidth
              variant="outlined"
              value={formik.values.model}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.model && Boolean(formik.errors.model)}
              helperText={formik.touched.model && formik.errors.model}
              disabled={isSubmitting}
            />
            
            <FormControl 
              fullWidth 
              margin="dense"
              error={formik.touched.connector && Boolean(formik.errors.connector)}
            >
              <InputLabel>Konnektör Tipi</InputLabel>
              <Select
                name="connector"
                label="Konnektör Tipi"
                value={formik.values.connector}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={isSubmitting}
              >
                <MenuItem value="CCS">CCS</MenuItem>
                <MenuItem value="Type 2">Type 2</MenuItem>
                <MenuItem value="CHAdeMO">CHAdeMO</MenuItem>
              </Select>
              {formik.touched.connector && formik.errors.connector && (
                <Typography color="error" variant="caption">
                  {formik.errors.connector}
                </Typography>
              )}
            </FormControl>
            
            <TextField
              margin="dense"
              name="power"
              label="Güç (kW)"
              type="number"
              fullWidth
              variant="outlined"
              value={formik.values.power}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.power && Boolean(formik.errors.power)}
              helperText={formik.touched.power && formik.errors.power}
              disabled={isSubmitting}
              inputProps={{
                min: 1,
                max: 350,
                step: 0.1
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button 
              onClick={() => {
                setOpenDialog(false);
                formik.resetForm();
              }}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={!formik.isValid || isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {selectedStation ? 'Güncelle' : 'Ekle'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Bildirimler */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Mock veriler (gerçek uygulamada API'den gelecek)
const mockStations = [
  { 
    id: '1', 
    name: 'Ana İstasyon', 
    status: 'Available', 
    model: 'ABB Terra 54', 
    connector: 'CCS', 
    power: 50, 
    current: '125A', 
    voltage: '400V',
    lastSeen: '2 dakika önce' 
  },
  { 
    id: '2', 
    name: 'Yan İstasyon', 
    status: 'Charging', 
    model: 'Siemens VersiCharge', 
    connector: 'Type 2', 
    power: 22, 
    current: '32A', 
    voltage: '230V',
    lastSeen: '1 dakika önce' 
  },
  { 
    id: '3', 
    name: 'Arka Bahçe', 
    status: 'Faulted', 
    model: 'Siemens VersiCharge', 
    connector: 'Type 2', 
    power: 11, 
    current: '16A', 
    voltage: '230V',
    lastSeen: '1 saat önce' 
  }
];

export default Stations;
