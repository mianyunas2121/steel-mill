const prisma = require('../config/database');
const { success, error } = require('../utils/response');

const DEFAULT_SETTINGS = {
  companyName: process.env.COMPANY_NAME || 'Steel Mill Management System',
  companyAddress: process.env.COMPANY_ADDRESS || '',
  companyGST: process.env.COMPANY_GST || '',
  companyEmail: process.env.COMPANY_EMAIL || '',
  companyPhone: process.env.COMPANY_PHONE || '',
  bankName: '',
  bankAccount: '',
  bankIFSC: '',
  lowStockThreshold: '100',
};

const getSettings = async (req, res) => {
  try {
    const rows = await prisma.settings.findMany();
    const settings = { ...DEFAULT_SETTINGS };
    rows.forEach((r) => {
      settings[r.key] = r.value;
    });
    return success(res, settings);
  } catch (err) {
    console.error('Get settings error:', err);
    return error(res, 'Failed to fetch settings');
  }
};

const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    const allowed = Object.keys(DEFAULT_SETTINGS);

    for (const [key, value] of Object.entries(updates)) {
      if (allowed.includes(key) || key.startsWith('smtp') || key.startsWith('bank')) {
        await prisma.settings.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
      }
    }

    const rows = await prisma.settings.findMany();
    const settings = { ...DEFAULT_SETTINGS };
    rows.forEach((r) => {
      settings[r.key] = r.value;
    });

    return success(res, settings, 'Settings updated successfully');
  } catch (err) {
    console.error('Update settings error:', err);
    return error(res, 'Failed to update settings');
  }
};

const exportAllData = async (req, res) => {
  try {
    const [customers, transactions, inventory, payments, pricing] = await Promise.all([
      prisma.customer.findMany({ where: { isDeleted: false } }),
      prisma.transaction.findMany(),
      prisma.inventory.findMany(),
      prisma.payment.findMany(),
      prisma.pricing.findMany(),
    ]);

    return success(res, {
      exportedAt: new Date().toISOString(),
      customers,
      transactions,
      inventory,
      payments,
      pricing,
    }, 'Data exported successfully');
  } catch (err) {
    console.error('Export data error:', err);
    return error(res, 'Failed to export data');
  }
};

module.exports = { getSettings, updateSettings, exportAllData };
