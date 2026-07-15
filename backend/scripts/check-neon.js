const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const db = await prisma.$queryRaw`SELECT current_database() AS db, inet_server_addr()::text AS host`;
  const users = await prisma.user.count();
  const customers = await prisma.customer.count();
  const transactions = await prisma.transaction.count();
  const payments = await prisma.payment.count();
  console.log('Connected to Neon PostgreSQL');
  console.log(db);
  console.log({ users, customers, transactions, payments });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
