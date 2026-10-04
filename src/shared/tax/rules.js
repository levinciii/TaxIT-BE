/**
 * Philippine tax rules used by the engine.
 *
 * IMPORTANT: These are configuration, not law. Have a Philippine CPA verify
 * them before production use, and add a new rule set (do not edit old ones)
 * whenever the BIR/Congress changes rates, so past years stay reproducible.
 *
 * Bracket shape: { over, upTo (null = open-ended), base (fixed tax at `over`), rate (marginal) }
 */

/** Graduated rates under TRAIN for 2023 onwards; 3% percentage tax restored from July 2023. */
const PH_RULES_2023 = {
  id: 'PH-2023',
  effectiveFromYear: 2023,
  eightPercent: { rate: '0.08', deduction: '250000' },
  graduated: [
    { over: '0', upTo: '250000', base: '0', rate: '0' },
    { over: '250000', upTo: '400000', base: '0', rate: '0.15' },
    { over: '400000', upTo: '800000', base: '22500', rate: '0.20' },
    { over: '800000', upTo: '2000000', base: '102500', rate: '0.25' },
    { over: '2000000', upTo: '8000000', base: '402500', rate: '0.30' },
    { over: '8000000', upTo: null, base: '2202500', rate: '0.35' },
  ],
  /** Optional Standard Deduction, as a share of gross receipts. */
  osdRate: '0.40',
  /** Percentage tax for non-VAT taxpayers not on the 8% option. */
  percentageTaxRate: '0.03',
  vatRate: '0.12',
  vatThreshold: '3000000',
};

const RULE_SETS = [PH_RULES_2023];

function getRules(year) {
  const applicable = RULE_SETS.filter((r) => r.effectiveFromYear <= year).sort(
    (a, b) => b.effectiveFromYear - a.effectiveFromYear,
  );
  if (applicable.length === 0) throw new Error(`No tax rules available for year ${year}`);
  return applicable[0];
}

export { PH_RULES_2023, getRules };
