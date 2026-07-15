const prisma = require('../config/database');
const { success, error } = require('../utils/response');
const { toNumber } = require('../utils/calculations');

const getPricing = async (req, res) => {
  try {
    const { materialType, current } = req.query;
    const where = {};

    if (materialType) where.materialType = materialType;

    if (current === 'true') {
      where.OR = [{ validTo: null }, { validTo: { gte: new Date() } }];
      where.validFrom = { lte: new Date() };
    }

    const pricing = await prisma.pricing.findMany({
      where,
      orderBy: [{ materialType: 'asc' }, { validFrom: 'desc' }],
    });

    // If current=true, return only latest per material
    if (current === 'true') {
      const latest = {};
      pricing.forEach((p) => {
        if (!latest[p.materialType]) {
          latest[p.materialType] = { ...p, pricePerKG: toNumber(p.pricePerKG) };
        }
      });
      return success(res, Object.values(latest));
    }

    return success(
      res,
      pricing.map((p) => ({ ...p, pricePerKG: toNumber(p.pricePerKG) }))
    );
  } catch (err) {
    console.error('Get pricing error:', err);
    return error(res, 'Failed to fetch pricing');
  }
};

const createPricing = async (req, res) => {
  try {
    const { materialType, pricePerKG, validFrom, validTo } = req.body;

    // Close previous open pricing for this material
    await prisma.pricing.updateMany({
      where: {
        materialType,
        validTo: null,
      },
      data: {
        validTo: validFrom ? new Date(validFrom) : new Date(),
      },
    });

    const pricing = await prisma.pricing.create({
      data: {
        materialType,
        pricePerKG,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validTo: validTo ? new Date(validTo) : null,
      },
    });

    // Ensure inventory entry exists
    await prisma.inventory.upsert({
      where: { materialType },
      update: {},
      create: { materialType, currentStock: 0 },
    });

    return success(
      res,
      { ...pricing, pricePerKG: toNumber(pricing.pricePerKG) },
      'Pricing created successfully',
      201
    );
  } catch (err) {
    console.error('Create pricing error:', err);
    return error(res, 'Failed to create pricing');
  }
};

const updatePricing = async (req, res) => {
  try {
    const { pricePerKG, validFrom, validTo } = req.body;
    const existing = await prisma.pricing.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return error(res, 'Pricing not found', 404);
    }

    const data = {};
    if (pricePerKG !== undefined) data.pricePerKG = pricePerKG;
    if (validFrom) data.validFrom = new Date(validFrom);
    if (validTo !== undefined) data.validTo = validTo ? new Date(validTo) : null;

    const pricing = await prisma.pricing.update({
      where: { id: req.params.id },
      data,
    });

    return success(
      res,
      { ...pricing, pricePerKG: toNumber(pricing.pricePerKG) },
      'Pricing updated successfully'
    );
  } catch (err) {
    console.error('Update pricing error:', err);
    return error(res, 'Failed to update pricing');
  }
};

module.exports = { getPricing, createPricing, updatePricing };
