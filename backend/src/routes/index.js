const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboardController');
const { getSettings, updateSettings, exportAllData } = require('../controllers/settingsController');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/settings', getSettings);
router.put('/settings', authorize('ADMIN'), updateSettings);
router.get('/export-data', authorize('ADMIN'), exportAllData);

module.exports = router;
