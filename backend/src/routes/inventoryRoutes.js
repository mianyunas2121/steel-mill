const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getInventory, updateInventory, getInventoryTrend } = require('../controllers/inventoryController');

const router = express.Router();

router.use(authenticate);

router.get('/', getInventory);
router.get('/trend', getInventoryTrend);
router.put('/:id', authorize('ADMIN', 'STAFF'), updateInventory);

module.exports = router;
