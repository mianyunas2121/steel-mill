const prisma = require('../config/database');
const { success, error } = require('../utils/response');
const {
  generateInvoiceNumber,
  calculateOutgoing,
  calculateIncoming,
  paymentStatusFor,
  toNumber,
} = require('../utils/calculations');
const { sendEmail } = require('../config/email');

const serializeTransaction = (t) => ({
  ...t,
  weight: toNumber(t.weight),
  pricePerKG: toNumber(t.pricePerKG),
  materialAmount: toNumber(t.materialAmount),
  wasteWeight: toNumber(t.wasteWeight),
  wastePrice: toNumber(t.wastePrice),
  wasteAmount: toNumber(t.wasteAmount),
  advanceAmount: toNumber(t.advanceAmount),
  totalBill: toNumber(t.totalBill),
  paidAmount: toNumber(t.paidAmount),
  grossBill: toNumber(t.totalBill) + toNumber(t.advanceAmount),
});

const getTransactions = async (req, res) => {
  try {
    const { type, customerId, search, startDate, endDate, page = 1, limit = 50 } = req.query;
    const where = {};

    if (type) where.type = type;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { materialType: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.invoiceDate.lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, contactNumber: true, email: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    return success(res, {
      transactions: transactions.map(serializeTransaction),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    return error(res, 'Failed to fetch transactions');
  }
};

const getTransaction = async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!transaction) {
      return error(res, 'Transaction not found', 404);
    }

    return success(res, serializeTransaction(transaction));
  } catch (err) {
    console.error('Get transaction error:', err);
    return error(res, 'Failed to fetch transaction');
  }
};

const createIncoming = async (req, res) => {
  try {
    const {
      customerId,
      materialType,
      weight,
      pricePerKG,
      advanceAmount = 0,
      notes,
      invoiceDate,
    } = req.body;

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, isDeleted: false },
    });
    if (!customer) {
      return error(res, 'Supplier/Customer not found', 404);
    }

    const calc = calculateIncoming({ weight, pricePerKG, advanceAmount });
    const invoiceNumber = await generateInvoiceNumber(
      invoiceDate ? new Date(invoiceDate) : new Date()
    );

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: 'INCOMING',
          customerId,
          createdByUserId: req.user.id,
          materialType,
          weight,
          pricePerKG,
          materialAmount: calc.materialAmount,
          wasteWeight: 0,
          wastePrice: 0,
          wasteAmount: 0,
          takeWaste: false,
          advanceAmount: calc.advanceAmount,
          totalBill: calc.totalBill,
          notes: notes || null,
          invoiceNumber,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
          paymentStatus: paymentStatusFor(calc.totalBill, calc.totalBill),
          paidAmount: calc.totalBill,
        },
        include: {
          customer: true,
          createdBy: { select: { id: true, name: true } },
        },
      });

      await tx.inventory.upsert({
        where: { materialType },
        update: { currentStock: { increment: weight } },
        create: { materialType, currentStock: weight },
      });

      return transaction;
    });

    return success(
      res,
      serializeTransaction(result),
      `Incoming material recorded. Invoice: ${invoiceNumber}`,
      201
    );
  } catch (err) {
    console.error('Create incoming error:', err);
    return error(res, 'Failed to create incoming transaction');
  }
};

const createOutgoing = async (req, res) => {
  try {
    const {
      customerId,
      materialType,
      weight,
      pricePerKG,
      wasteWeight = 0,
      wastePricePerKG,
      takeWaste = false,
      advanceAmount = 0,
      notes,
      invoiceDate,
    } = req.body;

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, isDeleted: false },
    });
    if (!customer) {
      return error(res, 'Customer not found', 404);
    }

    const inventory = await prisma.inventory.findUnique({ where: { materialType } });
    const currentStock = inventory ? toNumber(inventory.currentStock) : 0;
    if (currentStock < parseFloat(weight)) {
      return error(
        res,
        `Insufficient stock. Available: ${currentStock} KG, Requested: ${weight} KG`,
        400
      );
    }

    const calc = calculateOutgoing({
      weight,
      pricePerKG,
      wasteWeight,
      wastePricePerKG:
        wastePricePerKG === undefined || wastePricePerKG === null
          ? pricePerKG
          : wastePricePerKG,
      takeWaste,
      advanceAmount,
    });
    const invoiceNumber = await generateInvoiceNumber(
      invoiceDate ? new Date(invoiceDate) : new Date()
    );

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: 'OUTGOING',
          customerId,
          createdByUserId: req.user.id,
          materialType,
          weight,
          pricePerKG,
          materialAmount: calc.materialAmount,
          wasteWeight: wasteWeight || 0,
          wastePrice: calc.wastePrice,
          wasteAmount: calc.wasteAmount,
          takeWaste: Boolean(takeWaste),
          advanceAmount: calc.advanceAmount,
          totalBill: calc.totalBill,
          notes: notes || null,
          invoiceNumber,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
          paymentStatus: paymentStatusFor(calc.totalBill, 0),
          paidAmount: 0,
        },
        include: {
          customer: true,
          createdBy: { select: { id: true, name: true } },
        },
      });

      await tx.inventory.update({
        where: { materialType },
        data: { currentStock: { decrement: weight } },
      });

      if (calc.totalBill > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: { balance: { increment: calc.totalBill } },
        });
      }

      return transaction;
    });

    if (customer.email) {
      const discountNote =
        !takeWaste && calc.wasteAmount > 0
          ? `<p>Waste discount applied: PKR ${calc.wasteAmount}</p>`
          : '';
      const advanceNote =
        calc.advanceAmount > 0
          ? `<p>Advance received: PKR ${calc.advanceAmount}</p><p>Gross: PKR ${calc.grossBill}</p>`
          : '';
      sendEmail({
        to: customer.email,
        subject: `Invoice ${invoiceNumber} - Steel Mill`,
        html: `
          <h2>Invoice ${invoiceNumber}</h2>
          <p>Dear ${customer.name},</p>
          <p>Material: ${materialType}</p>
          <p>Weight: ${weight} KG @ PKR ${pricePerKG}/KG</p>
          <p>Material Amount: PKR ${calc.materialAmount}</p>
          ${wasteWeight > 0 ? `<p>Waste: ${wasteWeight} KG @ PKR ${calc.wastePrice}/KG (PKR ${calc.wasteAmount})</p>` : ''}
          ${discountNote}
          ${advanceNote}
          <p><strong>Amount Due: PKR ${calc.totalBill}</strong></p>
          <p>Thank you for your business!</p>
        `,
      }).catch(console.error);
    }

    let message = `Outgoing recorded. Invoice: ${invoiceNumber}`;
    if (!takeWaste && calc.wasteAmount > 0) {
      message += `. Waste discount: PKR ${calc.wasteAmount}`;
    }
    if (calc.advanceAmount > 0) {
      message += `. Advance deducted: PKR ${calc.advanceAmount}`;
    }

    return success(res, serializeTransaction(result), message, 201);
  } catch (err) {
    console.error('Create outgoing error:', err);
    return error(res, 'Failed to create outgoing transaction');
  }
};

const updateTransaction = async (req, res) => {
  try {
    const existing = await prisma.transaction.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      return error(res, 'Transaction not found', 404);
    }

    const customerId = req.body.customerId || existing.customerId;
    const materialType = req.body.materialType || existing.materialType;
    const weight = req.body.weight !== undefined ? parseFloat(req.body.weight) : toNumber(existing.weight);
    const pricePerKG =
      req.body.pricePerKG !== undefined ? parseFloat(req.body.pricePerKG) : toNumber(existing.pricePerKG);
    const wasteWeight =
      req.body.wasteWeight !== undefined
        ? parseFloat(req.body.wasteWeight)
        : toNumber(existing.wasteWeight);
    const takeWaste =
      req.body.takeWaste !== undefined ? Boolean(req.body.takeWaste) : existing.takeWaste;
    const advanceAmount =
      req.body.advanceAmount !== undefined
        ? parseFloat(req.body.advanceAmount)
        : toNumber(existing.advanceAmount);
    const notes = req.body.notes !== undefined ? req.body.notes : existing.notes;
    const invoiceDate = req.body.invoiceDate
      ? new Date(req.body.invoiceDate)
      : existing.invoiceDate;

    const wastePricePerKG =
      req.body.wastePricePerKG !== undefined && req.body.wastePricePerKG !== null
        ? parseFloat(req.body.wastePricePerKG)
        : toNumber(existing.wastePrice) || pricePerKG;

    if (customerId !== existing.customerId) {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, isDeleted: false },
      });
      if (!customer) {
        return error(res, 'Customer not found', 404);
      }
    }

    let calc;
    if (existing.type === 'OUTGOING') {
      calc = calculateOutgoing({
        weight,
        pricePerKG,
        wasteWeight,
        wastePricePerKG,
        takeWaste,
        advanceAmount,
      });
    } else {
      calc = calculateIncoming({ weight, pricePerKG, advanceAmount });
    }

    const oldWeight = toNumber(existing.weight);
    const oldMaterial = existing.materialType;
    const oldUnpaid = Math.max(0, toNumber(existing.totalBill) - toNumber(existing.paidAmount));

    const result = await prisma.$transaction(async (tx) => {
      // Reverse old inventory effect
      if (existing.type === 'INCOMING') {
        await tx.inventory.update({
          where: { materialType: oldMaterial },
          data: { currentStock: { decrement: oldWeight } },
        });
      } else {
        await tx.inventory.update({
          where: { materialType: oldMaterial },
          data: { currentStock: { increment: oldWeight } },
        });
        if (oldUnpaid > 0) {
          await tx.customer.update({
            where: { id: existing.customerId },
            data: { balance: { decrement: oldUnpaid } },
          });
        }
      }

      // Stock check for outgoing after reverse
      if (existing.type === 'OUTGOING') {
        const inv = await tx.inventory.findUnique({ where: { materialType } });
        const stock = inv ? toNumber(inv.currentStock) : 0;
        if (stock < weight) {
          throw Object.assign(new Error(`Insufficient stock. Available: ${stock} KG`), {
            status: 400,
          });
        }
      }

      // Preserve payments already recorded against the invoice
      const paidAmount = Math.min(toNumber(existing.paidAmount), calc.totalBill);
      const paymentStatus = paymentStatusFor(calc.totalBill, paidAmount);
      const newUnpaid = Math.max(0, calc.totalBill - paidAmount);

      const updated = await tx.transaction.update({
        where: { id: existing.id },
        data: {
          customerId,
          materialType,
          weight,
          pricePerKG,
          materialAmount: calc.materialAmount,
          wasteWeight: existing.type === 'OUTGOING' ? wasteWeight : 0,
          wastePrice: existing.type === 'OUTGOING' ? calc.wastePrice : 0,
          wasteAmount: existing.type === 'OUTGOING' ? calc.wasteAmount : 0,
          takeWaste: existing.type === 'OUTGOING' ? takeWaste : false,
          advanceAmount: calc.advanceAmount,
          totalBill: calc.totalBill,
          notes: notes || null,
          invoiceDate,
          paidAmount,
          paymentStatus:
            existing.type === 'INCOMING'
              ? paymentStatusFor(calc.totalBill, calc.totalBill)
              : paymentStatus,
          ...(existing.type === 'INCOMING' ? { paidAmount: calc.totalBill } : {}),
        },
        include: {
          customer: true,
          createdBy: { select: { id: true, name: true } },
        },
      });

      // Apply new inventory
      if (existing.type === 'INCOMING') {
        await tx.inventory.upsert({
          where: { materialType },
          update: { currentStock: { increment: weight } },
          create: { materialType, currentStock: weight },
        });
      } else {
        await tx.inventory.update({
          where: { materialType },
          data: { currentStock: { decrement: weight } },
        });
        if (newUnpaid > 0) {
          await tx.customer.update({
            where: { id: customerId },
            data: { balance: { increment: newUnpaid } },
          });
        }
      }

      return updated;
    });

    return success(res, serializeTransaction(result), 'Transaction updated successfully');
  } catch (err) {
    console.error('Update transaction error:', err);
    if (err.status === 400) {
      return error(res, err.message, 400);
    }
    return error(res, 'Failed to update transaction');
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
    });
    if (!transaction) {
      return error(res, 'Transaction not found', 404);
    }

    await prisma.$transaction(async (tx) => {
      if (transaction.type === 'INCOMING') {
        await tx.inventory.update({
          where: { materialType: transaction.materialType },
          data: { currentStock: { decrement: toNumber(transaction.weight) } },
        });
      } else {
        await tx.inventory.update({
          where: { materialType: transaction.materialType },
          data: { currentStock: { increment: toNumber(transaction.weight) } },
        });
        const unpaid = toNumber(transaction.totalBill) - toNumber(transaction.paidAmount);
        if (unpaid > 0) {
          await tx.customer.update({
            where: { id: transaction.customerId },
            data: { balance: { decrement: unpaid } },
          });
        }
      }

      await tx.payment.deleteMany({ where: { invoiceId: transaction.id } });
      await tx.transaction.delete({ where: { id: transaction.id } });
    });

    return success(res, null, 'Transaction deleted successfully');
  } catch (err) {
    console.error('Delete transaction error:', err);
    return error(res, 'Failed to delete transaction');
  }
};

const getInvoiceByNumber = async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { invoiceNumber: req.params.invoiceNumber },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!transaction) {
      return error(res, 'Invoice not found', 404);
    }

    return success(res, serializeTransaction(transaction));
  } catch (err) {
    console.error('Get invoice error:', err);
    return error(res, 'Failed to fetch invoice');
  }
};

module.exports = {
  getTransactions,
  getTransaction,
  createIncoming,
  createOutgoing,
  updateTransaction,
  deleteTransaction,
  getInvoiceByNumber,
};
