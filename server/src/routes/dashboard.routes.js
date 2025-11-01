import { Router } from 'express';
import { query, param } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import * as dashboardController from '../controllers/dashboard.controller.js';

const router = Router();

// Authentication middleware for all dashboard routes
router.use(authenticate);

/**
 * @route   GET /api/dashboard/overview
 * @desc    Get dashboard overview with key metrics
 * @access  Private (User/Operator/Admin)
 */
router.get('/overview',
  [
    query('timeRange').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('Invalid time range')
  ],
  dashboardController.getDashboardOverview
);

/**
 * @route   GET /api/dashboard/stations
 * @desc    Get stations list for dashboard grid
 * @access  Private (User/Operator/Admin)
 */
router.get('/stations',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['Available', 'Occupied', 'Faulted', 'Unavailable']).withMessage('Invalid status'),
    query('protocol').optional().isIn(['1.6J', '2.0.1']).withMessage('Invalid protocol'),
    query('search').optional().isLength({ max: 100 }).withMessage('Search term too long')
  ],
  dashboardController.getStationsGrid
);

/**
 * @route   GET /api/dashboard/stations/:stationId
 * @desc    Get detailed station information
 * @access  Private (User/Operator/Admin)
 */
router.get('/stations/:stationId',
  [
    param('stationId').notEmpty().withMessage('Station ID is required')
  ],
  dashboardController.getStationDetails
);

/**
 * @route   GET /api/dashboard/metrics
 * @desc    Get real-time metrics for charts
 * @access  Private (User/Operator/Admin)
 */
router.get('/metrics',
  [
    query('metric').optional().isIn(['power', 'energy', 'utilization', 'sessions']).withMessage('Invalid metric'),
    query('duration').optional().isIn(['5m', '15m', '1h', '6h', '24h']).withMessage('Invalid duration')
  ],
  dashboardController.getRealtimeMetrics
);

/**
 * @route   GET /api/dashboard/alerts
 * @desc    Get system alerts and notifications
 * @access  Private (Operator/Admin)
 */
router.get('/alerts',
  authorize(['operator', 'admin']),
  [
    query('severity').optional().isIn(['all', 'error', 'warning', 'info']).withMessage('Invalid severity'),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Limit must be between 1 and 200')
  ],
  dashboardController.getSystemAlerts
);

/**
 * @route   GET /api/dashboard/export
 * @desc    Export dashboard data for reporting
 * @access  Private (Operator/Admin)
 */
router.get('/export',
  authorize(['operator', 'admin']),
  [
    query('format').optional().isIn(['json', 'csv']).withMessage('Invalid export format'),
    query('timeRange').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('Invalid time range')
  ],
  dashboardController.exportDashboardData
);

export default router;
