// Available units: The Pearl and ICON VIII, Mumtaz City. Transcribed from the 16 unit sheets the owner sent on
// 10 Nov 2026 (originals: "New List" folder → assets/units/unit-01..16.webp). Every row is verified by
// tools/uat/check_plans.mjs: size × rate = total; 25% booking + 10% possession + 65% instalments = total;
// 60 monthly or 20 quarterly instalments = the 65%.
// Floors follow the unit number (A-945 = 9th floor). Two sheets disagree with their own unit number
// (A-1341 says 10th, A-1125 says 13th); the unit-number floor is shown. Client to confirm.
// To update: edit, remove (sold) or add rows, then rebuild.

export const inventoryAsOf = '10 November 2026';

export const towers = {
  'the-pearl': { name: 'The Pearl', poster: 'pearl-1', anchor: 'the-pearl', note: 'High-rise on Mumtaz City’s main commercial frontage' },
  'icon-viii': { name: 'ICON VIII', poster: 'unit-icon-viii', anchor: 'icon-viii', note: 'Main-road residential tower, 7th floor' },
};

// [sheet, tower, type, unit, floor, sqft, rate, total, booking25, possession10, instalments65, monthly60, quarterly20, tag]
const rows = [
  [1, 'icon-viii', '1 Bedroom', '713', 7, 597, 15400, 9193800, 2298450, 919380, 5975970, 99600, 298799, ''],
  [2, 'icon-viii', '1 Bedroom', '715', 7, 586, 15400, 9024400, 2256100, 902440, 5865860, 97764, 293293, ''],
  [3, 'icon-viii', '1 Bedroom', '717', 7, 568, 15400, 8747200, 2186800, 874720, 5685680, 94761, 284284, 'Main road'],
  [4, 'icon-viii', '1 Bedroom', '719', 7, 593, 15400, 9132200, 2283050, 913220, 5935930, 98932, 296797, 'Main road'],
  [5, 'the-pearl', '2 Bedroom', 'A-945', 9, 1441.26, 15500, 22339530, 5584883, 2233953, 14520695, 242012, 726035, ''],
  [6, 'the-pearl', '2 Bedroom', 'A-1004', 10, 1689.48, 17050, 28805634, 7201409, 2880563, 18723662, 312061, 936183, ''],
  [7, 'the-pearl', '2 Bedroom', 'A-843', 8, 1689.48, 17050, 28805634, 7201409, 2880563, 18723662, 312061, 936183, 'Corner'],
  [8, 'the-pearl', '1 Bedroom', 'A-1335', 13, 1050.38, 15500, 16280890, 4070223, 1628089, 10582579, 176376, 529129, ''],
  [9, 'the-pearl', '1 Bedroom', 'A-1315', 13, 1050.38, 15500, 16280890, 4070223, 1628089, 10582579, 176376, 529129, ''],
  [10, 'the-pearl', '2 Bedroom', 'A-1014', 10, 1465.2, 15500, 22710600, 5677650, 2271060, 14761890, 246032, 738095, ''],
  [11, 'the-pearl', 'Studio', 'A-1341', 13, 745.18, 16500, 12295470, 3073868, 1229547, 7992056, 133201, 399603, ''],
  [12, 'the-pearl', 'Studio', 'A-1241', 12, 745.18, 16500, 12295470, 3073868, 1229547, 7992056, 133201, 399603, ''],
  [13, 'the-pearl', 'Studio', 'A-941', 9, 745.18, 16500, 12295470, 3073868, 1229547, 7992056, 133201, 399603, ''],
  [14, 'the-pearl', 'Studio', 'A-1340', 13, 486.6, 16500, 8028900, 2007225, 802890, 5218785, 86980, 260939, ''],
  [15, 'the-pearl', 'Studio', 'A-1316', 13, 490.98, 18150, 8911287, 2227822, 891129, 5792337, 96539, 289617, 'Corner'],
  [16, 'the-pearl', 'Studio', 'A-1125', 11, 745.88, 16500, 12307020, 3076755, 1230702, 7999563, 133326, 399978, ''],
];

export const units = rows
  .map(([sheet, tower, type, unit, floor, sqft, rate, total, booking, possession, instalments, monthly, quarterly, tag]) =>
    ({ sheet, tower, type, unit, floor, sqft, rate, total, booking, possession, instalments, monthly, quarterly, tag }))
  .sort((a, b) => a.total - b.total || a.unit.localeCompare(b.unit));
