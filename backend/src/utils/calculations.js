const prisma = require('../config/database');

/**
 * Generate invoice number: SMMS-YYMMDD-XXX
 */
const generateInvoiceNumber = async (date = new Date()) => {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const prefix = `SMMS-${yy}${mm}${dd}`;

  const lastInvoice = await prisma.transaction.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
  });

  let sequence = 1;
  if (lastInvoice) {
    const lastSeq = parseInt(lastInvoice.invoiceNumber.split('-').pop(), 10);
    sequence = lastSeq + 1;
  }

  return `${prefix}-${String(sequence).padStart(3, '0')}`;
};

/**
 * OUTGOING calculation:
 * - takeWaste=true  => totalBill = materialAmount + wasteAmount
 * - takeWaste=false => totalBill = materialAmount - wasteAmount (discount)
 */
const calculateOutgoing = ({ weight, pricePerKG, wasteWeight = 0, takeWaste = false }) => {
  const w = parseFloat(weight) || 0;
  const price = parseFloat(pricePerKG) || 0;
  const waste = parseFloat(wasteWeight) || 0;

  const materialAmount = round2(w * price);
  const wastePrice = price; // same as pricePerKG per business rules
  const wasteAmount = round2(waste * wastePrice);

  let totalBill;
  let discount = 0;

  if (takeWaste) {
    totalBill = round2(materialAmount + wasteAmount);
  } else {
    discount = wasteAmount;
    totalBill = round2(materialAmount - discount);
  }

  return {
    materialAmount,
    wastePrice,
    wasteAmount,
    discount,
    totalBill,
    takeWaste: Boolean(takeWaste),
  };
};

/**
 * INCOMING calculation: totalAmount = weight × pricePerKG
 */
const calculateIncoming = ({ weight, pricePerKG }) => {
  const w = parseFloat(weight) || 0;
  const price = parseFloat(pricePerKG) || 0;
  const totalBill = round2(w * price);
  return {
    materialAmount: totalBill,
    wasteWeight: 0,
    wastePrice: 0,
    wasteAmount: 0,
    totalBill,
    takeWaste: false,
  };
};

const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

const toNumber = (val) => (val === null || val === undefined ? 0 : parseFloat(val));

module.exports = {
  generateInvoiceNumber,
  calculateOutgoing,
  calculateIncoming,
  round2,
  toNumber,
};
