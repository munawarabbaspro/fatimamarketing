// Business-wide content. Every fact here is sourced (see docs/01-requirements-notes.md).
// Edit this file to change contact details, stats, FAQs or testimonials site-wide.

export const site = {
  // Canonical domain: fatimamarketing.com is the website listed on their Google Business Profile and printed on
  // their video tickers since 2023 (currently not serving a site). fgoc.pk = FGC's old domain → 301 redirect here.
  url: 'https://fatimamarketing.com',
  name: 'Fatima Marketing',
  legalName: 'Fatima Marketing (Fatima Group of Companies)',
  tagline: 'Real Services for Real Estate',
  motto: 'The trust of our clients is our asset',
  description:
    'Fatima Marketing is an Islamabad real estate marketing company (part of Fatima Group of Companies) helping families and overseas Pakistanis buy plots, houses, villas and apartments in Capital Smart City, Mumtaz City, Top City-1, Kingdom Valley, Blue World City, Park View City, Faisal Town and more.',
  phones: {
    uan: { display: '0331-1111057', tel: '+923311111057' },
    alt: { display: '0331-1111058', tel: '+923311111058' },
    whatsapp: { display: '0335-7777901', wa: '923357777901' },
  },
  email: 'fatimamarketing.isb@gmail.com',
  address: {
    line1: 'Office No. 01, 1st Floor, Allied Plaza',
    line2: 'F-10 Markaz, Islamabad',
    street: 'Office No. 01, 1st Floor, Allied Plaza, F-10 Markaz',
    city: 'Islamabad',
    region: 'Islamabad Capital Territory',
    postal: '44000',
    country: 'PK',
    // F-10 Markaz centroid from OpenStreetMap (Markaz-level precision).
    geo: { lat: 33.6958973, lng: 73.0124707 },
    mapQuery: 'Allied Plaza, F-10 Markaz, Islamabad',
  },
  hours: '', // ⚠ client to provide office hours; hidden until filled (e.g. 'Mon – Sat, 10:00 am – 7:00 pm')
  social: {
    facebook: { url: 'https://www.facebook.com/fatimamarketingisb/', handle: 'fatimamarketingisb' },
    youtube: { url: 'https://www.youtube.com/@fatimamarketing', handle: '@fatimamarketing' },
    instagram: { url: 'https://www.instagram.com/fatimamarketingisb/', handle: '@fatimamarketingisb' },
  },
  // Live counts captured 2026-11-02 (Facebook/Instagram via public profile, YouTube via channel page).
  socialStats: {
    asOf: 'November 2026',
    facebook: { followers: '11,257', followersShort: '11K+', checkins: '2,996', talking: '238' },
    youtube: { subscribers: '4.33K', videos: '1.2K', views: '420K+', since: 'October 2021' },
    instagram: { posts: '523', followers: '86' },
  },
  // Client-supplied figures (call recording 08:15–08:45, notes page 3).
  stats: [
    { value: 3000, suffix: '+', label: 'Global customers' },
    { value: 17, suffix: '+', label: 'Years of experience' },
    { value: 50, suffix: '+', label: 'Expert team members' },
    { value: 100, suffix: '+', label: 'Projects completed' },
  ],
  group: {
    name: 'Fatima Group of Companies (FGC)',
    companies: [
      { name: 'Fatima Marketing', text: 'Real estate marketing, bookings, resale and investment advisory across Islamabad & Rawalpindi societies.' },
      { name: 'Fatima Associates', text: 'Property dealing in leading housing societies of the twin cities.' },
      { name: 'Fatima Construction & Builders', text: 'Architecture, construction and consultancy, from site preparation to handover.' },
    ],
  },
  // Names & titles from fgoc.pk/about-us (archived Dec 2023). Shown as text only (no photos, by client decision).
  // ⚠ Client to confirm current titles (some 2023 YouTube titles call Riaz Khokhar "CEO") and the one-line descriptions.
  // The YouTube mentions are factual: Riaz Khokhar and Mudasar Nawaz Khokhar present the channel's market/project videos.
  leadership: [
    { name: 'Ejaz Khokhar', role: 'Chief Executive Officer', about: 'Leads Fatima Group of Companies and its partnerships with developers across Islamabad and Rawalpindi.' },
    { name: 'Riaz Khokhar', role: 'Chief Financial Officer', about: 'Oversees accounts and payment schedules, and presents our market updates on YouTube.' },
    { name: 'Mudasar Khokhar', role: 'Director Coordination', about: 'Coordinates sales, site visits and developer liaison, and hosts our project guides on YouTube.' },
    { name: 'Ayyan Khokhar', role: 'Director Human Resources', about: 'Leads hiring and training for our 50+ member sales and support team.' },
    { name: 'Haris Aziz', role: 'Director IT', about: 'Runs our website, digital channels and enquiry systems.' },
  ],
  departments: [
    { name: 'Sales & Business Development', text: '20+ sales and business-development executives who handle bookings, transfers and site visits.' },
    { name: 'Technical team', text: 'Verifies maps, NOC status, possession and development progress on site.' },
    { name: 'Accounts & Administration', text: 'Handles payment schedules, receipts and documentation with developers.' },
  ],
  // Lead delivery. WhatsApp always works; email delivery needs a free Web3Forms key
  // (https://web3forms.com → create key with fatimamarketing.isb@gmail.com → paste below).
  forms: {
    web3formsKey: '',
    analyticsId: '', // optional GA4 ID, e.g. 'G-XXXXXXX'
  },
};

// Five key points (template's 5-icon strip). Client said "these 5 stay"; final wording pending from client.
// Photos: PECHS main gate · finished villas · Faisal Town site visit (client's own footage) · Islamabad International
// Airport (Pr0pulsion 123, Wikimedia Commons, CC0) · open balloting at Park View City (client's own footage).
export const keyPoints = [
  { img: 'kp-approved', title: 'Approval status checked first', text: 'We check NOC and approval status before we offer any file or plot.' },
  { img: 'kp-installments', title: 'Easy installment plans', text: 'Latest developer payment plans, explained line by line.' },
  { img: 'kp-site-visits', title: 'Guided site visits', text: 'We take you to the site to see the location and real development progress.' },
  { img: 'kp-overseas', pos: '0% 50%', title: 'Overseas Pakistani support', text: 'Bookings, transfers and updates on WhatsApp, wherever you live.' },
  { img: 'kp-paperwork', title: 'Transparent paperwork', text: 'Pay orders in the developer’s name, official receipts, clear transfer process.' },
];

// "Highlights nearby" re-done for the airport–motorway corridor (Temple removed per client).
export const highlights = [
  { img: 'hl-airport', title: 'New Islamabad International Airport', chip: '5–15 min', text: 'Most of our featured societies are a short drive from the new airport.', credit: 'Photo: Pr0pulsion 123, Wikimedia Commons (CC0)' },
  { img: 'hl-motorway', title: 'M-1 & M-2 Motorways', chip: 'Direct access', text: 'Thalian, Chakri, Fateh Jang and the M-1/M-2 interchange connect most of our societies.', credit: 'Top City-1 interchange, Fatima Marketing drone footage' },
  { img: 'hl-school', title: 'Schools & universities', chip: 'Inside societies', text: 'Planned education zones, like the Smart STEM School in Capital Smart City.', credit: 'Capital Smart City, Fatima Marketing footage' },
  { img: 'hl-mall', title: 'Shopping malls & markets', chip: 'Twin cities', text: 'Downtowns and malls in every master plan, plus The Centaurus in Islamabad.', credit: 'The Centaurus, Islamabad' },
  { img: 'hl-hospital', title: 'Hospitals & healthcare', chip: 'Nearby', text: 'Medical complexes inside societies, such as the Hanif Medical Complex planned for Faisal Town.', credit: 'Hanif Medical Complex (render), Faisal Town' },
];

// Home FAQ. Answers drawn from Fatima Marketing's own public material (fgoc.pk, YouTube) and standard
// Islamabad buying process. Client can replace with their own Q&A ("I will give you the answer").
export const faqs = [
  {
    q: 'What does Fatima Marketing do?',
    a: 'Fatima Marketing is the real estate marketing arm of Fatima Group of Companies (FGC), based at Allied Plaza, F-10 Markaz, Islamabad. We help clients book, buy, sell and transfer plots, houses, villas, apartments and commercial units in leading societies of Islamabad and Rawalpindi.',
  },
  {
    q: 'Which housing societies do you deal in?',
    a: 'Capital Smart City, Mumtaz City (The Pearl, ICON VIII, Sofia Sapphire), Top City-1, Kingdom Valley, Blue World City, Park View City, Faisal Town, Faisal Hills, Airport Green Garden, PECHS Islamabad, Gandhara City, Taj Residencia, Multi Gardens B-17 and D-17. We also help with other societies in the twin cities on request.',
  },
  {
    q: 'How do I know a society is legal and approved?',
    a: 'Always check the NOC/approval with the relevant authority: CDA for Islamabad sectors, RDA for Rawalpindi district. Our team shares the approval status of every project we offer, and our YouTube channel regularly exposes fake and unapproved schemes so buyers can avoid them.',
  },
  {
    q: 'Can overseas Pakistanis book a plot through you?',
    a: 'Yes. Many of our 3,000+ customers live abroad. We share the latest payment plan, availability and documents on WhatsApp, guide you on making the pay order or bank transfer in the developer’s name, and send you development updates and video site visits.',
  },
  {
    q: 'Do you arrange site visits?',
    a: 'Yes. Call or WhatsApp us to schedule a visit with our team. You will see the location, the block and the actual development progress before you decide.',
  },
  {
    q: 'What documents are needed to book a plot?',
    a: 'Usually a copy of your CNIC (or NICOP for overseas Pakistanis), passport-size photographs, next-of-kin details and the booking/down payment by pay order in the developer’s name. Exact requirements vary by developer and we confirm them before booking.',
  },
  {
    q: 'Are the prices on this website final?',
    a: 'Payment plans on this site are published as shared by the developers. Developers revise prices and offers without notice, and prime-location charges (corner, park-facing, main boulevard) apply extra, so always confirm the current rate with our team before paying.',
  },
  {
    q: 'Can you help with dead files, file merging or resale?',
    a: 'Yes. We regularly help clients with resale, transfers, merging old or “dead” files into possession-ready plots where a developer offers it, and exchange options. Share your file details on WhatsApp and we will advise.',
  },
];

// Customer testimonials: REAL Google reviews from Fatima Marketing's Google Business Profile
// (5.0 ★ from 22 reviews, read 2026-11-03). Quoted verbatim (only doubled spaces removed); reviewer names as shown publicly on Google.
export const googleProfile = {
  rating: '5.0', count: 22,
  url: 'https://www.google.com/maps/search/?api=1&query=Fatima+Marketing+F-10+Markaz+Islamabad',
};
export const testimonials = [
  { name: 'Muhammad Salman', meta: '7 reviews · 7 photos', text: 'I had an exceptional experience working with Fatima Marketing. From the moment I reached out to them, their team was highly responsive and professional. They guided me through the entire process with expertise, making buying a new home a smooth and enjoyable journey. I highly recommend Fatima Marketing to anyone looking for top-notch service and support in the real estate market.', verified: true },
  { name: 'Mra Mr', meta: 'Local Guide · 9 reviews', text: 'I worked with Riaz bhai to purchase my first plot in 2016 and I couldn’t be happier. He was extremely knowledgeable about the local market and helped me to make the right investment.', verified: true },
  { name: 'Sajjad Ali Lal Din', meta: 'Local Guide · 10 reviews', text: 'The team of professionals providing one of the best Real Estate services in Pakistan and according to my personal experience I found champions of service, care, responsibility and kinship.', verified: true },
  { name: 'Hamza Khokhar', meta: '4 reviews · 2 photos', text: 'I had a great experience with Fatima Marketing. They were professional, friendly, and helped me find the perfect investments. Highly recommend!', verified: true },
  { name: 'Muhammad Umar', meta: '2 reviews · 1 photo', text: 'Fatima Marketing is the best real estate & consultant Team. Its Good dealing and good services. Ejaz bhai & Riaz Bhai are honest man.', verified: true },
];
