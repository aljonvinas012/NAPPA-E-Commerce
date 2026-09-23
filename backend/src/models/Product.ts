import mongoose, { Schema, Document } from 'mongoose';

// Category used to be a fixed enum, which meant a brand-new category typed
// in by the admin (e.g. "Key Chains") would fail validation and silently
// never show up on the client shop. It's now a free-form string so any
// new category an admin adds is saved as-is and immediately shows up on
// the client (Products/ClientHome pages build their category chips from
// whatever categories actually exist in the product list).
export type ProductCategory = string;

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  sku: string;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    // e.g. NAPPA-HB-001. Auto-generated on create (see productController),
    // unique, sparse so older records created before this field existed
    // don't collide on `null`.
    sku: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0, min: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', category: 'text', description: 'text', sku: 'text' });

export default mongoose.model<IProduct>('Product', ProductSchema);
