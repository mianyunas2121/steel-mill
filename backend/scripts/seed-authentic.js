/**
 * Authentic business data seeder for SMMS
 * Realistic Indian scrap / steel mill trading data
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { calculateOutgoing, calculateIncoming, generateInvoiceNumber } = require('../src/utils/calculations');

const prisma = new PrismaClient();

const MATERIALS = [
  { materialType: 'Steel', pricePerKG: 52 },
  { materialType: 'Iron', pricePerKG: 38 },
  { materialType: 'Aluminum', pricePerKG: 165 },
  { materialType: 'Copper', pricePerKG: 720 },
  { materialType: 'Brass', pricePerKG: 405 },
];

const CUSTOMERS = [
  {
    name: 'Rajasthan Iron & Steel Works',
    contactNumber: '9829011456',
    email: 'purchase@risworks.in',
    address: 'Plot 14, Vishwakarma Industrial Area, Jaipur, Rajasthan - 302013',
    gstNumber: '08AABCR8821M1Z5',
  },
  {
    name: 'Gujarat Metal Traders Pvt Ltd',
    contactNumber: '9879543210',
    email: 'accounts@gujmetal.com',
    address: 'GIDC Phase-II, Vatva, Ahmedabad, Gujarat - 382445',
    gstNumber: '24AADCG4412K1ZV',
  },
  {
    name: 'Singh Scrap Depot',
    contactNumber: '9814012233',
    email: 'singhscrapdepot@gmail.com',
    address: 'Focal Point, Ludhiana, Punjab - 141010',
    gstNumber: '03AAPFS3390Q1Z2',
  },
  {
    name: 'Deccan Scrap Corporation',
    contactNumber: '9848015678',
    email: 'orders@deccanscrap.co.in',
    address: 'IDA Jeedimetla, Hyderabad, Telangana - 500055',
    gstNumber: '36AABCD2291R1Z8',
  },
  {
    name: 'Maharashtra Rolling Mills',
    contactNumber: '9822056789',
    email: 'store@mrrolling.com',
    address: 'MIDC Chakan, Pune, Maharashtra - 410501',
    gstNumber: '27AABCM7712P1Z9',
  },
  {
    name: 'Kolkata Non-Ferrous Exchange',
    contactNumber: '9830012345',
    email: 'trading@knfe.co.in',
    address: 'Howrah Industrial Estate, Howrah, West Bengal - 711104',
    gstNumber: '19AABCK5521L1Z3',
  },
  {
    name: 'Bharat Kabadi Suppliers',
    contactNumber: '9999888777',
    email: null,
    address: 'Sector 7, IMT Manesar, Gurugram, Haryana - 122050',
    gstNumber: null,
  },
  {
    name: 'South India Copper Agency',
    contactNumber: '9444011122',
    email: 'sales@sicopper.in',
    address: 'Ambattur Industrial Estate, Chennai, Tamil Nadu - 600058',
    gstNumber: '33AABCS8810N1ZA',
  },
];

const SUPPLIERS = [
  {
    name: 'Aligarh Re-Rolling Yard',
    contactNumber: '9412456789',
    email: 'dispatch@aligarhyard.in',
    address: 'Industrial Estate, Aligarh, Uttar Pradesh - 202001',
    gstNumber: '09AABCA1100A1Z7',
  },
  {
    name: 'Nagpur Heavy Scrap Co.',
    contactNumber: '9370123456',
    email: 'supply@nagpurscrap.com',
    address: 'Hingna Road MIDC, Nagpur, Maharashtra - 440016',
    gstNumber: '27AABCN3344B1Z1',
  },
  {
    name: 'Indore Metal Collection Hub',
    contactNumber: '9826019988',
    email: 'hub@indoremetal.in',
    address: 'Sanwer Road Industrial Area, Indore, Madhya Pradesh - 452015',
    gstNumber: '23AABCI6677C1Z4',
  },
];

function daysAgo(n, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 15 + (n % 40), 0, 0);
  return d;
}

async function ensureUsers() {
  const users = [
    { name: 'Rajesh Mehta', email: 'admin@steelmill.com', password: 'admin123', role: 'ADMIN' },
    { name: 'Amit Sharma', email: 'staff@steelmill.com', password: 'staff123', role: 'STAFF' },
    { name: 'Priya Desai', email: 'accountant@steelmill.com', password: 'account123', role: 'ACCOUNTANT' },
  ];

  const result = {};
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, status: 'ACTIVE', password: hash },
      create: { name: u.name, email: u.email, password: hash, role: u.role, status: 'ACTIVE' },
    });
    result[u.role] = user;
  }
  return result;
}

async function clearDummyData() {
  // Remove payments & transactions first (FK order)
  await prisma.payment.deleteMany({});
  await prisma.transaction.deleteMany({});

  // Soft-delete old dummy / test customers, then hard-clean all for clean authentic set
  await prisma.customer.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.pricing.deleteMany({});

  console.log('🧹 Cleared previous transactional & master data');
}

async function seedPricingAndOpeningStock() {
  for (const m of MATERIALS) {
    await prisma.pricing.create({
      data: {
        materialType: m.materialType,
        pricePerKG: m.pricePerKG,
        validFrom: daysAgo(60),
      },
    });
    // Realistic opening stock before any of our backdated txs — we'll set after txs
    await prisma.inventory.create({
      data: { materialType: m.materialType, currentStock: 0 },
    });
  }
  console.log('✅ Pricing set (current market rates)');
}

async function seedParties() {
  const customers = [];
  for (const c of CUSTOMERS) {
    customers.push(await prisma.customer.create({ data: { ...c, balance: 0 } }));
  }
  const suppliers = [];
  for (const s of SUPPLIERS) {
    suppliers.push(await prisma.customer.create({ data: { ...s, balance: 0 } }));
  }
  console.log(`✅ Parties: ${customers.length} customers, ${suppliers.length} suppliers`);
  return { customers, suppliers };
}

async function createIncoming({ supplierId, userId, materialType, weight, pricePerKG, date, notes }) {
  const calc = calculateIncoming({ weight, pricePerKG });
  const invoiceNumber = await generateInvoiceNumber(date);

  const tx = await prisma.transaction.create({
    data: {
      type: 'INCOMING',
      customerId: supplierId,
      createdByUserId: userId,
      materialType,
      weight,
      pricePerKG,
      materialAmount: calc.materialAmount,
      wasteWeight: 0,
      wastePrice: 0,
      wasteAmount: 0,
      takeWaste: false,
      totalBill: calc.totalBill,
      notes: notes || null,
      invoiceNumber,
      invoiceDate: date,
      paymentStatus: 'PAID',
      paidAmount: calc.totalBill,
      createdAt: date,
      updatedAt: date,
    },
  });

  await prisma.inventory.update({
    where: { materialType },
    data: { currentStock: { increment: weight } },
  });

  return tx;
}

async function createOutgoing({
  customerId,
  userId,
  materialType,
  weight,
  pricePerKG,
  wasteWeight,
  takeWaste,
  date,
  notes,
  payAmount,
  payMethod,
}) {
  const calc = calculateOutgoing({ weight, pricePerKG, wasteWeight, takeWaste });
  const invoiceNumber = await generateInvoiceNumber(date);

  const inv = await prisma.inventory.findUnique({ where: { materialType } });
  if (!inv || inv.currentStock < weight) {
    throw new Error(`Insufficient ${materialType} stock for outgoing on ${date.toISOString()}`);
  }

  const paid = payAmount != null ? Math.min(payAmount, calc.totalBill) : 0;
  let paymentStatus = 'PENDING';
  if (paid >= calc.totalBill - 0.01) paymentStatus = 'PAID';
  else if (paid > 0) paymentStatus = 'PARTIAL';

  const tx = await prisma.$transaction(async (db) => {
    const created = await db.transaction.create({
      data: {
        type: 'OUTGOING',
        customerId,
        createdByUserId: userId,
        materialType,
        weight,
        pricePerKG,
        materialAmount: calc.materialAmount,
        wasteWeight: wasteWeight || 0,
        wastePrice: calc.wastePrice,
        wasteAmount: calc.wasteAmount,
        takeWaste: Boolean(takeWaste),
        totalBill: calc.totalBill,
        notes: notes || null,
        invoiceNumber,
        invoiceDate: date,
        paymentStatus,
        paidAmount: paid,
        createdAt: date,
        updatedAt: date,
      },
    });

    await db.inventory.update({
      where: { materialType },
      data: { currentStock: { decrement: weight } },
    });

    const outstanding = calc.totalBill - paid;
    await db.customer.update({
      where: { id: customerId },
      data: { balance: { increment: outstanding } },
    });

    if (paid > 0) {
      await db.payment.create({
        data: {
          customerId,
          amount: paid,
          paymentMethod: payMethod || 'CASH',
          invoiceId: created.id,
          paymentDate: date,
          notes: 'Against invoice ' + invoiceNumber,
          createdAt: date,
        },
      });
    }

    return created;
  });

  return tx;
}

async function main() {
  console.log('\n🏭 Seeding AUTHENTIC steel mill business data...\n');

  await clearDummyData();
  const users = await ensureUsers();
  await seedPricingAndOpeningStock();
  const { customers, suppliers } = await seedParties();

  // Company settings
  const settings = [
    ['companyName', 'Ambika Steel & Scrap Yard'],
    ['companyAddress', 'Industrial Area, Plot 12, Ring Road, Lahore, Pakistan'],
    ['companyGST', '1234567-8'],
    ['companyEmail', 'office@ambikasteel.pk'],
    ['companyPhone', '+92-42-35123456'],
    ['bankName', 'Habib Bank Limited - Industrial Area Branch'],
    ['bankAccount', '1234-56789012-03'],
    ['bankIFSC', 'HABB0001234'],
    ['lowStockThreshold', '150'],
  ];
  for (const [key, value] of settings) {
    await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log('✅ Company profile: Ambika Steel & Scrap Yard (Lahore, PKR)');

  const staffId = users.STAFF.id;
  const adminId = users.ADMIN.id;

  // --- Incoming purchases (build stock first, older dates) ---
  const incomings = [
    { n: 28, s: 0, m: 'Steel', w: 4200, p: 50, note: 'MS scrap lot — truck GJ-01-AB-2291', h: 9 },
    { n: 26, s: 1, m: 'Iron', w: 3800, p: 36, note: 'CI casting scrap — 2 containers', h: 11 },
    { n: 24, s: 2, m: 'Aluminum', w: 850, p: 158, note: 'Extrusion scrap grade A', h: 10 },
    { n: 22, s: 0, m: 'Copper', w: 320, p: 695, note: 'Bare bright copper wire', h: 14 },
    { n: 20, s: 1, m: 'Brass', w: 610, p: 390, note: 'Honey brass turnings', h: 12 },
    { n: 18, s: 2, m: 'Steel', w: 2500, p: 51, note: 'HMS 1&2 mixed load', h: 9 },
    { n: 15, s: 0, m: 'Iron', w: 2100, p: 37, note: 'Foundry returns', h: 15 },
    { n: 12, s: 1, m: 'Aluminum', w: 440, p: 162, note: 'UBC / sheet mix', h: 10 },
    { n: 9, s: 2, m: 'Steel', w: 1800, p: 52, note: 'Plate cuttings from fabrication unit', h: 11 },
    { n: 6, s: 0, m: 'Copper', w: 185, p: 710, note: '#1 copper tubing', h: 13 },
    { n: 3, s: 1, m: 'Brass', w: 290, p: 400, note: 'Red brass valves scrap', h: 10 },
    { n: 1, s: 2, m: 'Iron', w: 1550, p: 38, note: 'Yesterday intake — weight slip #IS-8841', h: 8 },
  ];

  for (const row of incomings) {
    await createIncoming({
      supplierId: suppliers[row.s].id,
      userId: adminId,
      materialType: row.m,
      weight: row.w,
      pricePerKG: row.p,
      date: daysAgo(row.n, row.h),
      notes: row.note,
    });
  }
  console.log(`✅ Incoming purchases: ${incomings.length}`);

  // --- Outgoing sales ---
  const outgoings = [
    { n: 25, c: 0, m: 'Steel', w: 1200, p: 52, ww: 45, take: false, pay: 60000, method: 'BANK_TRANSFER', note: 'Jaipur site delivery — waste left at yard' },
    { n: 23, c: 1, m: 'Iron', w: 900, p: 38, ww: 30, take: true, pay: null, method: null, note: 'Vatva plant PO-GTP/884' },
    { n: 21, c: 2, m: 'Aluminum', w: 280, p: 165, ww: 8, take: false, pay: 45000, method: 'CASH', note: 'Ludhiana pickup by party vehicle' },
    { n: 19, c: 4, m: 'Steel', w: 1500, p: 52, ww: 55, take: true, pay: 78000, method: 'CHEQUE', note: 'Chakan MIDC — cheque #004521' },
    { n: 17, c: 3, m: 'Copper', w: 95, p: 720, ww: 2, take: false, pay: 68000, method: 'BANK_TRANSFER', note: 'Hyderabad cable job lot' },
    { n: 14, c: 5, m: 'Brass', w: 210, p: 405, ww: 12, take: true, pay: null, method: null, note: 'Howrah foundry order' },
    { n: 13, c: 7, m: 'Copper', w: 110, p: 720, ww: 3, take: false, pay: 79000, method: 'BANK_TRANSFER', note: 'Ambattur — full payment UTR HDFC92811' },
    { n: 11, c: 0, m: 'Iron', w: 750, p: 38, ww: 22, take: false, pay: 27000, method: 'CASH', note: 'Partial cash against RISW account' },
    { n: 10, c: 6, m: 'Steel', w: 480, p: 52, ww: 18, take: true, pay: 25000, method: 'CASH', note: 'Manesar kabadi — walk-in' },
    { n: 8, c: 1, m: 'Aluminum', w: 320, p: 165, ww: 10, take: false, pay: null, method: null, note: 'Credit sale — 15 days terms' },
    { n: 7, c: 4, m: 'Brass', w: 175, p: 405, ww: 7, take: false, pay: 70000, method: 'BANK_TRANSFER', note: 'Pune rolling mill remelt' },
    { n: 5, c: 2, m: 'Steel', w: 680, p: 52, ww: 25, take: true, pay: 36000, method: 'CHEQUE', note: 'Focal Point delivery' },
    { n: 4, c: 3, m: 'Iron', w: 1100, p: 38, ww: 40, take: false, pay: 40000, method: 'BANK_TRANSFER', note: 'Jeedimetla furnace feed' },
    { n: 2, c: 5, m: 'Aluminum', w: 150, p: 165, ww: 5, take: true, pay: 25000, method: 'CASH', note: 'Part payment collected at gate' },
    { n: 0, c: 0, m: 'Steel', w: 520, p: 52, ww: 15, take: false, pay: null, method: null, note: 'Today dispatch — RISW truck RJ-14-GC-4412' },
  ];

  for (const row of outgoings) {
    await createOutgoing({
      customerId: customers[row.c].id,
      userId: staffId,
      materialType: row.m,
      weight: row.w,
      pricePerKG: row.p,
      wasteWeight: row.ww,
      takeWaste: row.take,
      date: daysAgo(row.n, 11 + (row.n % 5)),
      notes: row.note,
      payAmount: row.pay,
      payMethod: row.method,
    });
  }
  console.log(`✅ Outgoing sales: ${outgoings.length}`);

  // Extra payment against older open balance (Gujarat Metal — iron sale unpaid partially)
  const openTx = await prisma.transaction.findFirst({
    where: { paymentStatus: { in: ['PENDING', 'PARTIAL'] }, type: 'OUTGOING' },
    orderBy: { invoiceDate: 'asc' },
    include: { customer: true },
  });
  if (openTx) {
    const due = openTx.totalBill - openTx.paidAmount;
    const extra = Math.min(due, Math.round(due * 0.4));
    if (extra > 0) {
      await prisma.$transaction(async (db) => {
        await db.payment.create({
          data: {
            customerId: openTx.customerId,
            amount: extra,
            paymentMethod: 'BANK_TRANSFER',
            invoiceId: openTx.id,
            paymentDate: daysAgo(1, 16),
            notes: 'Follow-up collection NEFT',
          },
        });
        const newPaid = openTx.paidAmount + extra;
        const status = newPaid >= openTx.totalBill - 0.01 ? 'PAID' : 'PARTIAL';
        await db.transaction.update({
          where: { id: openTx.id },
          data: { paidAmount: newPaid, paymentStatus: status },
        });
        await db.customer.update({
          where: { id: openTx.customerId },
          data: { balance: { decrement: extra } },
        });
      });
      console.log(`✅ Follow-up payment ₹${extra} on ${openTx.invoiceNumber}`);
    }
  }

  // Summary
  const summary = {
    customers: await prisma.customer.count(),
    transactions: await prisma.transaction.count(),
    payments: await prisma.payment.count(),
    inventory: await prisma.inventory.findMany({ orderBy: { materialType: 'asc' } }),
    receivables: await prisma.customer.aggregate({ _sum: { balance: true } }),
  };

  console.log('\n========== DATABASE READY ==========');
  console.log('Company : Shree Ambika Steel & Scrap Yard, Bhiwadi');
  console.log('Staff   : Rajesh Mehta (Admin), Amit Sharma (Staff), Priya Desai (Accounts)');
  console.log('Parties :', summary.customers);
  console.log('Invoices:', summary.transactions);
  console.log('Payments:', summary.payments);
  console.log('Receivables (outstanding): ₹', summary.receivables._sum.balance || 0);
  console.log('Stock:');
  summary.inventory.forEach((i) => console.log(`  ${i.materialType.padEnd(10)} ${i.currentStock} KG`));
  console.log('====================================\n');
  console.log('Login: admin@steelmill.com / admin123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
