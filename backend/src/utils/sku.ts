import Counter from '../models/Counter';

// Builds a short, readable code from a category name, e.g.
// "Handmade Bags" -> "HB", "Pasalubong Foods" -> "PF", "Furniture" -> "FURN".
const categoryCode = (category: string): string => {
  const words = category.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'GEN';
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
};

// Generates the next SKU for a product, e.g. NAPPA-HB-001, NAPPA-HB-002, ...
// Numbering is per category code and keeps counting up (never reused),
// matching the "Nappa-(product)-001 pataas" format requested.
export const generateSku = async (category: string): Promise<string> => {
  const code = categoryCode(category);
  const counter = await Counter.findOneAndUpdate(
    { name: `sku_${code}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const seq = String(counter.seq).padStart(3, '0');
  return `NAPPA-${code}-${seq}`;
};
