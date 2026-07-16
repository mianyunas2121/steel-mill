export const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatNumber = (num, decimals = 2) => {
  return new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(parseFloat(num) || 0);
};

export const formatCompactCurrency = (amount) => {
  const num = parseFloat(amount) || 0;
  if (Math.abs(num) >= 100000) {
    return `Rs ${(num / 100000).toFixed(1)}L`;
  }
  if (Math.abs(num) >= 1000) {
    return `Rs ${(num / 1000).toFixed(1)}k`;
  }
  return formatCurrency(num);
};

export const formatWeight = (kg) => `${formatNumber(kg, 3)} KG`;

export const calculateOutgoing = ({
  weight,
  pricePerKG,
  wasteWeight = 0,
  wastePricePerKG,
  takeWaste = false,
}) => {
  const w = parseFloat(weight) || 0;
  const price = parseFloat(pricePerKG) || 0;
  const waste = parseFloat(wasteWeight) || 0;
  const wastePrice =
    wastePricePerKG === undefined || wastePricePerKG === null || wastePricePerKG === ''
      ? price
      : parseFloat(wastePricePerKG) || 0;

  const materialAmount = Math.round(w * price * 100) / 100;
  const wasteAmount = Math.round(waste * wastePrice * 100) / 100;
  const totalBill = takeWaste
    ? Math.round((materialAmount + wasteAmount) * 100) / 100
    : Math.round((materialAmount - wasteAmount) * 100) / 100;

  return {
    materialAmount,
    wastePrice,
    wasteAmount,
    totalBill,
    discount: takeWaste ? 0 : wasteAmount,
  };
};

export const calculateIncoming = ({ weight, pricePerKG }) => {
  const total = Math.round((parseFloat(weight) || 0) * (parseFloat(pricePerKG) || 0) * 100) / 100;
  return { materialAmount: total, totalBill: total };
};

export const ROLE_LABELS = {
  ADMIN: 'Admin',
  STAFF: 'Staff',
  ACCOUNTANT: 'Accountant',
  VIEWER: 'Viewer',
};

/** @deprecated Prefer <StatusBadge status={...} /> — kept for compatibility */
export const STATUS_COLORS = {
  PAID: 'bg-status-successBg text-status-success',
  PARTIAL: 'bg-status-warningBg text-status-warning',
  PENDING: 'bg-status-dangerBg text-status-danger',
  ACTIVE: 'bg-status-successBg text-status-success',
  INACTIVE: 'bg-surface-sunken text-ink-muted',
  INCOMING: 'bg-status-infoBg text-status-info',
  OUTGOING: 'bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-300',
};
