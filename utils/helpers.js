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

export const calculateOutgoing = ({ weight, pricePerKG, wasteWeight = 0, takeWaste = false }) => {
  const w = parseFloat(weight) || 0;
  const price = parseFloat(pricePerKG) || 0;
  const waste = parseFloat(wasteWeight) || 0;

  const materialAmount = Math.round(w * price * 100) / 100;
  const wasteAmount = Math.round(waste * price * 100) / 100;
  const totalBill = takeWaste
    ? Math.round((materialAmount + wasteAmount) * 100) / 100
    : Math.round((materialAmount - wasteAmount) * 100) / 100;

  return { materialAmount, wasteAmount, totalBill, discount: takeWaste ? 0 : wasteAmount };
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

export const STATUS_COLORS = {
  PAID: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  PARTIAL: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
  PENDING: 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20',
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
  INACTIVE: 'bg-slate-100 text-slate-600 ring-1 ring-slate-500/10',
  INCOMING: 'bg-sky-50 text-sky-700 ring-1 ring-sky-600/20',
  OUTGOING: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20',
};
