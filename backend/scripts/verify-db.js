const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const customers = await prisma.customer.count({ where: { isDeleted: false } });
  const transactions = await prisma.transaction.count();
  const payments = await prisma.payment.count();
  const inventory = await prisma.inventory.findMany({ orderBy: { materialType: 'asc' } });
  const latestTx = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { customer: { select: { name: true } } },
  });
  const testCust = await prisma.customer.findFirst({
    where: { name: { contains: 'DB Test Customer' } },
    orderBy: { createdAt: 'desc' },
  });

  console.log('=== DIRECT SQLITE READ (prisma/dev.db) ===');
  console.log('Users:', users);
  console.log('Customers:', customers);
  console.log('Transactions:', transactions);
  console.log('Payments:', payments);
  console.log('Inventory:');
  inventory.forEach((i) => console.log(`  - ${i.materialType}: ${i.currentStock} KG`));
  console.log('Latest transactions:');
  latestTx.forEach((t) =>
    console.log(`  - ${t.invoiceNumber} | ${t.type} | ${t.customer.name} | Rs ${t.totalBill}`)
  );
  if (testCust) {
    console.log(`Test customer: ${testCust.name} | balance: ${testCust.balance}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
