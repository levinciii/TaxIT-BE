import { D, Dec, money } from '../money.js';
import { getRules } from './rules.js';

const INCOME_TAX_OPTIONS = ['EIGHT_PERCENT', 'GRADUATED_OSD', 'GRADUATED_ITEMIZED'];

function graduatedTax(taxable, brackets) {
  const t = D(taxable);
  if (t.lte(0)) return D(0);
  for (const b of brackets) {
    const upper = b.upTo === null ? null : D(b.upTo);
    if (upper === null || t.lte(upper)) {
      return D(b.base).plus(t.minus(b.over).times(b.rate));
    }
  }
  throw new Error('Unreachable: brackets must end with an open-ended bracket');
}

/**
 * Cumulative income-tax computation for a professional (purely self-employed).
 * Assumes no compensation income and no other sources of income.
 *
 * @param {'EIGHT_PERCENT'|'GRADUATED_OSD'|'GRADUATED_ITEMIZED'} option
 * @param {number} year
 * @param {Array<{gross, expenses, withheld}>} quarters  1-4 entries of PER-QUARTER (not cumulative) totals.
 *        `withheld` = creditable withholding tax (e.g. BIR Form 2307). Q4 is treated as the annual return.
 * @returns one result per quarter: cumulative figures, `balance` (negative = excess credits),
 *          `payable` and `overpayment`, all as 2-dp strings.
 */
function computeIncomeTax(option, year, quarters) {
  if (quarters.length < 1 || quarters.length > 4) throw new Error('Provide between 1 and 4 quarters');
  const rules = getRules(year);
  const results = [];

  let cumGross = D(0);
  let cumExpenses = D(0);
  let cumWithheld = D(0);
  let previousPayments = D(0);

  quarters.forEach((q, i) => {
    cumGross = cumGross.plus(q.gross);
    cumExpenses = cumExpenses.plus(q.expenses);
    cumWithheld = cumWithheld.plus(q.withheld);

    let deductions;
    let due;
    let taxable;

    if (option === 'EIGHT_PERCENT') {
      deductions = Dec.min(cumGross, rules.eightPercent.deduction);
      taxable = Dec.max(0, cumGross.minus(rules.eightPercent.deduction));
      due = taxable.times(rules.eightPercent.rate);
    } else {
      deductions = option === 'GRADUATED_OSD' ? cumGross.times(rules.osdRate) : cumExpenses;
      taxable = Dec.max(0, cumGross.minus(deductions));
      due = graduatedTax(taxable, rules.graduated);
    }

    // Round the due amount to centavos before netting so every figure shown reconciles.
    const dueR = D(money(due));
    const balance = dueR.minus(money(cumWithheld)).minus(previousPayments);
    const payable = Dec.max(0, balance);
    const overpayment = Dec.max(0, balance.neg());

    results.push({
      quarter: i + 1,
      form: i === 3 ? '1701' : '1701Q', // 1701Q for Q1-Q3; annual 1701 reconciles the full year
      cumulativeGross: money(cumGross),
      cumulativeDeductions: money(deductions),
      cumulativeTaxableIncome: money(taxable),
      cumulativeTaxDue: money(dueR),
      cumulativeWithheld: money(cumWithheld),
      previousPayments: money(previousPayments),
      balance: money(balance),
      payable: money(payable),
      overpayment: money(overpayment),
    });

    previousPayments = previousPayments.plus(money(payable));
  });

  return results;
}

/** Quarterly percentage tax (BIR Form 2551Q). Not applicable to 8% filers or VAT-registered. */
function computePercentageTax(option, vatRegistered, year, quarterGross) {
  if (option === 'EIGHT_PERCENT' || vatRegistered) return money(0);
  return money(D(quarterGross).times(getRules(year).percentageTaxRate));
}

/** Gross receipts above the VAT threshold require VAT registration. */
function exceedsVatThreshold(annualGross, year) {
  return D(annualGross).gt(getRules(year).vatThreshold);
}

export { INCOME_TAX_OPTIONS, graduatedTax, computeIncomeTax, computePercentageTax, exceedsVatThreshold };
