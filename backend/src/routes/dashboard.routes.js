/**
 * Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

// All dashboard routes require authentication
router.use(protect);

// Get main dashboard data
router.get('/', dashboardController.getDashboardData);

// Get activity chart data
router.get('/activity', dashboardController.getActivityData);

// Get security status
router.get('/security', dashboardController.getSecurityStatus);

module.exports = router;
