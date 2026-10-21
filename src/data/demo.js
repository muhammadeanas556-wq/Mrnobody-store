// Demo content for MrNobody.
// Every record here is flagged `is_demo: true`. It is used in two ways:
//   1. scripts/generate-seed.mjs turns it into supabase/seed.sql (real DB rows you can edit/delete in admin)
//   2. When Supabase env vars are missing the storefront renders it as a read-only preview.
// Photography: Unsplash (free commercial licence, https://unsplash.com/license).

export const img = (id, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const demoCategories = [
  { id: 'c0000000-0000-4000-8000-000000000001', slug: 'men', name: "Men's Clothing", position: 1, image_url: img('1617137968427-85924c800a22', 600) },
  { id: 'c0000000-0000-4000-8000-000000000002', slug: 'women', name: "Women's Clothing", position: 2, image_url: img('1515886657613-9f3515b0c78f', 600) },
  { id: 'c0000000-0000-4000-8000-000000000003', slug: 'shoes', name: 'Shoes & Footwear', position: 3, image_url: img('1542291026-7eec264c27ff', 600) },
  { id: 'c0000000-0000-4000-8000-000000000004', slug: 'watches', name: 'Watches', position: 4, image_url: img('1523275335684-37898b6baf30', 600) },
  { id: 'c0000000-0000-4000-8000-000000000005', slug: 'bags', name: 'Handbags & Backpacks', position: 5, image_url: img('1584917865442-de89df76afd3', 600) },
  { id: 'c0000000-0000-4000-8000-000000000006', slug: 'accessories', name: 'Fashion Accessories', position: 6, image_url: img('1572635196237-14b3f281503f', 600) },
  { id: 'c0000000-0000-4000-8000-000000000007', slug: 'electronics', name: 'Electronics & Gadgets', position: 7, image_url: img('1505740420928-5e560c06d30e', 600) },
  { id: 'c0000000-0000-4000-8000-000000000008', slug: 'lifestyle', name: 'Lifestyle Products', position: 8, image_url: img('1541643600914-78b084683601', 600) },
].map((c) => ({ ...c, is_visible: true, parent_id: null, description: '' }));

const cat = (slug) => demoCategories.find((c) => c.slug === slug).id;
const APPAREL = ['S', 'M', 'L', 'XL'];
const SHOE = ['40', '41', '42', '43', '44'];

// [name, category, price, compareAt, imageIds[], sizes[], colors[], flags, stockBase]
const raw = [
  ['Classic Oxford Cotton Shirt', 'men', 3490, 4990, ['1602810318383-e386cc2a3ccf', '1596755094514-f87e34085b2c'], APPAREL, ['White', 'Sky Blue'], 'fn', 12],
  ['Essential Crew Neck T-Shirt', 'men', 1490, 1990, ['1521572163474-6864f9cf17ab', '1583743814966-8936f5b7be1a'], APPAREL, ['White', 'Black'], 'fb', 25],
  ['Washed Denim Trucker Jacket', 'men', 6990, 8990, ['1591047139829-d91aecb6caea'], APPAREL, ['Indigo'], 'fn', 8],
  ['Slim Fit Stretch Jeans', 'men', 4290, null, ['1542272604-787c3835535d'], ['30', '32', '34', '36'], ['Dark Blue'], 'b', 15],
  ['Fleece Pullover Hoodie', 'men', 3990, 5490, ['1556821840-3a63f95609a7'], APPAREL, ['Grey', 'Navy'], 'fnb', 10],
  ['Biker Leather Jacket', 'men', 14990, 18990, ['1551028719-00167b16eac5'], APPAREL, ['Black'], 'f', 4],
  ['Graphic Oversized Tee', 'men', 1790, null, ['1576566588028-4147f3842f27'], APPAREL, ['Black'], 'n', 20],
  ['Floral Summer Midi Dress', 'women', 5490, 7490, ['1572804013309-59a88b7e92f1'], ['XS', 'S', 'M', 'L'], ['Ivory'], 'fnb', 9],
  ['Satin Evening Dress', 'women', 8990, 11990, ['1595777457583-95e059d581b8'], ['XS', 'S', 'M', 'L'], ['Emerald'], 'f', 5],
  ['Relaxed Linen Co-ord Set', 'women', 6490, null, ['1496747611176-843222e1e57c'], ['S', 'M', 'L'], ['Beige'], 'n', 7],
  ['Everyday Knit Cardigan', 'women', 3790, 4490, ['1483985988355-763728e1935b'], ['S', 'M', 'L'], ['Cream'], 'b', 11],
  ['Street Runner Sneakers', 'shoes', 7990, 9990, ['1542291026-7eec264c27ff'], SHOE, ['Red'], 'fb', 14],
  ['Minimal White Leather Sneakers', 'shoes', 6490, null, ['1549298916-b41d501d3772'], SHOE, ['White'], 'nb', 12],
  ['Canvas Low-Top Trainers', 'shoes', 3990, 4990, ['1525966222134-fcfa99b8ae77'], SHOE, ['Off White'], 'n', 0],
  ['Chronograph Steel Watch', 'watches', 12990, 16990, ['1523275335684-37898b6baf30', '1524592094714-0f0654e20314'], [], ['Silver'], 'fb', 6],
  ['Classic Leather Strap Watch', 'watches', 8490, null, ['1522312346375-d1a52e2b99b3'], [], ['Brown'], 'n', 9],
  ['Fitness Smart Watch', 'electronics', 9990, 12990, ['1579586337278-3befd40fd17a'], [], ['Black'], 'fnb', 13],
  ['Structured Tote Handbag', 'bags', 7490, 9490, ['1584917865442-de89df76afd3'], [], ['Tan', 'Black'], 'fb', 8],
  ['Quilted Crossbody Bag', 'bags', 5990, null, ['1548036328-c9fa89d128fa'], [], ['Black'], 'n', 6],
  ['Urban Laptop Backpack', 'bags', 4990, 6490, ['1553062407-98eeb64c6a62'], [], ['Charcoal'], 'fb', 18],
  ['Polarised Aviator Sunglasses', 'accessories', 2990, 3990, ['1572635196237-14b3f281503f'], [], ['Gold'], 'n', 22],
  ['Slim Leather Bifold Wallet', 'accessories', 2490, null, ['1627123424574-724758594e93'], [], ['Brown'], 'b', 30],
  ['Wireless Over-Ear Headphones', 'electronics', 11990, 14990, ['1505740420928-5e560c06d30e'], [], ['Black'], 'f', 7],
  ['True Wireless Earbuds', 'electronics', 4990, 6990, ['1590658268037-6bf12165a8df'], [], ['White'], 'nb', 3],
  ['Signature Eau de Parfum 100ml', 'lifestyle', 5990, null, ['1541643600914-78b084683601'], [], [], 'n', 16],
  ['Cotton Baseball Cap', 'accessories', 1290, 1690, ['1588850561407-ed78c282e89b'], [], ['Navy', 'Black'], 'b', 24],
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const pid = (i) => `p0000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`.replace(/^p/, 'a');

export const demoProducts = raw.map(([name, c, price, compare, imgs, sizes, colors, flags, stock], i) => {
  const id = pid(i);
  const slug = slugify(name);
  const sizeList = sizes.length ? sizes : [null];
  const colorList = colors.length ? colors : [null];
  const variants = [];
  let v = 0;
  for (const color of colorList) {
    for (const size of sizeList) {
      v += 1;
      const s = stock === 0 ? 0 : Math.max(0, stock - ((v * 3) % 5));
      variants.push({
        id: `b0000000-0000-4000-8${String(i + 1).padStart(3, '0')}-${String(v).padStart(12, '0')}`,
        product_id: id,
        sku: `MN-${String(i + 1).padStart(3, '0')}-${[color, size].filter(Boolean).join('-').toUpperCase().replace(/\s+/g, '') || 'STD'}`,
        size,
        color,
        price: null,
        stock: s,
        is_active: true,
      });
    }
  }
  return {
    id,
    slug,
    name,
    description: `${name} from the MrNobody demo collection. Thoughtfully designed for everyday wear with quality materials and a clean modern finish. (Demo product — replace from the admin dashboard.)`,
    category_id: cat(c),
    price,
    compare_at_price: compare,
    is_featured: flags.includes('f'),
    is_new_arrival: flags.includes('n'),
    is_best_seller: flags.includes('b'),
    status: 'active',
    is_demo: true,
    sold_count: (raw.length - i) * 3,
    meta_title: `${name} | MrNobody`,
    meta_description: `Shop ${name} at MrNobody. Cash on Delivery across Pakistan.`,
    created_at: new Date(Date.UTC(2026, 9, 20) - i * 86400000).toISOString(),
    images: imgs.map((iid, k) => ({ id: `${id}-img${k}`, product_id: id, url: img(iid), alt: `${name}${k ? ` view ${k + 1}` : ''}`, position: k })),
    variants,
  };
});

export const demoBanners = [
  {
    id: 'd0000000-0000-4000-8000-000000000001', placement: 'hero', position: 1, is_active: true, is_demo: true,
    eyebrow: 'SEASON SALE', title: "MEN'S FASHION", subtitle: 'UP TO 50% OFF',
    body: 'Sharp shirts, easy denim and everyday essentials — styled for the season.',
    button_text: 'SHOP NOW', button_link: '/shop?category=men',
    secondary_text: 'EXPLORE COLLECTION', secondary_link: '/shop?new=1',
    image_url: img('1617137968427-85924c800a22', 1100),
  },
  {
    id: 'd0000000-0000-4000-8000-000000000002', placement: 'hero', position: 2, is_active: true, is_demo: true,
    eyebrow: 'NEW SEASON', title: "WOMEN'S COLLECTION", subtitle: 'FRESH STYLES, FLAT 30% OFF',
    body: 'Flowing dresses, soft knits and co-ord sets made for every occasion.',
    button_text: 'SHOP NOW', button_link: '/shop?category=women',
    secondary_text: 'EXPLORE COLLECTION', secondary_link: '/shop?category=women&new=1',
    image_url: img('1515886657613-9f3515b0c78f', 1100),
  },
  {
    id: 'd0000000-0000-4000-8000-000000000003', placement: 'hero', position: 3, is_active: true, is_demo: true,
    eyebrow: 'LIFESTYLE DEALS', title: 'ACCESSORIES & MORE', subtitle: 'WATCHES, BAGS & GADGETS',
    body: 'Finish the look with timepieces, bags and smart everyday tech.',
    button_text: 'SHOP NOW', button_link: '/shop?category=accessories',
    secondary_text: 'VIEW DEALS', secondary_link: '/shop?sale=1',
    image_url: img('1490481651871-ab68de25d43d', 1100),
  },
  // Category collage (slot = layout position)
  { id: 'd0000000-0000-4000-8000-000000000011', placement: 'collage', slot: 'large', position: 1, is_active: true, is_demo: true, eyebrow: 'WOMEN', title: "Women's Fashion", subtitle: 'Up to 40% off new arrivals', button_text: 'SHOP NOW', button_link: '/shop?category=women', image_url: img('1483985988355-763728e1935b', 1000) },
  { id: 'd0000000-0000-4000-8000-000000000012', placement: 'collage', slot: 'small-1', position: 2, is_active: true, is_demo: true, eyebrow: 'BAGS', title: 'Handbags', subtitle: 'From Rs. 4,990', button_text: 'SHOP NOW', button_link: '/shop?category=bags', image_url: img('1548036328-c9fa89d128fa', 700) },
  { id: 'd0000000-0000-4000-8000-000000000013', placement: 'collage', slot: 'small-2', position: 3, is_active: true, is_demo: true, eyebrow: 'TIMEPIECES', title: 'Watches', subtitle: 'Save up to 25%', button_text: 'SHOP NOW', button_link: '/shop?category=watches', image_url: img('1524592094714-0f0654e20314', 700) },
  { id: 'd0000000-0000-4000-8000-000000000014', placement: 'collage', slot: 'wide', position: 4, is_active: true, is_demo: true, eyebrow: 'CARRY IN STYLE', title: 'Backpacks & Accessories', subtitle: 'Built for the daily commute', button_text: 'SHOP NOW', button_link: '/shop?category=bags', image_url: img('1553062407-98eeb64c6a62', 1100) },
  // Promotional discount banner
  { id: 'd0000000-0000-4000-8000-000000000021', placement: 'promo', position: 1, is_active: true, is_demo: true, eyebrow: 'LIMITED OFFER', title: 'Extra 10% off sneakers', subtitle: 'Use code at checkout when the promotion is active in your store.', button_text: 'SHOP SNEAKERS', button_link: '/shop?category=shoes', image_url: img('1600185365483-26d7a4cc7519', 1100) },
];

export const defaultSettings = {
  store_name: 'MrNobody',
  tagline: 'Discover Your Style',
  logo_url: '',
  favicon_url: '',
  contact_email: '',
  contact_phone: '',
  support_hours: 'Mon–Sat, 10am – 7pm',
  address: '',
  whatsapp_number: '',
  whatsapp_message: 'Hi MrNobody, I have a question about a product.',
  whatsapp_enabled: false,
  social: { facebook: '', instagram: '', tiktok: '', youtube: '' },
  announcements: [
    'Welcome to MrNobody — Discover Your Style',
    'Exclusive Deals on Fashion & Lifestyle',
    'Shop Your Favorites at Great Prices',
  ],
  announcement_left: 'Cash on Delivery available',
  announcement_right: '',
  delivery_fee: 250,
  free_shipping_threshold: 5000,
  delivery_info: 'Delivery timelines depend on your city and courier.',
  returns_info: 'See our return policy for eligibility.',
  footer_about: 'MrNobody is a multi-category store for fashion, footwear, watches, bags and everyday lifestyle products.',
  payment_methods: ['Cash on Delivery'],
  primary_color: '#087BD8',
  button_radius: 'md',
  heading_font: 'Poppins',
  trust: [
    { icon: 'truck', title: 'Fast Delivery', text: 'Shipping across Pakistan' },
    { icon: 'shield', title: 'Secure Checkout', text: 'Pay with Cash on Delivery' },
    { icon: 'rotate', title: 'Easy Returns', text: 'As per our return policy' },
    { icon: 'headset', title: 'Customer Support', text: 'Here to help Mon–Sat' },
  ],
  sections: [
    { key: 'hero', label: 'Hero slider', visible: true },
    { key: 'trust', label: 'Trust & services row', visible: true },
    { key: 'collage', label: 'Category promo banners', visible: true },
    { key: 'featured', label: 'Featured products', visible: true },
    { key: 'trending', label: 'Trending now', visible: true },
    { key: 'categories', label: 'Shop by category', visible: true },
    { key: 'bestsellers', label: 'Best sellers', visible: true },
    { key: 'newarrivals', label: 'New arrivals', visible: true },
    { key: 'promo', label: 'Promotional banner', visible: true },
    { key: 'newsletter', label: 'Newsletter', visible: true },
  ],
};

export const defaultPages = [
  { slug: 'about', title: 'About Us', body: 'MrNobody is an online store for fashion and lifestyle products, made for shoppers across Pakistan.\n\nEdit this page from Admin → Website Content.' },
  { slug: 'contact', title: 'Contact Us', body: 'Reach our support team using the contact details in the footer.\n\nEdit this page from Admin → Website Content.' },
  { slug: 'delivery', title: 'Delivery Information', body: 'We deliver across Pakistan. A delivery fee may apply, with free delivery above the threshold shown in your cart.\n\nEdit this page from Admin → Website Content.' },
  { slug: 'returns', title: 'Return Policy', body: 'Write your return and exchange policy here.\n\nEdit this page from Admin → Website Content.' },
  { slug: 'privacy', title: 'Privacy Policy', body: 'Describe how customer data (name, phone, address) is collected and used.\n\nEdit this page from Admin → Website Content.' },
  { slug: 'terms', title: 'Terms & Conditions', body: 'Write your store terms here.\n\nEdit this page from Admin → Website Content.' },
];
