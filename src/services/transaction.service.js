import prisma from '../config/prisma.js';
import { badRequest, notFound } from '../shared/errors.js';
import { D } from '../shared/money.js';
import { fromDateOnly, toDateOnly } from '../shared/dates.js';
import * as audit from './audit.service.js';

/** Money as 2-dp strings and dates as YYYY-MM-DD, so the JSON is stable for every client. */
const toDto = (t) => ({
  id: t.id,
  kind: t.kind,
  categoryId: t.categoryId,
  date: toDateOnly(t.date),
  amount: t.amount.toFixed(2),
  withheldTax: t.withheldTax.toFixed(2),
  description: t.description,
  counterparty: t.counterparty,
  receiptKey: t.receiptKey,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});

const QUARTER_RANGES = [
  ['01-01', '03-31'],
  ['04-01', '06-30'],
  ['07-01', '09-30'],
  ['10-01', '12-31'],
];

async function assertValid(userId, input) {
  if (input.kind === 'EXPENSE' && !D(input.withheldTax).isZero()) {
    throw badRequest('withheldTax applies to income only');
  }
  if (input.kind === 'INCOME' && D(input.withheldTax).gt(input.amount)) {
    throw badRequest('withheldTax cannot exceed the amount');
  }
  if (input.categoryId) {
    const cat = await prisma.category.findFirst({
      where: { id: input.categoryId, OR: [{ userId: null }, { userId }] },
      select: { kind: true },
    });
    if (!cat) throw badRequest('Unknown category');
    if (cat.kind !== input.kind) throw badRequest('Category kind does not match transaction kind');
  }
}

async function list(userId, q) {
  const where = {
    userId,
    deletedAt: null,
    ...(q.kind ? { kind: q.kind } : {}),
    ...(q.from || q.to
      ? { date: { ...(q.from ? { gte: fromDateOnly(q.from) } : {}), ...(q.to ? { lte: fromDateOnly(q.to) } : {}) } }
      : {}),
  };
  const [total, rows] = await prisma.$transaction([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
  ]);
  return { items: rows.map(toDto), page: q.page, pageSize: q.pageSize, total };
}

async function create(userId, input) {
  await assertValid(userId, input);
  const row = await prisma.transaction.create({
    data: {
      userId,
      kind: input.kind,
      categoryId: input.categoryId,
      date: fromDateOnly(input.date),
      amount: input.amount,
      withheldTax: input.withheldTax,
      description: input.description,
      counterparty: input.counterparty,
      receiptKey: input.receiptKey,
    },
  });
  await audit.log(userId, 'transaction.create', 'transaction', row.id, {
    kind: row.kind,
    amount: row.amount.toFixed(2),
    date: toDateOnly(row.date),
  });
  return toDto(row);
}

async function update(userId, id, input) {
  await assertValid(userId, input);
  const existing = await prisma.transaction.findFirst({ where: { id, userId, deletedAt: null } });
  if (!existing) throw notFound('Transaction not found');
  const row = await prisma.transaction.update({
    where: { id },
    data: {
      kind: input.kind,
      categoryId: input.categoryId ?? null,
      date: fromDateOnly(input.date),
      amount: input.amount,
      withheldTax: input.withheldTax,
      description: input.description ?? null,
      counterparty: input.counterparty ?? null,
      receiptKey: input.receiptKey ?? null,
    },
  });
  await audit.log(userId, 'transaction.update', 'transaction', id, {
    kind: row.kind,
    amount: row.amount.toFixed(2),
    date: toDateOnly(row.date),
  });
  return toDto(row);
}

/** Soft delete so the audit trail and books stay reconstructable. */
async function remove(userId, id) {
  const { count } = await prisma.transaction.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (count === 0) throw notFound('Transaction not found');
  await audit.log(userId, 'transaction.delete', 'transaction', id);
}

/** Per-quarter totals for a calendar year (always 4 entries, Q1..Q4), as 2-dp strings. */
function quarterTotals(userId, year) {
  return Promise.all(
    QUARTER_RANGES.map(async ([start, end]) => {
      const groups = await prisma.transaction.groupBy({
        by: ['kind'],
        where: {
          userId,
          deletedAt: null,
          date: { gte: fromDateOnly(`${year}-${start}`), lte: fromDateOnly(`${year}-${end}`) },
        },
        _sum: { amount: true, withheldTax: true },
      });
      const income = groups.find((g) => g.kind === 'INCOME');
      const expense = groups.find((g) => g.kind === 'EXPENSE');
      return {
        gross: D(income?._sum.amount?.toString() ?? 0).toFixed(2),
        withheld: D(income?._sum.withheldTax?.toString() ?? 0).toFixed(2),
        expenses: D(expense?._sum.amount?.toString() ?? 0).toFixed(2),
      };
    }),
  );
}

export { list, create, update, remove, quarterTotals };
