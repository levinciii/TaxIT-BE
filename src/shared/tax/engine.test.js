import test from 'node:test';
import assert from 'node:assert/strict';
import { computeIncomeTax, computePercentageTax, graduatedTax, exceedsVatThreshold } from './engine.js';
import { getRules } from './rules.js';
import { getFilingDeadlines } from './deadlines.js';

const brackets = getRules(2024).graduated;
const q = (gross, expenses = 0, withheld = 0) => ({ gross, expenses, withheld });

test('graduatedTax (2023+ brackets)', () => {
  const cases = [
    [0, '0'],
    [250000, '0'],
    [400000, '22500'],
    [800000, '102500'],
    [2000000, '402500'],
    [8000000, '2202500'],
    [10000000, '2902500'],
  ];
  for (const [taxable, expected] of cases) {
    assert.equal(graduatedTax(taxable, brackets).toFixed(0), expected, `taxable ${taxable}`);
  }
});

test('8% option applies the 250k deduction once, cumulatively', () => {
  const r = computeIncomeTax('EIGHT_PERCENT', 2024, [q(300000), q(300000), q(300000), q(300000)]);
  assert.equal(r[0].payable, '4000.00'); // 8% x (300k - 250k)
  assert.equal(r[1].cumulativeTaxDue, '28000.00'); // 8% x (600k - 250k)
  assert.equal(r[1].payable, '24000.00');
  assert.equal(r[2].payable, '24000.00');
  assert.equal(r[3].form, '1701');
  assert.equal(r[3].cumulativeTaxDue, '76000.00'); // 8% x (1.2M - 250k)
  assert.equal(r[3].payable, '24000.00');
});

test('8% option is zero while gross receipts stay under 250k', () => {
  const r = computeIncomeTax('EIGHT_PERCENT', 2024, [q(100000), q(100000)]);
  assert.equal(r[1].payable, '0.00');
});

test('8% option credits withholding tax and carries excess forward', () => {
  const r = computeIncomeTax('EIGHT_PERCENT', 2024, [q(300000, 0, 10000), q(0)]);
  // Q1 due 4,000 but withheld 10,000 -> overpayment 6,000, nothing payable
  assert.equal(r[0].payable, '0.00');
  assert.equal(r[0].overpayment, '6000.00');
  // Excess credit still available in Q2
  assert.equal(r[1].balance, '-6000.00');
});

test('graduated OSD takes 40% of gross', () => {
  const r = computeIncomeTax('GRADUATED_OSD', 2024, [q(1000000)]);
  assert.equal(r[0].cumulativeDeductions, '400000.00');
  assert.equal(r[0].cumulativeTaxableIncome, '600000.00');
  assert.equal(r[0].cumulativeTaxDue, '62500.00'); // 22,500 + 20% x 200k
});

test('graduated itemized uses actual expenses', () => {
  const r = computeIncomeTax('GRADUATED_ITEMIZED', 2024, [q(1000000, 600000)]);
  assert.equal(r[0].cumulativeTaxableIncome, '400000.00');
  assert.equal(r[0].cumulativeTaxDue, '22500.00');
});

test('percentage tax is 3% for non-VAT graduated filers', () => {
  assert.equal(computePercentageTax('GRADUATED_OSD', false, 2024, 100000), '3000.00');
});

test('percentage tax is zero for 8% filers and VAT-registered', () => {
  assert.equal(computePercentageTax('EIGHT_PERCENT', false, 2024, 100000), '0.00');
  assert.equal(computePercentageTax('GRADUATED_OSD', true, 2024, 100000), '0.00');
});

test('VAT threshold flags gross above 3M', () => {
  assert.equal(exceedsVatThreshold(3000000, 2024), false);
  assert.equal(exceedsVatThreshold(3000000.01, 2024), true);
});

test('deadlines: 8% filers have no percentage-tax deadlines', () => {
  const d = getFilingDeadlines(2024, { vatRegistered: false, incomeTaxOption: 'EIGHT_PERCENT' });
  assert.deepEqual(d.map((x) => x.form), ['1701Q', '1701Q', '1701Q', '1701']);
  assert.equal(d[3].dueDate, '2025-04-15');
});

test('deadlines: VAT filers get 2550Q', () => {
  const d = getFilingDeadlines(2024, { vatRegistered: true, incomeTaxOption: 'GRADUATED_OSD' });
  assert.equal(d.filter((x) => x.form === '2550Q').length, 4);
});
