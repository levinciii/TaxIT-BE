import prisma from '../config/prisma.js';
import { D } from '../shared/money.js';
import { getRules } from '../shared/tax/rules.js';
import { computeIncomeTax, computePercentageTax, exceedsVatThreshold } from '../shared/tax/engine.js';
import * as transactionService from './transaction.service.js';

const TAX_DISCLAIMER =
  'Estimates only, assuming purely self-employed professional income. Review with your accountant before filing.';

async function incomeTax(userId, year) {
  const profile = await prisma.doctorProfile.findUnique({ where: { userId } });
  const option = profile?.incomeTaxOption ?? 'EIGHT_PERCENT';
  const vatRegistered = profile?.vatRegistered ?? false;

  const totals = await transactionService.quarterTotals(userId, year);
  const quarters = computeIncomeTax(option, year, totals).map((q, i) => ({
    ...q,
    percentageTax: computePercentageTax(option, vatRegistered, year, totals[i].gross),
  }));
  const annualGross = totals.reduce((sum, t) => sum.plus(t.gross), D(0));

  return {
    year,
    rulesId: getRules(year).id,
    incomeTaxOption: option,
    vatRegistered,
    annualGross: annualGross.toFixed(2),
    vatThresholdExceeded: exceedsVatThreshold(annualGross, year),
    quarters,
    disclaimer: TAX_DISCLAIMER,
  };
}

export { incomeTax };
