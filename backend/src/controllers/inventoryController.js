const prisma = require('../config/database');
const { success, error } = require('../utils/response');
const { toNumber } = require('../utils/calculations');

const getInventory = async (req, res) => {
  try {
    const inventory = await prisma.inventory.findMany({
      orderBy: { materialType: 'asc' },
    });

    // Get latest prices for value calculation
    const materials = inventory.map((i) => i.materialType);
    const prices = await prisma.pricing.findMany({
      where: {
        materialType: { in: materials },
        OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
      },
      orderBy: { validFrom: 'desc' },
    });

    const priceMap = {};
    prices.forEach((p) => {
      if (!priceMap[p.materialType]) {
        priceMap[p.materialType] = toNumber(p.pricePerKG);
      }
    });

    // Calculate max stock for low stock threshold (use historical max or current * 10 as baseline)
    const result = inventory.map((item) => {
      const stock = toNumber(item.currentStock);
      const price = priceMap[item.materialType] || 0;
      const value = Math.round(stock * price * 100) / 100;
      // Low stock if below 100 KG as default threshold, or configurable
      const lowStockThreshold = 100;
      const isLowStock = stock < lowStockThreshold && stock > 0;
      const isOutOfStock = stock <= 0;

      return {
        ...item,
        currentStock: stock,
        pricePerKG: price,
        value,
        isLowStock,
        isOutOfStock,
        lowStockThreshold,
      };
    });

    return success(res, result);
  } catch (err) {
    console.error('Get inventory error:', err);
    return error(res, 'Failed to fetch inventory');
  }
};

const updateInventory = async (req, res) => {
  try {
    const { currentStock } = req.body;
    if (currentStock === undefined || currentStock < 0) {
      return error(res, 'Valid currentStock is required', 400);
    }

    const item = await prisma.inventory.findUnique({ where: { id: req.params.id } });
    if (!item) {
      return error(res, 'Inventory item not found', 404);
    }

    const updated = await prisma.inventory.update({
      where: { id: req.params.id },
      data: { currentStock },
    });

    return success(
      res,
      { ...updated, currentStock: toNumber(updated.currentStock) },
      'Inventory updated successfully'
    );
  } catch (err) {
    console.error('Update inventory error:', err);
    return error(res, 'Failed to update inventory');
  }
};

const getInventoryTrend = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const transactions = await prisma.transaction.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        type: true,
        materialType: true,
        weight: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const byDate = {};
    transactions.forEach((t) => {
      const date = t.createdAt.toISOString().split('T')[0];
      if (!byDate[date]) byDate[date] = { date, incoming: 0, outgoing: 0 };
      if (t.type === 'INCOMING') {
        byDate[date].incoming += toNumber(t.weight);
      } else {
        byDate[date].outgoing += toNumber(t.weight);
      }
    });

    return success(res, Object.values(byDate));
  } catch (err) {
    console.error('Inventory trend error:', err);
    return error(res, 'Failed to fetch inventory trend');
  }
};

module.exports = { getInventory, updateInventory, getInventoryTrend };
