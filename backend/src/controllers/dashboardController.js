const prisma = require('../config/database');
const { success, error } = require('../utils/response');
const { toNumber } = require('../utils/calculations');

const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      todayCount,
      monthOutgoing,
      inventory,
      topCustomers,
      recentTransactions,
      revenueTrend,
      pricing,
    ] = await Promise.all([
      prisma.transaction.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.transaction.findMany({
        where: {
          type: 'OUTGOING',
          invoiceDate: { gte: monthStart },
        },
        select: { totalBill: true },
      }),
      prisma.inventory.findMany(),
      prisma.customer.findMany({
        where: { isDeleted: false },
        include: {
          transactions: {
            where: { type: 'OUTGOING' },
            select: { totalBill: true },
          },
        },
      }),
      prisma.transaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
        },
      }),
      prisma.transaction.findMany({
        where: {
          type: 'OUTGOING',
          invoiceDate: { gte: thirtyDaysAgo },
        },
        select: { totalBill: true, invoiceDate: true },
        orderBy: { invoiceDate: 'asc' },
      }),
      prisma.pricing.findMany({
        where: {
          OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
        },
        orderBy: { validFrom: 'desc' },
      }),
    ]);

    const monthRevenue = monthOutgoing.reduce((s, t) => s + toNumber(t.totalBill), 0);

    const priceMap = {};
    pricing.forEach((p) => {
      if (!priceMap[p.materialType]) priceMap[p.materialType] = toNumber(p.pricePerKG);
    });

    const inventoryValue = inventory.reduce((s, i) => {
      return s + toNumber(i.currentStock) * (priceMap[i.materialType] || 0);
    }, 0);

    const inventoryStatus = inventory.map((i) => ({
      materialType: i.materialType,
      currentStock: toNumber(i.currentStock),
      value: Math.round(toNumber(i.currentStock) * (priceMap[i.materialType] || 0) * 100) / 100,
    }));

    const customersWithAmount = topCustomers
      .map((c) => ({
        id: c.id,
        name: c.name,
        totalAmount: c.transactions.reduce((s, t) => s + toNumber(t.totalBill), 0),
        balance: toNumber(c.balance),
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    const revenueByDate = {};
    revenueTrend.forEach((t) => {
      const date = t.invoiceDate.toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + toNumber(t.totalBill);
    });

    const revenueChart = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
    }));

    return success(res, {
      todayTransactions: todayCount,
      monthRevenue: Math.round(monthRevenue * 100) / 100,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      totalCustomers: topCustomers.length,
      topCustomers: customersWithAmount,
      inventoryStatus,
      revenueChart,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        invoiceNumber: t.invoiceNumber,
        customerName: t.customer.name,
        materialType: t.materialType,
        totalBill: toNumber(t.totalBill),
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return error(res, 'Failed to fetch dashboard data');
  }
};

module.exports = { getDashboard };
