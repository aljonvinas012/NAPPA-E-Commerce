import Counter from '../models/Counter';

// Sequential, human-friendly order numbers: NAPPA-0001, NAPPA-0002, ... NAPPA-9999, NAPPA-10000, ...
// Backed by an atomic counter document so numbers never collide or repeat,
// and they always increase in the order the orders were placed (same
// number is shown to the customer and to the admin).
export const generateOrderNumber = async (): Promise<string> => {
  const counter = await Counter.findOneAndUpdate(
    { name: 'orderNumber' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `NAPPA-${counter.seq.toString().padStart(4, '0')}`;
};
