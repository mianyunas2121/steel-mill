const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { paymentSchema } = require('../validators/schemas');
const { getPayments, createPayment } = require('../controllers/paymentController');

const router = express.Router();

router.use(authenticate);

router.get('/', getPayments);
router.post('/', authorize('ADMIN', 'ACCOUNTANT', 'STAFF'), validate(paymentSchema), createPayment);

module.exports = router;
