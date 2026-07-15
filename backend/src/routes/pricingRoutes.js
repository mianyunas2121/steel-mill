const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { pricingSchema } = require('../validators/schemas');
const { getPricing, createPricing, updatePricing } = require('../controllers/pricingController');

const router = express.Router();

router.use(authenticate);

router.get('/', getPricing);
router.post('/', authorize('ADMIN'), validate(pricingSchema), createPricing);
router.put('/:id', authorize('ADMIN'), updatePricing);

module.exports = router;
