import mongoose, { Schema, Document } from 'mongoose';

// One row per browser/device that allowed push notifications. A user can have
// several (phone + laptop), so endpoints are unique instead of users.
export interface IPushSubscription extends Document {
  user: mongoose.Types.ObjectId;
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
