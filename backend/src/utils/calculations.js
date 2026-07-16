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
 * - wasteAmount = wasteWeight × wastePricePerKG
 * - takeWaste=true  => grossBill = materialAmount + wasteAmount
 * - takeWaste=false => grossBill = materialAmount - wasteAmount (discount)
 * - advanceAmount is subtracted from gross → totalBill (amount due)
 */
const calculateOutgoing = ({
  weight,
  pricePerKG,
  wasteWeight = 0,
  wastePricePerKG,
  takeWaste = false,
  advanceAmount = 0,
}) => {
  const w = parseFloat(weight) || 0;
  const price = parseFloat(pricePerKG) || 0;
  const waste = parseFloat(wasteWeight) || 0;
  const wastePrice =
    wastePricePerKG === undefined || wastePricePerKG === null || wastePricePerKG === ''
      ? price
      : parseFloat(wastePricePerKG) || 0;

  const materialAmount = round2(w * price);
  const wasteAmount = round2(waste * wastePrice);

  let grossBill;
  let discount = 0;

  if (takeWaste) {
    grossBill = round2(materialAmount + wasteAmount);
  } else {
    discount = wasteAmount;
    grossBill = round2(materialAmount - discount);
  }

  const advance = round2(Math.max(0, parseFloat(advanceAmount) || 0));
  const appliedAdvance = round2(Math.min(advance, Math.max(0, grossBill)));
  const totalBill = round2(Math.max(0, grossBill - appliedAdvance));

  return {
    materialAmount,
    wastePrice,
    wasteAmount,
    discount,
    grossBill,
    advanceAmount: appliedAdvance,
    totalBill,
    takeWaste: Boolean(takeWaste),
  };
};

/**
 * INCOMING calculation: gross = weight × pricePerKG; advance reduces amount due
 */
const calculateIncoming = ({ weight, pricePerKG, advanceAmount = 0 }) => {
  const w = parseFloat(weight) || 0;
  const price = parseFloat(pricePerKG) || 0;
  const grossBill = round2(w * price);
  const advance = round2(Math.max(0, parseFloat(advanceAmount) || 0));
  const appliedAdvance = round2(Math.min(advance, grossBill));
  const totalBill = round2(Math.max(0, grossBill - appliedAdvance));
  return {
    materialAmount: grossBill,
    wasteWeight: 0,
    wastePrice: 0,
    wasteAmount: 0,
    grossBill,
    advanceAmount: appliedAdvance,
    totalBill,
    takeWaste: false,
  };
};

const paymentStatusFor = (totalBill, paidAmount) => {
  const total = parseFloat(totalBill) || 0;
  const paid = parseFloat(paidAmount) || 0;
  if (total <= 0 || paid >= total) return 'PAID';
  if (paid > 0) return 'PARTIAL';
  return 'PENDING';
};

const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

const toNumber = (val) => (val === null || val === undefined ? 0 : parseFloat(val));

module.exports = {
  generateInvoiceNumber,
  calculateOutgoing,
  calculateIncoming,
  paymentStatusFor,
  round2,
  toNumber,
};
