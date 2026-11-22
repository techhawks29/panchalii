const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    sku: { type: String, unique: true, sparse: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    fabric: { type: String, trim: true, default: '' },      // e.g. "Pure Silk", "Cotton"
    weave: { type: String, trim: true, default: '' },        // e.g. "Kanjivaram", "Banarasi"
    occasion: [{ type: String, trim: true }],                // e.g. ["Wedding", "Festival"]
    colour: {
      name: { type: String, default: '' },
      hex: { type: String, default: '#000000' },
    },
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, default: 0 },
    images: [{ type: String }],                              // Cloudinary URLs
    description: { type: String, default: '' },
    details: { type: String, default: '' },                  // care instructions, dimensions
    tags: [{ type: String, lowercase: true }],
    inStock: { type: Boolean, default: true },
    stockCount: { type: Number, default: 1 },
    isFeatured: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    totalReviews: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    blousePiece: { type: Boolean, default: false },
    weight: { type: String, default: '' },
    length: { type: String, default: '' },
  },
  { timestamps: true }
);

productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ inStock: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
