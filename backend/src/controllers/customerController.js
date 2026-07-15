const prisma = require('../config/database');
const { success, error } = require('../utils/response');
const { toNumber } = require('../utils/calculations');

const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    const where = { isDeleted: false };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: { select: { transactions: true } },
        transactions: {
          select: { totalBill: true, type: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = customers.map((c) => {
      const totalAmount = c.transactions
        .filter((t) => t.type === 'OUTGOING')
        .reduce((sum, t) => sum + toNumber(t.totalBill), 0);
      const { transactions, ...rest } = c;
      return {
        ...rest,
        balance: toNumber(c.balance),
        totalOrders: c._count.transactions,
        totalAmount,
      };
    });

    return success(res, result);
  } catch (err) {
    console.error('Get customers error:', err);
    return error(res, 'Failed to fetch customers');
  }
};

const getCustomer = async (req, res) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, isDeleted: false },
    });
    if (!customer) {
      return error(res, 'Customer not found', 404);
    }
    return success(res, { ...customer, balance: toNumber(customer.balance) });
  } catch (err) {
    console.error('Get customer error:', err);
    return error(res, 'Failed to fetch customer');
  }
};

const createCustomer = async (req, res) => {
  try {
    const customer = await prisma.customer.create({
      data: {
        name: req.body.name,
        contactNumber: req.body.contactNumber || null,
        email: req.body.email || null,
        address: req.body.address || null,
        gstNumber: req.body.gstNumber || null,
        taxId: req.body.taxId || null,
      },
    });
    return success(res, customer, 'Customer created successfully', 201);
  } catch (err) {
    console.error('Create customer error:', err);
    return error(res, 'Failed to create customer');
  }
};

const updateCustomer = async (req, res) => {
  try {
    const existing = await prisma.customer.findFirst({
      where: { id: req.params.id, isDeleted: false },
    });
    if (!existing) {
      return error(res, 'Customer not found', 404);
    }

    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        contactNumber: req.body.contactNumber || null,
        email: req.body.email || null,
        address: req.body.address || null,
        gstNumber: req.body.gstNumber || null,
        taxId: req.body.taxId || null,
      },
    });

    return success(res, customer, 'Customer updated successfully');
  } catch (err) {
    console.error('Update customer error:', err);
    return error(res, 'Failed to update customer');
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const existing = await prisma.customer.findFirst({
      where: { id: req.params.id, isDeleted: false },
    });
    if (!existing) {
      return error(res, 'Customer not found', 404);
    }

    await prisma.customer.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });

    return success(res, null, 'Customer deleted successfully');
  } catch (err) {
    console.error('Delete customer error:', err);
    return error(res, 'Failed to delete customer');
  }
};

const getCustomerTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { customerId: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = transactions.map((t) => ({
      ...t,
      weight: toNumber(t.weight),
      pricePerKG: toNumber(t.pricePerKG),
      materialAmount: toNumber(t.materialAmount),
      wasteWeight: toNumber(t.wasteWeight),
      wastePrice: toNumber(t.wastePrice),
      wasteAmount: toNumber(t.wasteAmount),
      totalBill: toNumber(t.totalBill),
      paidAmount: toNumber(t.paidAmount),
    }));

    return success(res, result);
  } catch (err) {
    console.error('Get customer transactions error:', err);
    return error(res, 'Failed to fetch transactions');
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerTransactions,
};
