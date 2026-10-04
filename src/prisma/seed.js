import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const SYSTEM_CATEGORIES = [
  { name: 'Professional fees', kind: 'INCOME' },
  { name: 'Hospital / clinic fees', kind: 'INCOME' },
  { name: 'Retainer', kind: 'INCOME' },
  { name: 'Other income', kind: 'INCOME' },
  { name: 'Clinic rent', kind: 'EXPENSE' },
  { name: 'Medical supplies', kind: 'EXPENSE' },
  { name: 'Equipment', kind: 'EXPENSE' },
  { name: 'Professional dues & licenses', kind: 'EXPENSE' },
  { name: 'Salaries & wages', kind: 'EXPENSE' },
  { name: 'Utilities', kind: 'EXPENSE' },
  { name: 'Transportation', kind: 'EXPENSE' },
  { name: 'Other expense', kind: 'EXPENSE' },
];

// Placeholder pricing - set your own before launch.
const PLANS = [
  { code: 'LITE', name: 'Lite', price: '899.00', billingPeriod: 'QUARTER', description: 'Residency, fellowship, or no income for an extended period' },
  { code: 'STANDARD', name: 'Standard', price: '2899.00', billingPeriod: 'QUARTER', description: 'Most doctors earning under PHP 3M' },
  { code: 'VAT', name: 'VAT', price: '3500.00', billingPeriod: 'MONTH', description: 'VAT-registered doctors' },
];

async function main() {
  for (const c of SYSTEM_CATEGORIES) {
    // System categories have userId NULL, which can't be used in an upsert key, so check first.
    const existing = await prisma.category.findFirst({ where: { userId: null, name: c.name, kind: c.kind } });
    if (!existing) await prisma.category.create({ data: c });
  }
  for (const p of PLANS) {
    await prisma.plan.upsert({ where: { code: p.code }, create: p, update: p });
  }
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
