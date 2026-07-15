const prisma = require('../config/database');
const { success, error } = require('../utils/response');
const { toNumber } = require('../utils/calculations');

const getPayments = async (req, res) => {
  try {
    const { customerId, invoiceId } = req.query;
    const where = {};
    if (customerId) where.customerId = customerId;
    if (invoiceId) where.invoiceId = invoiceId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        transaction: { select: { id: true, invoiceNumber: true, totalBill: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return success(
      res,
      payments.map((p) => ({ ...p, amount: toNumber(p.amount) }))
    );
  } catch (err) {
    console.error('Get payments error:', err);
    return error(res, 'Failed to fetch payments');
  }
};

const createPayment = async (req, res) => {
  try {
    const { customerId, amount, paymentMethod, invoiceId, paymentDate, notes } = req.body;

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, isDeleted: false },
    });
    if (!customer) {
      return error(res, 'Customer not found', 404);
    }

    if (invoiceId) {
      const transaction = await prisma.transaction.findUnique({ where: { id: invoiceId } });
      if (!transaction) {
        return error(res, 'Invoice not found', 404);
      }
      const remaining = toNumber(transaction.totalBill) - toNumber(transaction.paidAmount);
      if (parseFloat(amount) > remaining + 0.01) {
        return error(res, `Payment exceeds remaining balance of PKR ${remaining}`, 400);
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          customerId,
          amount,
          paymentMethod: paymentMethod || 'CASH',
          invoiceId: invoiceId || null,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          notes: notes || null,
        },
        include: {
          customer: { select: { id: true, name: true } },
          transaction: { select: { id: true, invoiceNumber: true } },
        },
      });

      // Reduce customer balance
      await tx.customer.update({
        where: { id: customerId },
        data: { balance: { decrement: amount } },
      });

      // Update invoice payment status
      if (invoiceId) {
        const transaction = await tx.transaction.findUnique({ where: { id: invoiceId } });
        const newPaid = toNumber(transaction.paidAmount) + parseFloat(amount);
        const total = toNumber(transaction.totalBill);
        let paymentStatus = 'PARTIAL';
        if (newPaid >= total - 0.01) paymentStatus = 'PAID';
        else if (newPaid <= 0) paymentStatus = 'PENDING';

        await tx.transaction.update({
          where: { id: invoiceId },
          data: { paidAmount: newPaid, paymentStatus },
        });
      }

      return payment;
    });

    return success(
      res,
      { ...result, amount: toNumber(result.amount) },
      'Payment recorded successfully',
      201
    );
  } catch (err) {
    console.error('Create payment error:', err);
    return error(res, 'Failed to record payment');
  }
};

module.exports = { getPayments, createPayment };
