const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  dailyReport,
  monthlyReport,
  customerReport,
  materialReport,
  exportReport,
} = require('../controllers/reportController');

const router = express.Router();

router.use(authenticate);

router.get('/daily', dailyReport);
router.get('/monthly', monthlyReport);
router.get('/customer/:id', customerReport);
router.get('/material', materialReport);
router.get('/export', exportReport);

module.exports = router;
