import { asyncHandler } from '../utils/errorHandler.js';
import { simulationManager } from './simulator.controller.js';
import CacheManager from '../services/CacheManager.js';

/**
 * Real-time Dashboard API Controller
 * Optimized for frontend dashboard integration
 */

/**
 * Get dashboard overview with all key metrics
 */
export const getDashboardOverview = asyncHandler(async (req, res) => {
  const { timeRange = '1h' } = req.query;
  
  // Try cache first
  const cacheKey = `dashboard:overview:${timeRange}`;
  let overview = await CacheManager.get(cacheKey);
  
  if (!overview) {
    const statistics = simulationManager.getStatistics();
    const stationsStatus = simulationManager.getAllStationsStatus();
    const stations = Object.values(stationsStatus);
    
    // Calculate real-time metrics
    const totalConnectors = stations.reduce((sum, station) => sum + station.connectors.length, 0);
    const activeConnectors = stations.reduce((sum, station) => 
      sum + station.connectors.filter(c => c.status === 'Occupied').length, 0
    );
    const totalPower = stations.reduce((sum, station) => 
      sum + station.connectors.reduce((connSum, conn) => connSum + (conn.currentPower || 0), 0), 0
    );
    const totalEnergyDelivered = stations.reduce((sum, station) => 
      sum + station.connectors.reduce((connSum, conn) => connSum + (conn.energyDelivered || 0), 0), 0
    );

    overview = {
      timestamp: new Date().toISOString(),
      simulation: {
        isRunning: statistics.isRunning,
        uptime: statistics.uptime,
        startTime: statistics.startTime
      },
      stations: {
        total: statistics.totalStations,
        online: statistics.activeStations,
        offline: statistics.totalStations - statistics.activeStations,
        byProtocol: statistics.protocolDistribution,
        byStatus: {
          available: stations.filter(s => s.status === 'Available').length,
          occupied: stations.filter(s => s.connectors.some(c => c.status === 'Occupied')).length,
          faulted: stations.filter(s => s.status === 'Faulted').length,
          unavailable: stations.filter(s => s.status === 'Unavailable').length
        }
      },
      connectors: {
        total: totalConnectors,
        active: activeConnectors,
        available: totalConnectors - activeConnectors,
        utilizationRate: totalConnectors > 0 ? (activeConnectors / totalConnectors * 100).toFixed(1) : 0
      },
      power: {
        totalActivePower: Math.round(totalPower / 1000 * 100) / 100, // kW
        averagePowerPerStation: statistics.activeStations > 0 ? 
          Math.round(totalPower / statistics.activeStations / 1000 * 100) / 100 : 0,
        peakPower: Math.max(...stations.map(s => 
          s.connectors.reduce((sum, c) => sum + (c.currentPower || 0), 0)
        )) / 1000 || 0
      },
      energy: {
        totalDelivered: Math.round(totalEnergyDelivered * 100) / 100, // kWh
        averagePerSession: statistics.totalSessions > 0 ? 
          Math.round(totalEnergyDelivered / statistics.totalSessions * 100) / 100 : 0,
        totalSessions: statistics.totalSessions
      },
      performance: {
        averageSessionDuration: statistics.averageSessionDuration || 0,
        totalDuration: statistics.totalDuration || 0,
        sessionRate: statistics.uptime > 0 ? 
          Math.round(statistics.totalSessions / (statistics.uptime / 3600) * 100) / 100 : 0 // sessions per hour
      }
    };

    // Cache for 10 seconds for real-time feel
    await CacheManager.set(cacheKey, overview, 10);
  }

  res.json({
    success: true,
    data: overview
  });
});

/**
 * Get stations list optimized for dashboard grid
 */
export const getStationsGrid = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, protocol, search } = req.query;
  
  const stationsStatus = simulationManager.getAllStationsStatus();
  let stations = Object.values(stationsStatus);

  // Apply filters
  if (status) {
    stations = stations.filter(s => s.status.toLowerCase() === status.toLowerCase());
  }
  
  if (protocol) {
    stations = stations.filter(s => s.config.ocppVersion === protocol);
  }
  
  if (search) {
    stations = stations.filter(s => 
      s.stationId.toLowerCase().includes(search.toLowerCase()) ||
      s.config.vendor.toLowerCase().includes(search.toLowerCase()) ||
      s.config.model.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedStations = stations.slice(startIndex, endIndex);

  // Transform for dashboard
  const gridData = paginatedStations.map(station => ({
    stationId: station.stationId,
    name: `${station.config.vendor} ${station.config.model}`,
    status: station.status,
    isOnline: station.isOnline,
    protocol: station.config.ocppVersion,
    location: station.config.location || 'Unknown',
    connectors: station.connectors.map(c => ({
      id: c.connectorId,
      status: c.status,
      currentPower: Math.round(c.currentPower / 1000 * 10) / 10, // kW
      energyDelivered: Math.round(c.energyDelivered * 100) / 100,
      hasVehicle: !!c.hasActiveTransaction,
      temperature: c.temperature || 20
    })),
    totalPower: Math.round(
      station.connectors.reduce((sum, c) => sum + (c.currentPower || 0), 0) / 1000 * 10
    ) / 10,
    maxPower: station.config.maxPower / 1000, // kW
    utilizationRate: station.connectors.length > 0 ? 
      (station.connectors.filter(c => c.hasActiveTransaction).length / station.connectors.length * 100).toFixed(0) : 0,
    lastUpdate: new Date().toISOString()
  }));

  res.json({
    success: true,
    data: {
      stations: gridData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: stations.length,
        totalPages: Math.ceil(stations.length / limit),
        hasNext: endIndex < stations.length,
        hasPrev: page > 1
      },
      filters: {
        status,
        protocol,
        search
      }
    }
  });
});

/**
 * Get real-time metrics for charts
 */
export const getRealtimeMetrics = asyncHandler(async (req, res) => {
  const { metric = 'power', duration = '1h' } = req.query;
  
  // This would typically come from time-series database
  // For demo, we'll generate current values
  const stationsStatus = simulationManager.getAllStationsStatus();
  const stations = Object.values(stationsStatus);
  
  let data = [];
  const now = new Date();
  
  switch (metric) {
    case 'power':
      data = stations.map(station => ({
        stationId: station.stationId,
        timestamp: now.toISOString(),
        value: station.connectors.reduce((sum, c) => sum + (c.currentPower || 0), 0) / 1000, // kW
        unit: 'kW'
      }));
      break;
      
    case 'energy':
      data = stations.map(station => ({
        stationId: station.stationId,
        timestamp: now.toISOString(),
        value: station.connectors.reduce((sum, c) => sum + (c.energyDelivered || 0), 0),
        unit: 'kWh'
      }));
      break;
      
    case 'utilization':
      data = stations.map(station => ({
        stationId: station.stationId,
        timestamp: now.toISOString(),
        value: station.connectors.length > 0 ? 
          (station.connectors.filter(c => c.hasActiveTransaction).length / station.connectors.length * 100) : 0,
        unit: '%'
      }));
      break;
      
    case 'sessions':
      data = [{
        timestamp: now.toISOString(),
        value: simulationManager.getStatistics().totalSessions,
        unit: 'count'
      }];
      break;
  }

  res.json({
    success: true,
    data: {
      metric,
      duration,
      timestamp: now.toISOString(),
      values: data
    }
  });
});

/**
 * Get station details with full status
 */
export const getStationDetails = asyncHandler(async (req, res) => {
  const { stationId } = req.params;
  
  const station = simulationManager.getStation(stationId);
  if (!station) {
    return res.status(404).json({
      success: false,
      error: 'Station not found'
    });
  }

  const stationStatus = station.getStatus();
  const vehicleStatuses = station.vehicleSimulator.getAllVehiclesStatus();
  const ocppStatus = station.ocppClient?.getStatus();

  // Enhanced details for dashboard
  const details = {
    ...stationStatus,
    connectors: stationStatus.connectors.map(connector => {
      const vehicle = vehicleStatuses[connector.connectorId];
      return {
        ...connector,
        vehicle: vehicle ? {
          ...vehicle,
          chargingCurve: vehicle.profile?.chargingCurve || [],
          estimatedCompletionTime: vehicle.estimatedChargingTime ? 
            new Date(Date.now() + vehicle.estimatedChargingTime * 60000).toISOString() : null
        } : null,
        powerHistory: [], // Would come from time-series DB
        temperatureHistory: [], // Would come from time-series DB
      };
    }),
    ocpp: {
      ...ocppStatus,
      lastMessages: [], // Recent OCPP messages
      messageStats: {
        sent: 0,
        received: 0,
        errors: 0
      }
    },
    performance: {
      avgResponseTime: 150, // ms
      successRate: 99.5, // %
      lastError: null,
      uptimeToday: 95.2 // %
    }
  };

  res.json({
    success: true,
    data: details
  });
});

/**
 * Get system alerts and notifications
 */
export const getSystemAlerts = asyncHandler(async (req, res) => {
  const { severity = 'all', limit = 50 } = req.query;
  
  // This would typically come from monitoring system
  const stationsStatus = simulationManager.getAllStationsStatus();
  const stations = Object.values(stationsStatus);
  
  const alerts = [];
  
  // Generate alerts based on current state
  stations.forEach(station => {
    // Offline stations
    if (!station.isOnline) {
      alerts.push({
        id: `offline_${station.stationId}`,
        severity: 'error',
        type: 'connectivity',
        stationId: station.stationId,
        message: `Station ${station.stationId} is offline`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }
    
    // High utilization
    const utilization = station.connectors.length > 0 ? 
      (station.connectors.filter(c => c.hasActiveTransaction).length / station.connectors.length * 100) : 0;
    
    if (utilization > 90) {
      alerts.push({
        id: `high_util_${station.stationId}`,
        severity: 'warning',
        type: 'utilization',
        stationId: station.stationId,
        message: `Station ${station.stationId} has high utilization (${utilization.toFixed(0)}%)`,
        timestamp: new Date().toISOString(),
        acknowledged: false
      });
    }
    
    // Temperature alerts
    station.connectors.forEach(connector => {
      if (connector.temperature > 60) {
        alerts.push({
          id: `temp_${station.stationId}_${connector.connectorId}`,
          severity: 'warning',
          type: 'temperature',
          stationId: station.stationId,
          connectorId: connector.connectorId,
          message: `Connector ${connector.connectorId} temperature high (${connector.temperature}°C)`,
          timestamp: new Date().toISOString(),
          acknowledged: false
        });
      }
    });
  });

  // Filter by severity
  let filteredAlerts = alerts;
  if (severity !== 'all') {
    filteredAlerts = alerts.filter(alert => alert.severity === severity);
  }

  // Sort by timestamp (newest first) and limit
  filteredAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  filteredAlerts = filteredAlerts.slice(0, limit);

  res.json({
    success: true,
    data: {
      alerts: filteredAlerts,
      summary: {
        total: alerts.length,
        error: alerts.filter(a => a.severity === 'error').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length
      }
    }
  });
});

/**
 * Export dashboard data for reporting
 */
export const exportDashboardData = asyncHandler(async (req, res) => {
  const { format = 'json', timeRange = '24h' } = req.query;
  
  // Manually create overview data instead of calling controller function
  // (Controller functions are Express handlers and cannot be called directly)
  const statistics = simulationManager.getStatistics();
  const stationsStatus = simulationManager.getAllStationsStatus();
  const stations = Object.values(stationsStatus);
  
  const totalConnectors = stations.reduce((sum, station) => sum + station.connectors.length, 0);
  const activeConnectors = stations.reduce((sum, station) => 
    sum + station.connectors.filter(c => c.status === 'Occupied').length, 0
  );
  const totalPower = stations.reduce((sum, station) => 
    sum + station.connectors.reduce((connSum, conn) => connSum + (conn.currentPower || 0), 0), 0
  );
  const totalEnergyDelivered = stations.reduce((sum, station) => 
    sum + station.connectors.reduce((connSum, conn) => connSum + (conn.energyDelivered || 0), 0), 0
  );

  const overview = {
    timestamp: new Date().toISOString(),
    simulation: {
      isRunning: statistics.isRunning,
      uptime: statistics.uptime,
      startTime: statistics.startTime
    },
    stations: {
      total: statistics.totalStations,
      online: statistics.activeStations,
      offline: statistics.totalStations - statistics.activeStations,
      byProtocol: statistics.protocolDistribution,
      byStatus: {
        available: stations.filter(s => s.status === 'Available').length,
        occupied: stations.filter(s => s.connectors.some(c => c.status === 'Occupied')).length,
        faulted: stations.filter(s => s.status === 'Faulted').length,
        unavailable: stations.filter(s => s.status === 'Unavailable').length
      }
    },
    connectors: {
      total: totalConnectors,
      active: activeConnectors,
      available: totalConnectors - activeConnectors,
      utilizationRate: totalConnectors > 0 ? (activeConnectors / totalConnectors * 100).toFixed(1) : 0
    },
    power: {
      totalActivePower: Math.round(totalPower / 1000 * 100) / 100,
      averagePowerPerStation: statistics.activeStations > 0 ? 
        Math.round(totalPower / statistics.activeStations / 1000 * 100) / 100 : 0,
      peakPower: Math.max(...stations.map(s => 
        s.connectors.reduce((sum, c) => sum + (c.currentPower || 0), 0)
      )) / 1000 || 0
    },
    energy: {
      totalDelivered: Math.round(totalEnergyDelivered * 100) / 100,
      averagePerSession: statistics.totalSessions > 0 ? 
        Math.round(totalEnergyDelivered / statistics.totalSessions * 100) / 100 : 0,
      totalSessions: statistics.totalSessions
    }
  };
  
  const exportData = {
    generatedAt: new Date().toISOString(),
    timeRange,
    overview: overview,
    stations: Object.values(stationsStatus),
    statistics: simulationManager.getStatistics()
  };
  
  if (format === 'csv') {
    // Convert to CSV format
    const csvData = convertToCSV(exportData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=dashboard-export-${Date.now()}.csv`);
    res.send(csvData);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=dashboard-export-${Date.now()}.json`);
    res.json({
      success: true,
      data: exportData
    });
  }
});

/**
 * Helper function to convert data to CSV
 * Includes CSV injection protection by escaping special characters
 */
function convertToCSV(data) {
  // CSV injection protection - escape special characters
  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    // Escape leading special characters that could be interpreted as formulas
    if (/^[=+\-@]/.test(str)) {
      return `"${str}"`;
    }
    return str;
  };
  
  const headers = ['Station ID', 'Status', 'Protocol', 'Power (kW)', 'Energy (kWh)', 'Utilization (%)'];
  const rows = data.stations.map(station => [
    escapeCSV(station.stationId),
    escapeCSV(station.status),
    escapeCSV(station.config.ocppVersion),
    escapeCSV((station.connectors.reduce((sum, c) => sum + (c.currentPower || 0), 0) / 1000).toFixed(2)),
    escapeCSV(station.connectors.reduce((sum, c) => sum + (c.energyDelivered || 0), 0).toFixed(2)),
    escapeCSV(station.connectors.length > 0 ? 
      (station.connectors.filter(c => c.hasActiveTransaction).length / station.connectors.length * 100).toFixed(1) : 0)
  ]);
  
  return [headers.map(escapeCSV).join(','), ...rows.map(row => row.join(','))].join('\n');
}
