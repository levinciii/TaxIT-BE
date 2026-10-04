const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const DEADLINE_DISCLAIMER =
  'Nominal statutory dates. Dates falling on weekends/holidays or extended by the BIR may differ; confirm with your accountant.';

/** Deadlines for tax year `year` (the annual return falls in year + 1). Dates are nominal, ISO YYYY-MM-DD. */
function getFilingDeadlines(year, { vatRegistered, incomeTaxOption }) {
  const list = [
    { form: '1701Q', label: 'Quarterly income tax', period: `Q1 ${year}`, dueDate: iso(year, 5, 15) },
    { form: '1701Q', label: 'Quarterly income tax', period: `Q2 ${year}`, dueDate: iso(year, 8, 15) },
    { form: '1701Q', label: 'Quarterly income tax', period: `Q3 ${year}`, dueDate: iso(year, 11, 15) },
    { form: '1701', label: 'Annual income tax return', period: `FY ${year}`, dueDate: iso(year + 1, 4, 15) },
  ];

  const quarterlyEnd = [
    [`Q1 ${year}`, year, 4],
    [`Q2 ${year}`, year, 7],
    [`Q3 ${year}`, year, 10],
    [`Q4 ${year}`, year + 1, 1],
  ];

  if (vatRegistered) {
    for (const [period, y, m] of quarterlyEnd) {
      list.push({ form: '2550Q', label: 'Quarterly VAT return', period, dueDate: iso(y, m, 25) });
    }
  } else if (incomeTaxOption !== 'EIGHT_PERCENT') {
    for (const [period, y, m] of quarterlyEnd) {
      list.push({ form: '2551Q', label: 'Quarterly percentage tax', period, dueDate: iso(y, m, 25) });
    }
  }

  return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export { DEADLINE_DISCLAIMER, getFilingDeadlines };
