export interface IAddress {
  _id?: string;
  fullName: string;
  phone: string;
  region: string;
  province: string;
  city: string;
  barangay: string;
  street: string;
  postalCode: string;
  instructions?: string;
  isDefault: boolean;
}

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  addresses?: IAddress[];
}

export type ProductCategory = string;

export interface IProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  sku?: string;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface ICartItem {
  product: IProduct;
  quantity: number;
}

export interface ICart {
  _id: string;
  items: ICartItem[];
}

export interface IOrderItem {
  product: string;
  name: string;
  sku?: string;
  image: string;
  price: number;
  quantity: number;
  reviewed: boolean;
}

export type OrderStatus = 'Preparing' | 'To Ship' | 'To Receive' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface IOrder {
  _id: string;
  orderNumber: string;
  items: IOrderItem[];
  shippingAddress: IAddress;
  contactNumber: string;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  courier?: string;
  cancelReason?: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string };
}

export interface IReview {
  _id: string;
  user: { firstName: string; lastName: string; email?: string };
  product: string | { _id: string; name: string; images: string[] };
  order: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ICustomer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: string;
  status: 'active' | 'suspended';
  addresses?: IAddress[];
  createdAt: string;
  updatedAt?: string;
  orderCount: number;
  totalSpending: number;
}

export interface INotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
