// Plot price guides, plot offers and master-plan maps, per society.
// Sources (16 Nov 2026, forwarded by the client):
// - PECHS: block-wise price table (2 screenshots). The owner's note "8 lakh waly ko 15 say 16 lkh krdy" changed
//   F Block (non-developed) 5 Marla from Rs 8–10 Lac to Rs 15–16 Lac (as instructed; a second forward said 14–15).
// - Top City-1: the owner's messages. Blocks: A, D 10 Marla · C, D 1 Kanal · E, F 10 Marla & Kanal · E 5 Marla ·
//   G 5 Marla · H farmhouses · J commercial (5 Marla) · K commercial. The two figures sent right after that list are
//   the commercial blocks in the same order: J commercial "195 to 3 Cr", K commercial "2 Cr to 4 Cr". Residential:
//   5 Marla 70–90 Lac · G Block 5 Marla 80–90 Lac · 10 Marla 1.10–1.50 Crore · Kanal 1.95–2.50 Crore.
// - Mumtaz City: Fatima Marketing's two Extension Block posters.
// - Maps: Top City-1 official layout plan (topcity-1.com, RDA-approved); Mumtaz City official layout plan
//   (mumtazcity.com, 2016); PECHS K & M Block town plan (Plnr. M. Kashif Chaudhary). The full PECHS map the client
//   linked carries another agency's logo and phone numbers, so it is not used.
// Amounts are in lakh (1 Crore = 100 lakh). Edit here and rebuild; tools/uat/check_plans.mjs checks the figures.

export const pricesAsOf = '16 November 2026';

export const priceGuides = {
  'top-city-1': {
    note: 'Price guide from Fatima Marketing’s Top City-1 desk. Prices vary with block, development status and location (corner, park-facing, main boulevard).',
    blocks: [
      ['A', ['10 Marla']], ['B', ['Residential']], ['C', ['1 Kanal']], ['D', ['10 Marla', '1 Kanal']],
      ['E', ['5 Marla', '10 Marla', '1 Kanal']], ['F', ['10 Marla', '1 Kanal']], ['G', ['5 Marla']], ['H', ['Farmhouses']],
      ['I', ['Residential']], ['J', ['Commercial', '5 Marla']], ['K', ['Commercial']],
    ],
    // [block, plot, min, max, note]
    rows: [
      ['All blocks', '5 Marla', 70, 90, ''],
      ['G Block', '5 Marla', 80, 90, ''],
      ['All blocks', '10 Marla', 110, 150, ''],
      ['All blocks', '1 Kanal', 195, 250, ''],
      ['J Block', 'Commercial (5 Marla)', 195, 300, ''],
      ['K Block', 'Commercial', 200, 400, ''],
      ['H Block', 'Farmhouse', null, null, 'Price on request'],
    ],
  },
  'pechs-islamabad': {
    note: 'Block-wise price guide. “Non-developed” plots are in blocks where development is still under way.',
    rows: [
      ['A', '1 Kanal', 50, 90, ''], ['A', '2 Kanal', 135, 160, ''],
      ['B', '10 Marla', 12, 15, 'Non-developed'], ['B', '1 Kanal', 65, 82, ''],
      ['C', '10 Marla', 15, 50, 'From Rs 15 Lac (non-developed)'], ['C', '1 Kanal', 75, 85, ''], ['C', '2 Kanal', 120, 150, ''],
      ['C-Extension', '10 Marla', 45, 50, 'Developed'], ['C-Extension', '10 Marla', 14, 18, 'Non-developed'], ['C-Extension', '1 Kanal', 25, 35, 'Non-developed'],
      ['D', '1 Kanal', 60, 70, ''], ['D', '2 Kanal', 130, 155, ''],
      ['E', '2 Kanal', 130, 150, ''],
      ['F', '5 Marla', 15, 16, 'Non-developed'], ['F', '10 Marla', 35, 40, 'Developed'], ['F', '10 Marla', 15, 20, 'Non-developed'],
      ['G', '1 Kanal', 50, 60, ''],
      ['H', '1 Kanal', 44, 55, ''], ['H', '2 Kanal', 50, 60, 'Non-developed'],
      ['K', '9 Marla', 38, 45, ''], ['K', '1 Kanal', 65, 75, ''], ['K', '2 Kanal', 150, 200, ''],
      ['K-Extension', '5 Marla', 25, 28, ''], ['K-Extension', '7 Marla', 34, 38, ''], ['K-Extension', '10 Marla', 40, 60, ''],
      ['M', '5 Marla', 24, 30, ''], ['M', '7 Marla', 30, 35, ''], ['M', '10 Marla', 35, 45, ''], ['M', '1 Kanal', 58, 65, ''], ['M', '1.5 Kanal', 100, 150, ''],
      ['M-Extension', '5 Marla', 16, 20, ''],
      ['N', '5 Marla', 35, 35, 'On instalments'], ['N', '8 Marla', 42.5, 42.5, 'On instalments'],
    ],
  },
};

// Plot offers (Fatima Marketing posters). Amounts in rupees.
export const plotOffers = {
  'mumtaz-city': {
    title: 'Extension Block · 5 Marla residential plot',
    total: 5500000, was: 6000000, booking: 2750000, down: 3000000, balance: 2500000, months: 6, monthly: 416667,
    points: ['Possession within 6 months', 'Limited plots available', 'Gated community · 24/7 security', 'Parks, mosque, schools & commercial areas', 'Direct access from Srinagar Highway, near the M-1/M-2'],
    posters: [['mumtaz-5-marla-offer-en', 'Mumtaz City Extension Block 5 Marla plot: Rs 55 Lac, Rs 30 Lac down payment and 6 monthly instalments of Rs 416,667'],
      ['mumtaz-5-marla-offer-ur', 'Mumtaz City 5 Marla plot (Urdu poster): booking from Rs 27.5 Lac, Rs 60 Lac now Rs 55 Lac, possession within 6 months']],
  },
};

// Master plans & maps. img = assets/maps/<img>.webp (full) and -<small>.webp (preview).
export const societyMaps = {
  'top-city-1': [{ img: 'top-city-1-master-plan', small: 800, w: 2600, h: 4728, title: 'Top City-1 layout plan (partial revised plan)', credit: 'Official layout plan, TopCity-1 (topcity-1.com); approved by the Rawalpindi Development Authority', pdf: 'https://topcity-1.com/wp-content/uploads/2026/08/Master-Plan-TopCity-1_compressed.pdf' }],
  'mumtaz-city': [{ img: 'mumtaz-city-layout-plan', small: 1400, w: 3600, h: 2306, title: 'Mumtaz City layout plan', credit: 'Official layout plan, Mumtaz City (mumtazcity.com). Newer blocks such as the Extension Block may not appear on it', pdf: 'https://mumtazcity.com/wp-content/uploads/2016/06/mumtazcity_masterplan.pdf', live: ['https://www.zameen.com/plotfinder/Islamabad-29/Mumtaz-City-648/', 'Find a plot on the interactive map (Zameen Plot Finder)'] }],
  // The full society map the client linked (manahilestate.com) carries that agency's logo, phones and office, so the
  // whole society is shown through Zameen's interactive Plot Finder (every block, C & K Extension included) instead.
  'pechs-islamabad': [{ img: 'pechs-k-m-block', small: 1000, w: 2000, h: 2667, title: 'PECHS K & M Block plan', credit: 'Town plan of K & M Block, Fateh Jang Road (town planner: Plnr. M. Kashif Chaudhary), with plot typology from 25×50 to 75×100', live: ['https://www.zameen.com/plotfinder/Islamabad-29/PECHS-Housing-Society-588/', 'Full society map: all blocks, A to M (Zameen Plot Finder)'] }],
};
