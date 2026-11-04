// Photos & video posters for every society. All images are frames from Fatima Marketing's OWN YouTube
// site-visit / drone videos (tools/build_society_media.py), except the airport photo (Wikimedia Commons, CC0).
// Image names resolve to /assets/society/<name>.webp (1600w) and <name>-800.webp.

export const covers = {
  'capital-smart-city': 'capital-smart-city-1', 'top-city-1': 'top-city-1-1', 'mumtaz-city': 'mumtaz-city-1',
  'gandhara-city': 'gandhara-city-1', 'pechs-islamabad': 'pechs-islamabad-2', 'airport-green-garden': 'airport-green-garden-1',
  'kingdom-valley': 'kingdom-valley-2', 'faisal-town': 'faisal-town-1', 'faisal-hills': 'faisal-hills-1',
  'park-view-city': 'park-view-city-1', 'blue-world-city': 'blue-world-city-1', 'd-17-islamabad': 'multi-gardens-b17-3',
  'multi-gardens-b17': 'multi-gardens-b17-1', 'taj-residencia': 'taj-residencia-1',
};

// Honest captions: what is actually visible in each frame.
export const gallery = {
  'capital-smart-city': [['capital-smart-city-1', 'Linear Park 1'], ['capital-smart-city-2', 'Smart STEM School'], ['capital-smart-city-3', 'Harmony Residential under construction'], ['capital-smart-city-4', 'Flower Show Park']],
  'top-city-1': [['top-city-1-1', 'Aerial view at the M-1/M-2 junction'], ['top-city-1-2', 'Interchange and developed blocks'], ['top-city-1-3', 'Main boulevard']],
  'mumtaz-city': [['mumtaz-city-1', 'Mumtaz City and the motorway interchange'], ['mumtaz-city-2', 'Interchange approach'], ['mumtaz-city-3', 'Blocks and road network'], ['mumtaz-city-4', 'Main boulevard buildings'], ['pearl-1', 'The Pearl (render)']],
  'gandhara-city': [['gandhara-city-1', 'Mosque and central park'], ['gandhara-city-2', 'Main gate'], ['gandhara-city-3', 'Developed residential street']],
  'pechs-islamabad': [['pechs-islamabad-2', 'Tree-lined main boulevard'], ['pechs-islamabad-1', 'Roundabout and houses'], ['pechs-islamabad-3', 'Road network'], ['pechs-islamabad-4', 'Main gate']],
  'airport-green-garden': [['airport-green-garden-1', 'Completed houses'], ['airport-green-garden-2', 'House frontage'], ['airport-green-garden-3', 'Kitchen interior'], ['airport-green-garden-4', 'Gate 1 entrance']],
  'kingdom-valley': [['kingdom-valley-2', 'Main roundabout'], ['kingdom-valley-3', 'Carpeted roads'], ['kingdom-valley-1', 'Development work']],
  'faisal-town': [['faisal-town-1', 'Phase 2 camp office'], ['faisal-town-2', 'Phase 2 land and development'], ['faisal-town-3', 'Chakri Road access'], ['faisal-town-4', 'Park in Phase 1']],
  'faisal-hills': [['faisal-hills-1', 'Main boulevard and buildings'], ['faisal-hills-2', 'Faisal Jewel project launch']],
  'park-view-city': [['park-view-city-1', 'Villas under construction'], ['park-view-city-2', 'Society entrance'], ['park-view-city-3', 'Landscaped park'], ['park-view-city-4', 'Commercial (render)']],
  'blue-world-city': [['blue-world-city-1', 'Main gate monuments'], ['blue-world-city-2', 'Blue Mosque replica'], ['blue-world-city-3', 'Park and roads'], ['blue-world-city-4', 'Overseas Block gate']],
  'd-17-islamabad': [['multi-gardens-b17-3', 'GT Road approach towards D-17']],
  'multi-gardens-b17': [['multi-gardens-b17-1', 'Sector B-17 main road'], ['multi-gardens-b17-2', 'B-17 commercial (J7 Emporium)'], ['multi-gardens-b17-3', 'GT Road and Margalla foothills']],
  'taj-residencia': [['taj-residencia-1', 'Villas under construction'], ['taj-residencia-2', 'Houses and boulevard'], ['taj-residencia-4', 'Villa interior (show unit)']],
};

// Extra site-visit / drone videos (dates + durations from YouTube).
export const extraVideos = {
  'mumtaz-city': [{ yt: 'SmxT7aHchFI', title: 'Mumtaz City Islamabad: Drone View', date: '2023-05-25', dur: 454 }],
  'gandhara-city': [{ yt: 'Hv9Q_igcp-M', title: 'Gandhara City: Secure and Gated Community', date: '2025-09-28', dur: 165 }],
  'faisal-town': [{ yt: 'aEFAsGMfRtw', title: 'Faisal Town Phase 2: Drone Shoot & Development', date: '2023-05-17', dur: 48 }],
  'park-view-city': [{ yt: 'Eg69fjWiTtg', title: 'Park View City: J Block Possession Event', date: '2023-06-01', dur: 131 }],
  'blue-world-city': [{ yt: '1RX50ATLSfs', title: 'Blue World City Site Visit', date: '2022-08-11', dur: 101 }],
  'top-city-1': [{ yt: 'UDAqThgpoEI', title: 'Top City-1 Detailed Site Visit', date: '2023-07-13', dur: 229 }],
  'pechs-islamabad': [{ yt: 'WaeXrbisdNY', title: 'PECHS Islamabad: A Complete & Secure Investment (Part 1)', date: '2026-02-03', dur: 163 }],
  'airport-green-garden': [{ yt: 'Wy3X8OvwMFc', title: 'Airport Green Garden Site Visit', date: '2023-07-15', dur: 289 }],
  'multi-gardens-b17': [{ yt: 'LVxpv-XTea4', title: 'Drive Through Sector B-17, Islamabad', date: '2024-09-24', dur: 324 }],
};

// Clean poster frame per YouTube video (instead of the busy YouTube thumbnail).
export const posters = {
  SmxT7aHchFI: 'mumtaz-city-2', 's-53UPyWeNM': 'mumtaz-city-4', _YIQRRaqIq8: 'pearl-1', '3HK9nZAJlLI': 'mumtaz-city-3', '0sB5OyxAuhs': 'mumtaz-city-1',
  '42svBBAaCHI': 'capital-smart-city-2', '7wu-zwemdhc': 'capital-smart-city-4',
  eLzT38CGx2U: 'top-city-1-2', C3XFQFtFhbI: 'top-city-1-3', M2gwXSx0X2k: 'mumtaz-city-2', UDAqThgpoEI: 'top-city-1-3',
  akfA82CSjqs: 'gandhara-city-3', p5YGlNuQV2Q: 'gandhara-city-1', hUNXs60GUDk: 'gandhara-city-2', 'Hv9Q_igcp-M': 'gandhara-city-2',
  aRbpMKUddzU: 'pechs-islamabad-3', kLc1sFKDuzw: 'pechs-islamabad-1', WaeXrbisdNY: 'pechs-islamabad-4',
  BMoVvPLnMwo: 'airport-green-garden-1', SFUwe64vWZA: 'airport-green-garden-2', Wy3X8OvwMFc: 'airport-green-garden-4',
  '5AViGuA5SOQ': 'kingdom-valley-1', gKPLt7zOamw: 'kingdom-valley-2', Y6kO4rBdfxQ: 'kingdom-valley-3', dtkqKXm6dZs: 'kingdom-valley-3',
  'R58q2DT-lMA': 'faisal-town-1', Y3byZtHBwqE: 'team-site-visit', '8lSpFaofs7o': 'faisal-town-3', aEFAsGMfRtw: 'faisal-town-2',
  '9Rx41mG5QdA': 'faisal-hills-2', nT_MnXdVkLI: 'faisal-hills-1',
  '6fxBJU9we0M': 'park-view-city-1', L1LNUoRLgag: 'park-view-city-4', Eg69fjWiTtg: 'park-view-city-3',
  '83anReHGFj0': 'blue-world-city-3', ZYlmNakimhk: 'blue-world-city-4', '7fojhZu0a4o': 'blue-world-city-2', '1RX50ATLSfs': 'blue-world-city-1',
  aYcr7uEkEiw: 'multi-gardens-b17-1', 'LVxpv-XTea4': 'multi-gardens-b17-2',
  IQHajpruFj4: 'team-taj', '2oDQco9IoOo': 'taj-residencia-2', MJEI5pMTjwE: 'taj-residencia-1',
};

// Home page: "Site visits & drone tours" (society slug, YouTube id).
export const homeVideos = [
  ['mumtaz-city', 'SmxT7aHchFI'], ['kingdom-valley', 'gKPLt7zOamw'], ['capital-smart-city', '42svBBAaCHI'],
  ['pechs-islamabad', 'kLc1sFKDuzw'], ['park-view-city', '6fxBJU9we0M'], ['blue-world-city', '1RX50ATLSfs'],
  ['faisal-town', 'aEFAsGMfRtw'], ['gandhara-city', 'Hv9Q_igcp-M'], ['airport-green-garden', 'BMoVvPLnMwo'],
  ['top-city-1', 'UDAqThgpoEI'], ['taj-residencia', 'IQHajpruFj4'], ['multi-gardens-b17', 'LVxpv-XTea4'],
];

// Hero: 1080p drone/aerial loops from the client's videos.
export const heroSlides = [
  { slug: 'mumtaz-city', name: 'Mumtaz City', where: 'M-1/M-2 interchange, Islamabad', clip: 'hero-mumtaz', yt: 'SmxT7aHchFI', facts: ['The Pearl · Sofia Sapphire · ICON VIII', '5–10 min to New Islamabad Airport'] },
  { slug: 'capital-smart-city', name: 'Capital Smart City', where: 'M-2 Motorway, Chakri Road', clip: 'hero-csc', yt: '42svBBAaCHI', facts: ['13 payment plans on file', 'Own M-2 interchange (under construction)'] },
  { slug: 'kingdom-valley', name: 'Kingdom Valley', where: 'Chakri Interchange, M-2', clip: 'hero-kingdom', yt: 'gKPLt7zOamw', facts: ['3.5 Marla to 1 Kanal plots', 'Balloting held Feb 2026'] },
  { slug: 'blue-world-city', name: 'Blue World City', where: 'Chakri Road, M-2', clip: 'hero-bwc', yt: '1RX50ATLSfs', facts: ['Billed as Pakistan’s first tourist city', 'Overseas Block & Downtown'] },
];

export const showcase = [
  ['mumtaz-city-1', 'Mumtaz City, Islamabad'], ['pearl-1', 'The Pearl, Mumtaz City'], ['capital-smart-city-1', 'Capital Smart City'],
  ['blue-world-city-1', 'Blue World City'], ['gandhara-city-1', 'Gandhara City'], ['kingdom-valley-2', 'Kingdom Valley'],
  ['park-view-city-3', 'Park View City'], ['pechs-islamabad-2', 'PECHS Islamabad'], ['faisal-town-1', 'Faisal Town Phase 2'],
];
