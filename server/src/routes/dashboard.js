import { Router } from 'express';
import { param, query } from 'express-validator';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Authentication middleware for all dashboard routes
router.use(authenticate);

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Get dashboard overview
 *     description: Returns dashboard overview with key metrics and statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 6h, 24h, 7d, 30d]
 *         description: Time range for filtering data
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/overview', [
        query('timeRange').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('Invalid time range')
    ],
    dashboardController.getDashboardOverview
);

/**
 * @swagger
 * /api/dashboard/stations:
 *   get:
 *     summary: Get stations list for dashboard
 *     description: Returns paginated list of stations for dashboard grid view
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Available, Occupied, Faulted, Unavailable]
 *         description: Filter by station status
 *       - in: query
 *         name: protocol
 *         schema:
 *           type: string
 *           enum: [1.6J, 2.0.1]
 *         description: Filter by OCPP protocol version
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search term for station name or ID
 *     responses:
 *       200:
 *         description: Stations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Station'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/stations', [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
        query('status').optional().isIn(['Available', 'Occupied', 'Faulted', 'Unavailable']).withMessage('Invalid status'),
        query('protocol').optional().isIn(['1.6J', '2.0.1']).withMessage('Invalid protocol'),
        query('search').optional().isLength({ max: 100 }).withMessage('Search term too long')
    ],
    dashboardController.getStationsGrid
);

/**
 * @swagger
 * /api/dashboard/stations/{stationId}:
 *   get:
 *     summary: Get detailed station information
 *     description: Returns detailed information about a specific station
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Station identifier
 *     responses:
 *       200:
 *         description: Station details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Station'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/stations/:stationId', [
        param('stationId').notEmpty().withMessage('Station ID is required')
    ],
    dashboardController.getStationDetails
);

/**
 * @route   GET /api/dashboard/metrics
 * @desc    Get real-time metrics for charts
 * @access  Private (User/Operator/Admin)
 */
router.get('/metrics', [
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
    authorize(['operator', 'admin']), [
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
    authorize(['operator', 'admin']), [
        query('format').optional().isIn(['json', 'csv']).withMessage('Invalid export format'),
        query('timeRange').optional().isIn(['1h', '6h', '24h', '7d', '30d']).withMessage('Invalid time range')
    ],
    dashboardController.exportDashboardData
);

export default router;