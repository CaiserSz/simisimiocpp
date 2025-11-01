import express from 'express';
import { param, query, body } from 'express-validator';
import {
  getTransactions,
  getTransaction,
  getActiveTransactions,
  getTransactionMeterValues,
  getTransactionCost,
  refundTransaction,
  exportTransactions,
  getTransactionStats,
  getTransactionTimeline,
} from '../controllers/transaction.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation middleware
const validateTransactionQuery = [
  query('status').optional().isIn(['active', 'completed', 'cancelled']),
  query('stationId').optional().isString(),
  query('userId').optional().isMongoId(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('minEnergy').optional().isFloat({ min: 0 }),
  query('maxEnergy').optional().isFloat({ min: 0 }),
  query('minCost').optional().isFloat({ min: 0 }),
  query('maxCost').optional().isFloat({ min: 0 }),
  query('sortBy').optional().isIn(['startTime', 'endTime', 'energy', 'cost']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 }),
];

const validateExportQuery = [
  query('format').isIn(['csv', 'json', 'xlsx']).withMessage('Invalid export format'),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('stationId').optional().isString(),
  query('userId').optional().isMongoId(),
];

const validateRefund = [
  param('id').isMongoId().withMessage('Invalid transaction ID'),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('reason').optional().isString().trim().notEmpty(),
];

// Routes
router.get('/', validateTransactionQuery, getTransactions);
router.get('/active', getActiveTransactions);

// Transaction details
router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid transaction ID'),
  getTransaction
);

// Transaction meter values
router.get(
  '/:id/meter-values',
  param('id').isMongoId().withMessage('Invalid transaction ID'),
  query('type').optional().isIn(['all', 'energy', 'power', 'current', 'voltage', 'soc']),
  getTransactionMeterValues
);

// Transaction cost
router.get(
  '/:id/cost',
  param('id').isMongoId().withMessage('Invalid transaction ID'),
  getTransactionCost
);

// Refund transaction
router.post(
  '/:id/refund',
  authorize(['admin', 'operator']),
  validateRefund,
  refundTransaction
);

// Export transactions
router.get(
  '/export',
  authorize(['admin', 'operator']),
  validateExportQuery,
  exportTransactions
);

// Transaction statistics
router.get(
  '/stats/overview',
  query('period').optional().isIn(['day', 'week', 'month', 'year', 'custom']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('stationId').optional().isString(),
  query('userId').optional().isMongoId(),
  getTransactionStats
);

// Transaction timeline
router.get(
  '/timeline',
  query('period').isIn(['day', 'week', 'month', 'year']).withMessage('Invalid period'),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('stationId').optional().isString(),
  query('userId').optional().isMongoId(),
  getTransactionTimeline
);

export default router;
