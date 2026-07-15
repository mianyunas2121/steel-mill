const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@steelmill.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@steelmill.com',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Admin user:', admin.email);

  // Staff user
  const staffPass = await bcrypt.hash('staff123', 12);
  await prisma.user.upsert({
    where: { email: 'staff@steelmill.com' },
    update: {},
    create: {
      name: 'Staff User',
      email: 'staff@steelmill.com',
      password: staffPass,
      role: 'STAFF',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Staff user: staff@steelmill.com');

  // Accountant
  const accPass = await bcrypt.hash('account123', 12);
  await prisma.user.upsert({
    where: { email: 'accountant@steelmill.com' },
    update: {},
    create: {
      name: 'Accountant User',
      email: 'accountant@steelmill.com',
      password: accPass,
      role: 'ACCOUNTANT',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Accountant: accountant@steelmill.com');

  // Sample customers
  const customers = [
    { name: 'ABC Steel Traders', contactNumber: '9876543210', email: 'abc@example.com', address: 'Mumbai, MH', gstNumber: '27AAAAA0000A1Z5' },
    { name: 'XYZ Metal Works', contactNumber: '9876543211', email: 'xyz@example.com', address: 'Pune, MH', gstNumber: '27BBBBB0000B1Z5' },
    { name: 'Iron Hub Suppliers', contactNumber: '9876543212', email: 'ironhub@example.com', address: 'Nagpur, MH' },
    { name: 'Metal Corp Ltd', contactNumber: '9876543213', email: 'metal@example.com', address: 'Delhi, DL', gstNumber: '07CCCCC0000C1Z5' },
    { name: 'Steel King Industries', contactNumber: '9876543214', address: 'Ahmedabad, GJ' },
  ];

  for (const c of customers) {
    const existing = await prisma.customer.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.customer.create({ data: c });
    }
  }
  console.log('✅ Sample customers created');

  // Pricing & Inventory
  const materials = [
    { materialType: 'Steel', pricePerKG: 55 },
    { materialType: 'Iron', pricePerKG: 40 },
    { materialType: 'Aluminum', pricePerKG: 180 },
    { materialType: 'Copper', pricePerKG: 750 },
    { materialType: 'Brass', pricePerKG: 420 },
  ];

  for (const m of materials) {
    const existingPrice = await prisma.pricing.findFirst({
      where: { materialType: m.materialType, validTo: null },
    });
    if (!existingPrice) {
      await prisma.pricing.create({
        data: { materialType: m.materialType, pricePerKG: m.pricePerKG },
      });
    }
    await prisma.inventory.upsert({
      where: { materialType: m.materialType },
      update: {},
      create: { materialType: m.materialType, currentStock: 1000 },
    });
  }
  console.log('✅ Pricing & inventory seeded');

  // Default settings
  const settings = [
    { key: 'companyName', value: 'Steel Mill Management System' },
    { key: 'companyAddress', value: 'Industrial Area, Phase-II, City - 000000' },
    { key: 'companyGST', value: '27AAAAA0000A1Z5' },
    { key: 'companyEmail', value: 'admin@steelmill.com' },
    { key: 'companyPhone', value: '+91-9876543210' },
    { key: 'bankName', value: 'State Bank of India' },
    { key: 'bankAccount', value: '1234567890' },
    { key: 'bankIFSC', value: 'SBIN0001234' },
    { key: 'lowStockThreshold', value: '100' },
  ];

  for (const s of settings) {
    await prisma.settings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
  console.log('✅ Settings seeded');

  console.log('\n🎉 Seed completed!');
  console.log('\nLogin credentials:');
  console.log('  Admin:      admin@steelmill.com / admin123');
  console.log('  Staff:      staff@steelmill.com / staff123');
  console.log('  Accountant: accountant@steelmill.com / account123\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
