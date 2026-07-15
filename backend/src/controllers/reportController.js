const prisma = require('../config/database');
const { success, error } = require('../utils/response');
const { toNumber } = require('../utils/calculations');
const ExcelJS = require('exceljs');

const serializeTx = (t) => ({
  ...t,
  weight: toNumber(t.weight),
  pricePerKG: toNumber(t.pricePerKG),
  materialAmount: toNumber(t.materialAmount),
  wasteWeight: toNumber(t.wasteWeight),
  wasteAmount: toNumber(t.wasteAmount),
  totalBill: toNumber(t.totalBill),
  paidAmount: toNumber(t.paidAmount),
});

const dailyReport = async (req, res) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: { invoiceDate: { gte: start, lte: end } },
      include: {
        customer: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const incoming = transactions.filter((t) => t.type === 'INCOMING');
    const outgoing = transactions.filter((t) => t.type === 'OUTGOING');

    return success(res, {
      date: dateStr,
      transactions: transactions.map(serializeTx),
      summary: {
        totalTransactions: transactions.length,
        incomingCount: incoming.length,
        outgoingCount: outgoing.length,
        incomingTotal: incoming.reduce((s, t) => s + toNumber(t.totalBill), 0),
        outgoingTotal: outgoing.reduce((s, t) => s + toNumber(t.totalBill), 0),
        totalWeightIn: incoming.reduce((s, t) => s + toNumber(t.weight), 0),
        totalWeightOut: outgoing.reduce((s, t) => s + toNumber(t.weight), 0),
      },
    });
  } catch (err) {
    console.error('Daily report error:', err);
    return error(res, 'Failed to generate daily report');
  }
};

const monthlyReport = async (req, res) => {
  try {
    const monthStr = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
      where: { invoiceDate: { gte: start, lte: end } },
      include: { customer: { select: { name: true } } },
    });

    const incoming = transactions.filter((t) => t.type === 'INCOMING');
    const outgoing = transactions.filter((t) => t.type === 'OUTGOING');
    const revenue = outgoing.reduce((s, t) => s + toNumber(t.totalBill), 0);
    const expenses = incoming.reduce((s, t) => s + toNumber(t.totalBill), 0);

    // Material-wise breakdown
    const materialSales = {};
    outgoing.forEach((t) => {
      if (!materialSales[t.materialType]) {
        materialSales[t.materialType] = { materialType: t.materialType, weight: 0, amount: 0 };
      }
      materialSales[t.materialType].weight += toNumber(t.weight);
      materialSales[t.materialType].amount += toNumber(t.totalBill);
    });

    // Daily revenue for chart
    const dailyRevenue = {};
    outgoing.forEach((t) => {
      const d = t.invoiceDate.toISOString().split('T')[0];
      dailyRevenue[d] = (dailyRevenue[d] || 0) + toNumber(t.totalBill);
    });

    return success(res, {
      month: monthStr,
      summary: {
        revenue: Math.round(revenue * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        profit: Math.round((revenue - expenses) * 100) / 100,
        incomingCount: incoming.length,
        outgoingCount: outgoing.length,
        totalTransactions: transactions.length,
      },
      materialSales: Object.values(materialSales),
      dailyRevenue: Object.entries(dailyRevenue).map(([date, amount]) => ({
        date,
        amount: Math.round(amount * 100) / 100,
      })),
      transactions: transactions.map(serializeTx),
    });
  } catch (err) {
    console.error('Monthly report error:', err);
    return error(res, 'Failed to generate monthly report');
  }
};

const customerReport = async (req, res) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, isDeleted: false },
    });
    if (!customer) {
      return error(res, 'Customer not found', 404);
    }

    const transactions = await prisma.transaction.findMany({
      where: { customerId: req.params.id },
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    });

    const payments = await prisma.payment.findMany({
      where: { customerId: req.params.id },
      orderBy: { paymentDate: 'desc' },
    });

    const outgoing = transactions.filter((t) => t.type === 'OUTGOING');
    const totalBilled = outgoing.reduce((s, t) => s + toNumber(t.totalBill), 0);
    const totalPaid = payments.reduce((s, t) => s + toNumber(t.amount), 0);

    return success(res, {
      customer: { ...customer, balance: toNumber(customer.balance) },
      summary: {
        totalOrders: transactions.length,
        totalBilled,
        totalPaid,
        outstanding: toNumber(customer.balance),
      },
      transactions: transactions.map(serializeTx),
      payments: payments.map((p) => ({ ...p, amount: toNumber(p.amount) })),
    });
  } catch (err) {
    console.error('Customer report error:', err);
    return error(res, 'Failed to generate customer report');
  }
};

const materialReport = async (req, res) => {
  try {
    const { materialType, startDate, endDate } = req.query;
    const where = {};
    if (materialType) where.materialType = materialType;
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.invoiceDate.lte = end;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const byMaterial = {};
    transactions.forEach((t) => {
      if (!byMaterial[t.materialType]) {
        byMaterial[t.materialType] = {
          materialType: t.materialType,
          incomingWeight: 0,
          outgoingWeight: 0,
          incomingAmount: 0,
          outgoingAmount: 0,
          count: 0,
        };
      }
      const m = byMaterial[t.materialType];
      m.count++;
      if (t.type === 'INCOMING') {
        m.incomingWeight += toNumber(t.weight);
        m.incomingAmount += toNumber(t.totalBill);
      } else {
        m.outgoingWeight += toNumber(t.weight);
        m.outgoingAmount += toNumber(t.totalBill);
      }
    });

    return success(res, {
      materials: Object.values(byMaterial),
      transactions: transactions.map(serializeTx),
    });
  } catch (err) {
    console.error('Material report error:', err);
    return error(res, 'Failed to generate material report');
  }
};

const exportReport = async (req, res) => {
  try {
    const { format = 'excel', type = 'daily', date, month, customerId } = req.query;
    let data = [];
    let filename = 'report';

    if (type === 'daily') {
      const dateStr = date || new Date().toISOString().split('T')[0];
      const start = new Date(dateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateStr);
      end.setHours(23, 59, 59, 999);
      const transactions = await prisma.transaction.findMany({
        where: { invoiceDate: { gte: start, lte: end } },
        include: { customer: true },
      });
      data = transactions;
      filename = `daily-report-${dateStr}`;
    } else if (type === 'monthly') {
      const monthStr = month || new Date().toISOString().slice(0, 7);
      const [year, m] = monthStr.split('-').map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59, 999);
      data = await prisma.transaction.findMany({
        where: { invoiceDate: { gte: start, lte: end } },
        include: { customer: true },
      });
      filename = `monthly-report-${monthStr}`;
    } else if (type === 'customer' && customerId) {
      data = await prisma.transaction.findMany({
        where: { customerId },
        include: { customer: true },
      });
      filename = `customer-report-${customerId.slice(0, 8)}`;
    }

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Report');
      sheet.columns = [
        { header: 'Invoice #', key: 'invoiceNumber', width: 18 },
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Type', key: 'type', width: 10 },
        { header: 'Customer', key: 'customer', width: 20 },
        { header: 'Material', key: 'material', width: 12 },
        { header: 'Weight (KG)', key: 'weight', width: 12 },
        { header: 'Price/KG', key: 'price', width: 10 },
        { header: 'Waste (KG)', key: 'waste', width: 10 },
        { header: 'Take Waste', key: 'takeWaste', width: 12 },
        { header: 'Total Bill', key: 'total', width: 12 },
        { header: 'Payment Status', key: 'status', width: 14 },
      ];

      data.forEach((t) => {
        sheet.addRow({
          invoiceNumber: t.invoiceNumber,
          date: t.invoiceDate.toISOString().split('T')[0],
          type: t.type,
          customer: t.customer?.name || '',
          material: t.materialType,
          weight: toNumber(t.weight),
          price: toNumber(t.pricePerKG),
          waste: toNumber(t.wasteWeight),
          takeWaste: t.takeWaste ? 'Yes' : 'No',
          total: toNumber(t.totalBill),
          status: t.paymentStatus,
        });
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    }

    // CSV fallback
    const headers = 'Invoice,Date,Type,Customer,Material,Weight,Price/KG,Waste,Total,Status\n';
    const rows = data
      .map(
        (t) =>
          `${t.invoiceNumber},${t.invoiceDate.toISOString().split('T')[0]},${t.type},${t.customer?.name || ''},${t.materialType},${toNumber(t.weight)},${toNumber(t.pricePerKG)},${toNumber(t.wasteWeight)},${toNumber(t.totalBill)},${t.paymentStatus}`
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
    return res.send(headers + rows);
  } catch (err) {
    console.error('Export report error:', err);
    return error(res, 'Failed to export report');
  }
};

module.exports = { dailyReport, monthlyReport, customerReport, materialReport, exportReport };
