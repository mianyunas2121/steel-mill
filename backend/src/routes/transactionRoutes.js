const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  incomingSchema,
  outgoingSchema,
  updateTransactionSchema,
} = require('../validators/schemas');
const {
  getTransactions,
  getTransaction,
  createIncoming,
  createOutgoing,
  updateTransaction,
  deleteTransaction,
  getInvoiceByNumber,
} = require('../controllers/transactionController');

const router = express.Router();

router.use(authenticate);

router.get('/', getTransactions);
router.get('/invoice/:invoiceNumber', getInvoiceByNumber);
router.get('/:id', getTransaction);
router.post('/incoming', authorize('ADMIN', 'STAFF'), validate(incomingSchema), createIncoming);
router.post('/outgoing', authorize('ADMIN', 'STAFF'), validate(outgoingSchema), createOutgoing);
router.put('/:id', authorize('ADMIN', 'STAFF'), validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', authorize('ADMIN'), deleteTransaction);

module.exports = router;
