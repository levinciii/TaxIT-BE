import prisma from '../config/prisma.js';

const toDto = (c) => ({ id: c.id, name: c.name, kind: c.kind, isCustom: c.userId !== null });

/** System defaults plus the user's own categories. */
async function list(userId) {
  const rows = await prisma.category.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    orderBy: [{ kind: 'asc' }, { name: 'asc' }],
  });
  return rows.map(toDto);
}

async function create(userId, { name, kind }) {
  const row = await prisma.category.create({ data: { userId, name, kind } });
  return toDto(row);
}

export { list, create };
