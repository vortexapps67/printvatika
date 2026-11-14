// ── PRODUCT CATALOG ───────────────────────────────────────────
// Single source of truth for all products.
// Customer pages use this for fast load (no DB call needed).
// Admin can override pricing via Supabase products table.

window.PRODUCTS = [
  {
    id: 'p1', slug: 'business-cards', name: 'Business Cards',
    category: 'stationery',
    desc: 'Single or double-sided on heavyweight cardstock. Matte, gloss, or velvet lamination available.',
    image: 'imgs/business-cards.jpg',
    basePrice: 299, baseUnit: '/ 100 pcs',
    options: [
      { key: 'size', label: 'Size', type: 'select', choices: [
        { val: 'standard', label: '3.5″ × 2.0″ Standard', mod: 0  },
        { val: 'square',   label: '2.0″ × 2.0″ Square',   mod: 30 },
        { val: 'slim',     label: '3.5″ × 1.75″ Slim',    mod: 20 },
      ]},
      { key: 'sides', label: 'Print Sides', type: 'select', choices: [
        { val: 'single', label: 'Single-sided', mod: 0   },
        { val: 'double', label: 'Double-sided', mod: 100 },
      ]},
      { key: 'paper', label: 'Paper Stock', type: 'select', choices: [
        { val: '300gsm', label: '300 GSM Art Card',     mod: 0   },
        { val: '350gsm', label: '350 GSM Premium',      mod: 80  },
        { val: '400gsm', label: '400 GSM Ultra Heavy',  mod: 150 },
      ]},
      { key: 'finish', label: 'Lamination', type: 'select', choices: [
        { val: 'none',   label: 'No Lamination',     mod: 0   },
        { val: 'matte',  label: 'Matte Lamination',  mod: 80  },
        { val: 'gloss',  label: 'Gloss Lamination',  mod: 80  },
        { val: 'velvet', label: 'Velvet Soft Touch',  mod: 200 },
      ]},
    ],
    quantities: [100, 250, 500, 1000],
    qtyDiscounts: { 250: 0.92, 500: 0.82, 1000: 0.72 },
    defaultQty: 250,
  },
  {
    id: 'p2', slug: 't-shirts', name: 'Custom T-Shirts',
    category: 'apparel',
    desc: 'Cotton t-shirts with front, back, or double-sided printing. Multiple colours and sizes.',
    image: 'imgs/t-shirts.jpg',
    basePrice: 249, baseUnit: '/ piece',
    options: [
      { key: 'color', label: 'T-Shirt Colour', type: 'select', choices: [
        { val: 'white', label: 'Pure White',    mod: 0  },
        { val: 'black', label: 'Classic Black', mod: 50 },
        { val: 'navy',  label: 'Navy Blue',     mod: 50 },
        { val: 'grey',  label: 'Sports Grey',   mod: 30 },
      ]},
      { key: 'size', label: 'T-Shirt Size', type: 'select', choices: [
        { val: 'S',   label: 'Small (S)',         mod: 0  },
        { val: 'M',   label: 'Medium (M)',         mod: 0  },
        { val: 'L',   label: 'Large (L)',          mod: 0  },
        { val: 'XL',  label: 'Extra Large (XL)',   mod: 20 },
        { val: 'XXL', label: 'Double Extra (XXL)', mod: 40 },
      ]},
      { key: 'position', label: 'Print Position', type: 'select', choices: [
        { val: 'front', label: 'Front Only',   mod: 0   },
        { val: 'back',  label: 'Back Only',    mod: 10  },
        { val: 'both',  label: 'Front + Back', mod: 100 },
      ]},
    ],
    quantities: [1, 5, 10, 25, 50, 100],
    qtyDiscounts: { 25: 0.95, 50: 0.88, 100: 0.80 },
    defaultQty: 10,
  },
  {
    id: 'p3', slug: 'flex-banners', name: 'Flex Banners',
    category: 'signage',
    desc: 'Indoor/outdoor weatherproof flex banners. Enter dimensions, choose material and finishing.',
    image: 'imgs/flex-banners.jpg',
    basePrice: 15, baseUnit: '/ sq.ft',
    options: [
      { key: 'dimensions', label: 'Banner Size (Feet)', type: 'dimensions' },
      { key: 'material', label: 'Flex Material', type: 'select', choices: [
        { val: 'standard', label: 'Standard Star Flex',    mod: 0  },
        { val: 'heavy',    label: 'Black Back Heavy Flex', mod: 8  },
        { val: 'vinyl',    label: 'Eco-Solvent Vinyl',     mod: 20 },
      ]},
      { key: 'finishing', label: 'Edge Finishing', type: 'select', choices: [
        { val: 'none',    label: 'Cut to Size',        mod: 0  },
        { val: 'corners', label: 'Eyelets — 4 Corners', mod: 20 },
        { val: 'border',  label: 'Eyelets — Every 2 Ft', mod: 50 },
      ]},
    ],
    quantities: [1, 2, 5, 10],
    qtyDiscounts: {},
    defaultQty: 1,
  },
  {
    id: 'p4', slug: 'flyers', name: 'Flyers & Pamphlets',
    category: 'marketing',
    desc: 'Vibrant promotional flyers on glossy or matte art paper. A4, A5, or DL sizes.',
    image: 'imgs/flyers.jpg',
    basePrice: 199, baseUnit: '/ 500 pcs',
    options: [
      { key: 'size', label: 'Flyer Size', type: 'select', choices: [
        { val: 'a4', label: 'A4 — Full Page',  mod: 0   },
        { val: 'a5', label: 'A5 — Half Page',  mod: -80 },
        { val: 'dl', label: 'DL — Long Strip', mod: -60 },
      ]},
      { key: 'sides', label: 'Print Sides', type: 'select', choices: [
        { val: 'single', label: 'Single-sided', mod: 0   },
        { val: 'double', label: 'Double-sided', mod: 120 },
      ]},
      { key: 'paper', label: 'Paper Type', type: 'select', choices: [
        { val: '130gsm', label: '130 GSM Gloss Art',  mod: 0  },
        { val: '170gsm', label: '170 GSM Heavy Gloss', mod: 60 },
        { val: 'matte',  label: '150 GSM Matte Art',  mod: 40 },
      ]},
    ],
    quantities: [100, 500, 1000, 5000],
    qtyDiscounts: { 1000: 0.88, 5000: 0.72 },
    defaultQty: 500,
  },
  {
    id: 'p5', slug: 'posters', name: 'Posters',
    category: 'marketing',
    desc: 'Large-format HD wall posters for events, décor, or promotions. Multiple sizes.',
    image: 'imgs/posters.jpg',
    basePrice: 49, baseUnit: '/ piece',
    options: [
      { key: 'size', label: 'Poster Size', type: 'select', choices: [
        { val: 'a3', label: 'A3 — 29.7 × 42 cm', mod: 0   },
        { val: 'a2', label: 'A2 — 42 × 59.4 cm', mod: 60  },
        { val: 'a1', label: 'A1 — 59.4 × 84 cm', mod: 150 },
        { val: 'a0', label: 'A0 — 84 × 119 cm',  mod: 320 },
      ]},
      { key: 'paper', label: 'Paper Stock', type: 'select', choices: [
        { val: 'gloss', label: '200 GSM Gloss', mod: 0  },
        { val: 'matte', label: '200 GSM Matte', mod: 20 },
        { val: 'satin', label: '250 GSM Satin', mod: 40 },
      ]},
    ],
    quantities: [1, 5, 10, 50],
    qtyDiscounts: { 10: 0.90, 50: 0.78 },
    defaultQty: 5,
  },
  {
    id: 'p6', slug: 'brochures', name: 'Brochures',
    category: 'marketing',
    desc: 'Bi-fold or tri-fold brochures on premium glossy card. Great for menus and product sheets.',
    image: 'imgs/brochures.jpg',
    basePrice: 8, baseUnit: '/ piece',
    options: [
      { key: 'fold', label: 'Fold Style', type: 'select', choices: [
        { val: 'bifold',  label: 'Bi-fold (4 panels)',  mod: 0 },
        { val: 'trifold', label: 'Tri-fold (6 panels)', mod: 2 },
        { val: 'zfold',   label: 'Z-fold (6 panels)',   mod: 2 },
      ]},
      { key: 'paper', label: 'Paper Stock', type: 'select', choices: [
        { val: '130gsm', label: '130 GSM Gloss',         mod: 0 },
        { val: '170gsm', label: '170 GSM Premium Gloss', mod: 3 },
        { val: '300gsm', label: '300 GSM Card (menus)',  mod: 8 },
      ]},
    ],
    quantities: [50, 100, 500, 1000],
    qtyDiscounts: { 500: 0.85, 1000: 0.75 },
    defaultQty: 100,
  },
  {
    id: 'p7', slug: 'stickers', name: 'Stickers & Labels',
    category: 'stationery',
    desc: 'Die-cut custom stickers on gloss, matte, or waterproof vinyl material.',
    image: 'imgs/stickers.svg',
    basePrice: 199, baseUnit: '/ 100 pcs',
    options: [
      { key: 'shape', label: 'Sticker Shape', type: 'select', choices: [
        { val: 'circle',    label: 'Circle',         mod: 0  },
        { val: 'square',    label: 'Square',         mod: 0  },
        { val: 'rectangle', label: 'Rectangle',      mod: 0  },
        { val: 'custom',    label: 'Custom Die-Cut', mod: 80 },
      ]},
      { key: 'material', label: 'Material', type: 'select', choices: [
        { val: 'paper',       label: 'Gloss Paper',             mod: 0   },
        { val: 'vinyl',       label: 'Waterproof White Vinyl',  mod: 100 },
        { val: 'transparent', label: 'Transparent Vinyl',       mod: 120 },
      ]},
      { key: 'size', label: 'Sticker Size', type: 'select', choices: [
        { val: '2x2', label: '2″ × 2″', mod: 0   },
        { val: '3x3', label: '3″ × 3″', mod: 80  },
        { val: '4x4', label: '4″ × 4″', mod: 180 },
      ]},
    ],
    quantities: [50, 100, 250, 500, 1000],
    qtyDiscounts: { 250: 0.90, 500: 0.82, 1000: 0.72 },
    defaultQty: 100,
  },
  {
    id: 'p8', slug: 'custom-print', name: 'Custom Printing',
    category: 'specialty',
    desc: 'Have something unusual? Tell us what you need and we\'ll call you back with a quote.',
    image: 'imgs/custom-print.jpg',
    basePrice: 0, baseUnit: '/ quote',
    options: [
      { key: 'description', label: 'Describe your requirement', type: 'textarea' },
    ],
    quantities: [1],
    qtyDiscounts: {},
    defaultQty: 1,
  },
];
