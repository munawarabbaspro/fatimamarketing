// Arithmetic check of every payment-plan row: down payment + confirmation + installments must equal the price.
// node tools/uat/check_plans.mjs
import { plans } from '../../src/data/plans.mjs';
const n = (s) => Number(String(s).split('(')[0].replace(/[^0-9]/g, ''));
let bad = 0, rows = 0;
const ok = (label, expect, got, tol = 0.001) => {
  rows++; const diff = Math.abs(expect - got) / expect;
  if (diff > tol) { bad++; console.log(`✗ ${label}: price ${expect.toLocaleString()} vs schedule ${got.toLocaleString()}`); }
};
for (const p of plans) {
  const h = p.head.join('|');
  for (const r of p.rows) {
    const L = `${p.slug} · ${r[0]}`;
    if (/12 quarterly/.test(h) && p.head.length === 5 && p.slug !== 'district-one-commercial') ok(L, n(r[1]), n(r[2]) + n(r[3]) + 12 * n(r[4]));
    else if (p.slug === 'overseas-prime-commercial') ok(L, n(r[1]), 10 * n(r[2]));
    else if (p.slug === 'overseas-prime-ii-residential') ok(L, n(r[1]), n(r[2]) + n(r[3]) + 42 * n(r[4]) + 7 * n(r[5]), 0.002);
    else if (p.slug === 'phase-3-pre-launch-residential') {
      const [b1, c1] = r[3].split('/').map(n), [b2, c2] = r[6].split('/').map(n);
      ok(L + ' (opt 1)', n(r[2]), b1 + c1 + 18 * n(r[4]), 0.002); ok(L + ' (opt 2)', n(r[5]), b2 + c2 + 18 * n(r[7]), 0.002);
    } else if (p.slug === 'residential-villas') ok(L, n(r[1]), n(r[3]) + 8 * n(r[4]));
    else if (p.slug === 'harmony-park-the-villas') ok(L, n(r[1]), n(r[2]) + n(r[3]) + 24 * n(r[4]) + 4 * n(r[5]), 0.002);
    else if (p.slug === 'one-capital-residences-jade-tower') { ok(L + ' (area×rate)', n(r[3]), n(r[1]) * n(r[2])); ok(L, n(r[3]), n(r[4]) + n(r[5]) + 40 * n(r[6]) + 8 * n(r[7]) + n(r[8])); }
    else if (p.slug === 'district-one-commercial') { ok(L + ' (2y)', n(r[1]), n(r[2]) + 8 * n(r[3])); ok(L + ' (3y)', n(r[1]), n(r[2]) + 12 * n(r[4]), 0.002); }
    else if (p.slug === 'overseas-central-lake-view-commercial') ok(L, n(r[1]), n(r[2]) + n(r[3]) + 8 * n(r[4]));
  }
  if (p.slug === 'hamilton-hills-by-axis') {
    for (const c of [1, 2, 3]) {
      const sum = p.rows.slice(0, -1).reduce((a, r) => a + n(r[c]), 0); ok(`${p.slug} · ${p.head[c].split('·')[0]}`, n(p.rows.at(-1)[c]), sum);
      for (const r of p.rows) { const m = r[c].match(/\(([\d,]+) × (\d+)\)/); if (m) ok(`${p.slug} · ${r[0]} col ${c}`, n(r[c]), n(m[1]) * +m[2]); }
    }
  }
}
console.log(`${rows - bad}/${rows} plan rows add up${bad ? '' : ' ✓'}`);
process.exit(bad ? 1 : 0);
