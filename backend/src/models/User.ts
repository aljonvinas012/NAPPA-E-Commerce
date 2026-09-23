import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress {
  _id?: mongoose.Types.ObjectId;
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

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  passwordHash: string;
  role: 'customer' | 'admin';
  status: 'active' | 'suspended';
  addresses: IAddress[];
  // Multi-Factor Authentication (TOTP / Authenticator App) — only ever
  // used for admin accounts. mfaSecret is the base32 TOTP secret; it's
  // generated the first time an admin logs in and mfaEnabled flips to
  // true once they've confirmed a code from their authenticator app.
  mfaEnabled: boolean;
  mfaSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  region: { type: String, required: true },
  province: { type: String, required: true },
  city: { type: String, required: true },
  barangay: { type: String, required: true },
  street: { type: String, required: true },
  postalCode: { type: String, required: true },
  instructions: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: '' },
    gender: { type: String, default: '' },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    addresses: { type: [AddressSchema], default: [], validate: [(arr: IAddress[]) => arr.length <= 3, 'Maximum of 3 addresses allowed.'] },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, select: false },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
