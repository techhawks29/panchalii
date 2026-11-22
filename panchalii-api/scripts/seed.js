// Seeds sample categories, products and a hero banner for local development. Safe to re-run.
const { execFileSync } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const config = require('../src/config/config');
const Category = require('../src/models/category.model');
const Product = require('../src/models/product.model');
const Banner = require('../src/models/banner.model');
const User = require('../src/models/user.model');

const ASSET_BASE = process.env.ASSET_BASE_URL || `http://localhost:${config.port}/static/images`;
const img = (name) => `${ASSET_BASE}/${name}.png`;

const categories = [
  { slug: 'silk', name: 'Silk Sarees', description: 'Woven with heritage.', image: 'kanjivaram-maroon', sortOrder: 1 },
  { slug: 'handloom', name: 'Handloom', description: 'Artisan craftsmanship.', image: 'chanderi-ivory', sortOrder: 2 },
  { slug: 'designer', name: 'Designer', description: 'Tradition in a new light.', image: 'organza-blush', sortOrder: 3 },
];

const products = [
  { slug: 'kanjivaram-maroon', cat: 'silk', name: 'Temple Border Kanjivaram', fabric: 'Pure Silk', weave: 'Kanjivaram', colour: ['Maroon', '#7A1F2B'], price: 18499, mrp: 21999, occasion: ['Wedding', 'Festival'], featured: true, isNew: true },
  { slug: 'banarasi-emerald', cat: 'silk', name: 'Emerald Banarasi Brocade', fabric: 'Katan Silk', weave: 'Banarasi', colour: ['Emerald', '#1F6B4A'], price: 15999, mrp: 18999, occasion: ['Wedding'], featured: true },
  { slug: 'paithani-peacock', cat: 'silk', name: 'Peacock Pallu Paithani', fabric: 'Pure Silk', weave: 'Paithani', colour: ['Peacock Blue', '#1C4F7A'], price: 22999, mrp: 25999, occasion: ['Wedding', 'Festival'], featured: true },
  { slug: 'mysore-mustard', cat: 'silk', name: 'Mustard Mysore Crepe Silk', fabric: 'Crepe Silk', weave: 'Mysore', colour: ['Mustard', '#B8862B'], price: 8999, mrp: 9999, occasion: ['Festival', 'Party'], isNew: true },
  { slug: 'chanderi-ivory', cat: 'handloom', name: 'Ivory Chanderi with Zari Butis', fabric: 'Silk Cotton', weave: 'Chanderi', colour: ['Ivory', '#C9BBA0'], price: 6499, mrp: 7499, occasion: ['Festival', 'Office'], featured: true, isNew: true },
  { slug: 'ikat-indigo', cat: 'handloom', name: 'Indigo Pochampally Ikat', fabric: 'Cotton', weave: 'Ikat', colour: ['Indigo', '#2C3A6B'], price: 4299, mrp: 4999, occasion: ['Office', 'Casual'] },
  { slug: 'jamdani-sage', cat: 'handloom', name: 'Sage Dhakai Jamdani', fabric: 'Muslin Cotton', weave: 'Jamdani', colour: ['Sage', '#6E8264'], price: 7899, mrp: 8999, occasion: ['Festival'], featured: true },
  { slug: 'maheshwari-rust', cat: 'handloom', name: 'Rust Maheshwari Checks', fabric: 'Silk Cotton', weave: 'Maheshwari', colour: ['Rust', '#A3482B'], price: 3899, mrp: 0, occasion: ['Casual', 'Office'], isNew: true },
  { slug: 'organza-blush', cat: 'designer', name: 'Blush Organza with Hand Embroidery', fabric: 'Organza', weave: 'Embroidered', colour: ['Blush', '#B97C7C'], price: 12499, mrp: 14999, occasion: ['Party', 'Reception'], featured: true, isNew: true },
  { slug: 'tissue-champagne', cat: 'designer', name: 'Champagne Tissue Drape', fabric: 'Tissue Silk', weave: 'Woven', colour: ['Champagne', '#B59B6A'], price: 10999, mrp: 12999, occasion: ['Reception', 'Party'], featured: true },
  { slug: 'georgette-midnight', cat: 'designer', name: 'Midnight Sequinned Georgette', fabric: 'Georgette', weave: 'Sequin Work', colour: ['Midnight', '#1E2233'], price: 9499, mrp: 10999, occasion: ['Party'], isNew: true },
  { slug: 'kalamkari-ochre', cat: 'designer', name: 'Ochre Kalamkari Hand-painted', fabric: 'Cotton Silk', weave: 'Kalamkari', colour: ['Ochre', '#9C6B2E'], price: 5999, mrp: 6999, occasion: ['Festival', 'Casual'], inStock: false },
];

const story = (p) =>
  `A ${p.weave.toLowerCase()} ${p.fabric.toLowerCase()} saree in ${p.colour[0].toLowerCase()}, finished with a woven gold border and a richly detailed pallu. ` +
  'Handcrafted by master weavers, it drapes with an easy fall and comes with an unstitched blouse piece.';

const run = async () => {
  execFileSync('python3', [path.join(__dirname, 'generate-sample-images.py'), ...products.map((p) => `${p.slug}:${p.colour[1]}`)], { stdio: 'inherit' });

  await mongoose.connect(config.mongoose.url);

  const catIds = {};
  for (const c of categories) {
    const doc = await Category.findOneAndUpdate(
      { slug: c.slug },
      { name: c.name, description: c.description, image: img(c.image), sortOrder: c.sortOrder, isActive: true, parentCategory: null },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    catIds[c.slug] = doc._id;
  }

  // Insert oldest-first so "newest" sort shows the isNew items on top
  for (const [i, p] of [...products].reverse().entries()) {
    await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        name: p.name,
        category: catIds[p.cat],
        fabric: p.fabric,
        weave: p.weave,
        occasion: p.occasion,
        colour: { name: p.colour[0], hex: p.colour[1] },
        price: p.price,
        mrp: p.mrp,
        images: [img(p.slug)],
        description: story(p),
        details: 'Length 5.5 m + 0.8 m blouse piece. Dry clean only.',
        tags: [p.weave, p.fabric, ...p.occasion].map((t) => t.toLowerCase()),
        inStock: p.inStock !== false,
        stockCount: p.inStock === false ? 0 : 5,
        isFeatured: !!p.featured,
        isNew: !!p.isNew,
        isActive: true,
        blousePiece: true,
        length: '5.5 m',
        createdAt: new Date(Date.now() - (products.length - i) * 60_000),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, timestamps: false },
    );
  }

  await Banner.findOneAndUpdate(
    { position: 'home_hero', title: 'More Than Fashion' },
    { subtitle: 'A story in every drape.', image: `${ASSET_BASE}/hero.jpg`, link: '/shop', sortOrder: 0, isActive: true },
    { upsert: true, new: true },
  );

  // First-run admin from .env; an existing admin's password is never reset
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  let adminNote = 'no admin (set ADMIN_EMAIL and ADMIN_PASSWORD in .env)';
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    const email = ADMIN_EMAIL.toLowerCase();
    const existing = await User.findOne({ email });
    if (!existing) {
      await new User({ name: 'Panchalii Admin', email, passwordHash: ADMIN_PASSWORD, role: 'admin', isVerified: true }).save();
      adminNote = `admin ${email} created`;
    } else {
      adminNote = `admin ${email} already exists`;
    }
  }

  console.log(`Seeded ${categories.length} categories, ${products.length} products, 1 banner; ${adminNote}`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
