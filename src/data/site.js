// Single source of truth for copy, links and assets.
//
// Images resolve to /public/images/<name>. The files there are stand-in
// photography — replacing a file with the client's own, under the same name,
// is the whole swap. See public/images/README.md.

const img = (name) => `/images/${name}`

export const site = {
  name: 'LA Space Interiors',
  url: 'https://www.laspaceinteriors.com',
  phone: '+91 90000 00000',
  phoneHref: 'tel:+919000000000',
  whatsappHref: 'https://wa.me/919000000000',
  email: 'hello@laspaceinteriors.com',
  emailHref: 'mailto:hello@laspaceinteriors.com',
  address: ['Door No. 1-2-3, Beach Road', 'Visakhapatnam, Andhra Pradesh 530017', 'India'],
  social: [
    { label: 'Instagram', href: 'https://www.instagram.com/laspaceinteriors' },
    { label: 'Facebook', href: 'https://www.facebook.com/laspaceinteriors' },
    { label: 'YouTube', href: 'https://www.youtube.com/@laspaceinteriors' },
  ],
}

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'Contact', href: '/contact' },
]

export const heroSlides = [
  {
    src: img('hero-1.jpg'),
    alt: 'Minimal living room in warm neutrals with a low linen sofa and arched window',
  },
  {
    src: img('hero-2.jpg'),
    alt: 'Modular kitchen in marble and champagne-toned cabinetry',
  },
  {
    src: img('hero-3.jpg'),
    alt: 'Bedroom with panelled headboard wall and brass reading lights',
  },
  {
    src: img('hero-4.jpg'),
    alt: 'Dining space with a stone table and sculptural pendant lighting',
  },
]

export const whoWeAreImage = {
  src: img('who-we-are.jpg'),
  alt: 'Arched alcove with layered textiles and a carved timber console',
}

export const services = [
  { no: '01', name: 'Full Home Interiors', tag: 'Turnkey Residences', href: '/services#full-home' },
  { no: '02', name: 'Modular Kitchens', tag: 'Marble & Champagne', href: '/services#kitchens' },
  { no: '03', name: 'Wardrobes & Walk-in Closets', tag: 'Leather & Brass', href: '/services#wardrobes' },
  { no: '04', name: 'Living Spaces', tag: 'Editorial Calm', href: '/services#living' },
  { no: '05', name: 'False Ceilings', tag: 'Cove & Line Light', href: '/services#ceilings' },
  { no: '06', name: 'Commercial Interiors', tag: 'Offices & Retail', href: '/services#commercial' },
]

export const projects = [
  {
    name: 'Villa Marine Drive',
    meta: 'Visakhapatnam • Full Home Interiors',
    href: '/projects/villa-marine-drive',
    shape: 'arch',
    src: img('project-1.jpg'),
    alt: 'Double-height living room of a sea-facing villa in cream and walnut',
  },
  {
    name: 'The Kailasagiri Residence',
    meta: 'Visakhapatnam • Modular Kitchen',
    href: '/projects/kailasagiri-residence',
    shape: 'inverted',
    src: img('project-2.jpg'),
    alt: 'Galley kitchen with veined marble backsplash and handleless cabinetry',
  },
  {
    name: 'Rushikonda Penthouse',
    meta: 'Visakhapatnam • Living Spaces',
    href: '/projects/rushikonda-penthouse',
    shape: 'capsule',
    src: img('project-3.jpg'),
    alt: 'Penthouse lounge with curved seating and floor-to-ceiling glazing',
  },
  {
    name: 'Studio Dwaraka Nagar',
    meta: 'Visakhapatnam • Commercial Interiors',
    href: '/projects/studio-dwaraka-nagar',
    shape: 'diagonal',
    src: img('project-4.jpg'),
    alt: 'Boutique office interior with fluted timber partitions and warm lighting',
  },
]

export const processSteps = [
  {
    numeral: 'I',
    title: 'Consultation',
    body: 'We listen first — how you live, who visits, what light you wake to. Budget and timeline are set honestly on day one.',
  },
  {
    numeral: 'II',
    title: 'Design & 3D',
    body: 'Layouts, elevations and photoreal 3D views. You walk the home before a single panel is cut.',
  },
  {
    numeral: 'III',
    title: 'Materials',
    body: 'Samples in hand — veneers, stone, laminates, hardware. Nothing is specified you have not touched.',
  },
  {
    numeral: 'IV',
    title: 'Execution',
    body: 'Factory-finished modules, supervised site work and weekly progress reporting against a fixed schedule.',
  },
  {
    numeral: 'V',
    title: 'Handover',
    body: 'Deep clean, snag list closed, warranties documented. We hand over keys to a home, not a site.',
  },
]

export const stats = [
  { value: 50, label: 'Projects Completed' },
  { value: 40, label: 'Happy Families' },
  { value: 120, label: 'Design Concepts' },
  { value: 10, label: 'Years of Combined Craft' },
]

export const testimonials = [
  {
    quote:
      'They read our family before they drew a single line. Two years on, the house still feels considered — not styled.',
    author: 'Sruthi & Karthik',
    role: 'Villa Marine Drive',
  },
  {
    quote:
      'The kitchen is the quietest room in the house and somehow the one everybody stands in. That is the whole design.',
    author: 'Dr. Anitha Rao',
    role: 'Kailasagiri Residence',
  },
  {
    quote:
      'Fixed budget, fixed date, weekly photographs. In this trade that alone is worth the fee — the craft was the bonus.',
    author: 'Vikram Chowdary',
    role: 'Rushikonda Penthouse',
  },
]

export const partners = [
  'Hettich',
  'Hafele',
  'Century Ply',
  'Greenlam',
  'Asian Paints',
  'Saint-Gobain',
]

export const faqs = [
  {
    q: 'What does a full home interior cost in Visakhapatnam?',
    a: 'A 3BHK typically lands between ₹12 and ₹28 lakh depending on carcass material, finishes and how much loose furniture is in scope. We issue a line-item quotation after the first measurement visit, and the number does not move unless the scope does.',
  },
  {
    q: 'How long does a project take?',
    a: 'Design and 3D approval takes two to three weeks. Execution for a full home runs 45 to 75 days from the date of final approval, with site work sequenced so civil, carpentry and finishing never collide.',
  },
  {
    q: 'Do you handle civil work, electrical and plumbing?',
    a: 'Yes. We take turnkey responsibility — false ceilings, electrical layouts, plumbing shifts, painting and deep cleaning are all coordinated by one project manager so you have a single point of accountability.',
  },
  {
    q: 'Can we see the materials before they are ordered?',
    a: 'Always. Every veneer, stone, laminate, fabric and hardware piece is presented as a physical sample and signed off before procurement. No substitutions are made on site without your approval.',
  },
  {
    q: 'What warranty do you offer?',
    a: 'Ten years on modular carcass, one year on site workmanship, and manufacturer warranty passed through on all hardware. Warranty documents are handed over as a bound file at completion.',
  },
]

export const ctaImage = {
  src: img('cta.jpg'),
  alt: '',
}

/* ── About page ──────────────────────────────────────────────────────────── */

export const aboutHero = {
  eyebrow: '— About LA Space',
  lead: 'We are a small studio in Visakhapatnam that designs interiors and then builds them — no handing your drawings to a contractor and hoping. The people who draw your home are the people who measure it, fabricate it and fit it.',
  image: {
    src: img('about-hero.jpg'),
    alt: 'Arched entrance hall with a fluted timber console and warm cove lighting',
  },
}

export const aboutStory = [
  {
    eyebrow: '— 01 / How We Began',
    title: 'A drafting table, a rented flat, and one kitchen.',
    body: 'LA Space began with a single modular kitchen for a family friend in Dwaraka Nagar, drawn on a second-hand table in a rented two-bedroom flat. That kitchen brought the next three projects, and those brought the rest. We have never advertised for work — every residence we have built came from the one before it.',
    image: {
      src: img('story-1.jpg'),
      alt: 'Early studio workspace with material samples, drawings and a drafting table',
    },
    radius: '0 240px 0 240px',
    width: '480px',
    height: 'clamp(320px, 70vw, 500px)',
  },
  {
    eyebrow: '— 02 / How We Work',
    title: 'Factory precision, fitted by our own hands.',
    body: 'Carcasses and shutters are cut and edge-banded in a controlled factory, not on your living-room floor. They arrive finished, and our own fitting crews install them — no subcontracted labour, no third party to blame when a line does not meet. It is slower to schedule and far easier to guarantee.',
    image: {
      src: img('story-2.jpg'),
      alt: 'Fitting crew installing finished modular cabinetry on site',
    },
    radius: '240px',
    width: '420px',
    height: 'clamp(360px, 78vw, 560px)',
    flip: true,
  },
]

export const founder = {
  eyebrow: '— 03 / The Vision Behind LA Space',
  name: 'Balachandu',
  role: 'Founder & CEO',
  quote: '“Every client deserves a space that feels uniquely theirs.”',
  body: [
    'Balachandu founded LA Space after a decade on site — first as a draughtsman, then running execution for residential projects across Andhra Pradesh. That order matters: he learned how a home is built before he learned how to draw one, and it shows in drawings that fabricators can actually work from.',
    'He still walks every site personally at three points — after civil work, at carcass installation, and the day before handover. It is the reason the studio takes on a deliberate number of homes a year rather than as many as it could sell.',
  ],
  closing:
    'A home should look like the people in it — not like the studio that designed it.',
  // Replace with the real portrait; until then the clip box holds the monogram.
  portrait: null,
}

export const whyLaSpace = [
  {
    no: '01',
    title: 'Transparent Pricing',
    body: 'A line-item quotation after the first measurement visit — material, finish, hardware and labour costed separately. The number does not move unless the scope does, in writing.',
  },
  {
    no: '02',
    title: 'On-Time Delivery',
    body: 'A dated schedule issued at approval and weekly photographs against it. Civil, carpentry and finishing are sequenced so trades never collide on site.',
  },
  {
    no: '03',
    title: '3D Before Execution',
    body: 'Photoreal views of every room before a single panel is cut. You approve what you will actually live in, not an elevation you have to imagine.',
  },
  {
    no: '04',
    title: 'Quality Materials',
    body: 'Named brands on the quotation — Hettich, Hafele, Century, Greenlam — with physical samples signed off before procurement and no substitutions on site.',
  },
  {
    no: '05',
    title: 'After-Handover Support',
    body: 'Ten years on modular carcass, one year on site workmanship, and a bound warranty file at handover. We answer the phone after the invoice is settled.',
  },
]

export const aboutCta = {
  title: 'Meet us over a cup of coffee and a floor plan.',
  image: { src: img('about-cta.jpg'), alt: '' },
}

/* ── Services page ───────────────────────────────────────────────────────── */

export const servicesHero = {
  eyebrow: '— Our Services',
  lead: 'Six disciplines, one standard. Each service is delivered with 3D previews before execution, named materials, and our own fitting crews.',
}

export const serviceBlocks = [
  {
    id: 'full-home',
    eyebrow: '— 01 / Turnkey',
    name: 'Full Home Interiors',
    description:
      'One team, one contract, one standard — from the entrance arch to the last wardrobe handle. We design, fabricate, and fit the entire residence.',
    scope: [
      'Space planning & 3D visualization of every room',
      'Modular kitchen, wardrobes & TV units',
      'False ceilings, lighting & electrical layout',
      'Soft furnishing, styling & handover cleaning',
    ],
    radius: '420px 420px 0 0',
    image: {
      src: img('service-1.jpg'),
      alt: 'Completed living and dining area of a turnkey residence in warm neutrals',
    },
  },
  {
    id: 'kitchens',
    eyebrow: '— 02 / Kitchens',
    name: 'Modular Kitchens',
    description:
      'Champagne cabinetry, calacatta marble, black shadow lines. Kitchens engineered for Indian cooking and finished like showrooms.',
    scope: [
      'Parallel, L-shape, U-shape & island layouts',
      'Soft-close Hettich / Hafele hardware',
      'Marble, quartz & granite counters and daddos',
      'Tall units, pantry pull-outs & appliance garages',
    ],
    radius: '0 240px 0 240px',
    image: {
      src: img('service-2.jpg'),
      alt: 'Modular kitchen with marble counters and handleless champagne cabinetry',
    },
  },
  {
    id: 'wardrobes',
    eyebrow: '— 03 / Closets',
    name: 'Wardrobes & Walk-in Closets',
    description:
      'Leather-panelled doors, brass-lit shelving, and drawers that glide shut on their own. Storage designed like a boutique.',
    scope: [
      'Hinged, sliding & walk-in configurations',
      'Internal lighting with sensor control',
      'Leather, veneer & lacquered glass shutters',
      'Dressing islands, mirrors & accessory drawers',
    ],
    radius: '260px',
    image: {
      src: img('service-3.jpg'),
      alt: 'Walk-in closet with lit open shelving and leather-panelled shutters',
    },
  },
  {
    id: 'living',
    eyebrow: '— 04 / Living',
    name: 'Living Spaces',
    description:
      'The room your guests remember. Panelled feature walls, floating consoles, and seating arranged around conversation, not the television.',
    scope: [
      'TV & media walls with concealed wiring',
      'Fluted panelling, stone & brass inlays',
      'Bar units, crockery & display cabinets',
      'Curtain, rug & furniture curation',
    ],
    radius: '0 0 420px 420px',
    image: {
      src: img('service-4.jpg'),
      alt: 'Living room with a fluted feature wall, floating console and layered seating',
    },
  },
  {
    id: 'ceilings',
    eyebrow: '— 05 / Ceilings',
    name: 'False Ceilings',
    description:
      'Cove light, recessed LED lines, and clean black shadow gaps — the quiet architecture that makes every other surface glow.',
    scope: [
      'Gypsum & POP ceiling design',
      'Recessed LED lines & cove lighting',
      'Profile lighting with warm-dim control',
      'AC boxing, curtain pelmets & speaker cutouts',
    ],
    radius: '240px 0 240px 0',
    image: {
      src: img('service-5.jpg'),
      alt: 'Recessed cove lighting and shadow-gap detailing in a gypsum ceiling',
    },
  },
  {
    id: 'commercial',
    eyebrow: '— 06 / Commercial',
    name: 'Commercial Interiors',
    description:
      'Clinics, boutiques, offices, and cafés — spaces where the interior is part of the business plan, delivered on unforgiving timelines.',
    scope: [
      'Retail & boutique fit-outs',
      'Office cabins, workstations & reception',
      'Clinic & hospitality interiors',
      'Brand-matched material & lighting palettes',
    ],
    radius: '420px 420px 0 0',
    image: {
      src: img('service-6.jpg'),
      alt: 'Boutique retail interior with brand-matched joinery and warm display lighting',
    },
  },
]

/* ── Projects page ───────────────────────────────────────────────────────── */

export const projectFilters = ['All', 'Residential', 'Kitchen', 'Wardrobe', 'Commercial']

/**
 * The grid, the shape cycle and the filters all derive from this one array.
 * Shapes and card heights are assigned by grid position at render time, not
 * stored here, so the rhythm survives filtering.
 */
export const portfolioProjects = [
  {
    slug: 'marble-court-kitchen',
    name: 'The Marble Court Kitchen',
    location: 'MVP Colony',
    type: 'Modular Kitchen',
    tags: ['Kitchen', 'Residential'],
    image: img('work-01.jpg'),
  },
  {
    slug: 'wardrobe-in-grey-leather',
    name: 'A Wardrobe in Grey Leather',
    location: 'Madhurawada',
    type: 'Walk-in Closet',
    tags: ['Wardrobe', 'Residential'],
    image: img('work-02.jpg'),
  },
  {
    slug: 'arched-bedroom',
    name: 'The Arched Bedroom',
    location: 'Siripuram',
    type: 'Master Suite',
    tags: ['Residential'],
    image: img('work-03.jpg'),
  },
  {
    slug: 'champagne-glass-pantry',
    name: 'Champagne & Glass Pantry',
    location: 'Rushikonda',
    type: 'Modular Kitchen',
    tags: ['Kitchen', 'Residential'],
    image: img('work-04.jpg'),
  },
  {
    slug: 'boutique-corridor',
    name: 'The Boutique Corridor',
    location: 'Waltair Uplands',
    type: 'Walk-in Closet',
    tags: ['Wardrobe', 'Residential'],
    image: img('work-05.jpg'),
  },
  {
    slug: 'living-room-at-dusk',
    name: 'A Living Room at Dusk',
    location: 'Rushikonda',
    type: 'Living Space',
    tags: ['Residential'],
    image: img('work-06.jpg'),
  },
  {
    slug: 'island-house-kitchen',
    name: 'The Island House Kitchen',
    location: 'Vizianagaram',
    type: 'Modular Kitchen',
    tags: ['Kitchen', 'Residential'],
    image: img('work-07.jpg'),
  },
  {
    slug: 'dressing-room-brass-lit',
    name: 'Dressing Room, Brass-Lit',
    location: 'Seethammadhara',
    type: 'Walk-in Closet',
    tags: ['Wardrobe', 'Residential'],
    image: img('work-08.jpg'),
  },
  {
    slug: 'suite-with-a-private-bar',
    name: 'Suite with a Private Bar',
    location: 'Beach Road',
    type: 'Master Suite',
    tags: ['Residential', 'Commercial'],
    image: img('work-09.jpg'),
  },
  {
    slug: 'quiet-larder',
    name: 'The Quiet Larder',
    location: 'Gajuwaka',
    type: 'Modular Kitchen',
    tags: ['Kitchen', 'Residential'],
    image: img('work-10.jpg'),
  },
  {
    slug: 'atelier-walk-through',
    name: 'Atelier Walk-Through',
    location: 'Dwaraka Nagar',
    type: 'Commercial Fit-out',
    tags: ['Commercial', 'Wardrobe'],
    image: img('work-11.jpg'),
  },
  {
    slug: 'marble-arch-suite',
    name: 'The Marble Arch Suite',
    location: 'Lawsons Bay',
    type: 'Master Suite',
    tags: ['Residential'],
    image: img('work-12.jpg'),
  },
]

/* ── Contact page ────────────────────────────────────────────────────────── */

export const contact = {
  hours: 'Mon – Sat, 10:00 – 19:00',
  // Replace with the studio's real Google Maps listing URL.
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=LA+Space+Interiors+Visakhapatnam',
  // Where the enquiry form posts. Leave null until the client confirms a
  // destination (inbox, CRM or WhatsApp handoff); the form then falls back to
  // opening a pre-filled email so it still works on day one.
  formEndpoint: null,
}

export const serviceOptions = [
  'Full Home Interiors',
  'Modular Kitchen',
  'Wardrobes & Walk-in Closets',
  'Living Spaces',
  'False Ceilings',
  'Commercial Interiors',
]

export const budgetOptions = [
  'Under ₹5 Lakhs',
  '₹5 – 12 Lakhs',
  '₹12 – 25 Lakhs',
  'Above ₹25 Lakhs',
]
