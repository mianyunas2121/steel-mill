const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { customerSchema } = require('../validators/schemas');
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerTransactions,
} = require('../controllers/customerController');

const router = express.Router();

router.use(authenticate);

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.get('/:id/transactions', getCustomerTransactions);
router.post('/', authorize('ADMIN', 'STAFF', 'ACCOUNTANT'), validate(customerSchema), createCustomer);
router.put('/:id', authorize('ADMIN', 'STAFF', 'ACCOUNTANT'), validate(customerSchema), updateCustomer);
router.delete('/:id', authorize('ADMIN'), deleteCustomer);

module.exports = router;
