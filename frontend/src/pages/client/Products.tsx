import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import type { IProduct } from '../../types';
import ProductCard from '../../components/ProductCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'All';

  // Categories are fetched from whatever actually exists in the catalog —
  // a brand-new category the admin adds shows up here automatically,
  // instead of relying on a hardcoded list that could drift out of sync.
  useEffect(() => {
    api.get('/products/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: any = {};
    if (search) params.search = search;
    if (category !== 'All') params.category = category;
    api.get('/products', { params }).then(({ data }) => setProducts(data)).finally(() => setLoading(false));
  }, [search, category]);

  const handleCategoryClick = (c: string) => {
    const next = new URLSearchParams(searchParams);
    if (c === 'All') next.delete('category'); else next.set('category', c);
    setSearchParams(next);
  };

  return (
    <div className="container-nappa py-8">
      <h1 className="font-display text-2xl text-bark mb-1">
        {search ? `Results for "${search}"` : category !== 'All' ? category : 'All Products'}
      </h1>
      <p className="text-sm text-bark/50 mb-6">{products.length} product{products.length !== 1 ? 's' : ''} found</p>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 -mx-1 px-1">
        {['All', ...categories].map((c) => (
          <button
            key={c}
            onClick={() => handleCategoryClick(c)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
              category === c ? 'bg-oliveDark text-paper border-oliveDark' : 'bg-paper text-ink border-tan/50 hover:border-oliveDark'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner label="Loading products..." />
      ) : products.length === 0 ? (
        <EmptyState title="No products found" message="Try a different search term or category." />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
};

export default Products;
