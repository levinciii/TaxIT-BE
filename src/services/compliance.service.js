import prisma from '../config/prisma.js';
import { DEADLINE_DISCLAIMER, getFilingDeadlines } from '../shared/tax/deadlines.js';
import { daysBetween, todayManila } from '../shared/dates.js';

async function deadlines(userId, year) {
  const profile = await prisma.doctorProfile.findUnique({ where: { userId } });
  const today = todayManila();

  const items = getFilingDeadlines(year, {
    vatRegistered: profile?.vatRegistered ?? false,
    incomeTaxOption: profile?.incomeTaxOption ?? 'EIGHT_PERCENT',
  }).map((d) => {
    const daysUntilDue = daysBetween(today, d.dueDate);
    const status = daysUntilDue < 0 ? 'PAST' : daysUntilDue <= 14 ? 'DUE_SOON' : 'UPCOMING';
    return { ...d, daysUntilDue, status };
  });

  return { year, today, items, disclaimer: DEADLINE_DISCLAIMER };
}

export { deadlines };
