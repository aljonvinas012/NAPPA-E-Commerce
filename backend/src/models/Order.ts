import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus = 'Preparing' | 'To Ship' | 'To Receive' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  sku?: string;
  image: string;
  price: number;
  quantity: number;
  reviewed: boolean;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  region: string;
  province: string;
  city: string;
  barangay: string;
  street: string;
  postalCode: string;
  instructions?: string;
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  contactNumber: string;
  paymentMethod: 'Cash on Delivery' | 'GCash' | 'Maya' | 'Card';
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  courier: string;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  sku: { type: String },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  reviewed: { type: Boolean, default: false },
});

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: String,
    phone: String,
    region: String,
    province: String,
    city: String,
    barangay: String,
    street: String,
    postalCode: String,
    instructions: String,
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderNumber: { type: String, required: true, unique: true },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    contactNumber: { type: String, required: true },
    paymentMethod: { type: String, enum: ['Cash on Delivery', 'GCash', 'Maya', 'Card'], required: true },
    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true },
    status: { type: String, enum: ['Preparing', 'To Ship', 'To Receive', 'Completed', 'Cancelled'], default: 'Preparing' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed', 'Refunded'], default: 'Pending' },
    courier: { type: String, default: 'Nappa Delivery Team' },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', OrderSchema);
