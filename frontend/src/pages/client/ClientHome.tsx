import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { IProduct } from '../../types';
import ProductCard from '../../components/ProductCard';
import CategoryCard from '../../components/CategoryCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import Reveal from '../../components/Reveal';

const ClientHome = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products').then(({ data }) => setProducts(data)).finally(() => setLoading(false));
  }, []);

  const bestRated = [...products].sort((a, b) => b.rating - a.rating).slice(0, 8);
  const newArrivals = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  // Category chips are built from whatever categories actually exist in
  // the catalog right now (using the first product's photo found for
  // each one) — so a brand-new category the admin adds shows up here
  // immediately, with no code changes needed.
  const categories = Array.from(new Set(products.map((p) => p.category)))
    .sort()
    .map((name) => ({
      name,
      image: products.find((p) => p.category === name)?.images[0] || '/images/logo.png',
    }));

  return (
    <div>
      {/* HERO BANNER — enlarged */}
      <section className="bg-cream/50 woven-pattern overflow-hidden">
        <div className="container-nappa py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center min-h-[420px] md:min-h-[520px]">
          <div className="animate-fade-in-up">
            <span className="inline-block text-xs font-bold tracking-wide text-oliveDark bg-olive/10 px-3 py-1.5 rounded-full mb-4">
              New Season Pasalubong
            </span>
            <h1 className="font-display text-4xl sm:text-5xl text-bark leading-tight mb-5">
              Fresh finds from our Bicolano artisans
            </h1>
            <p className="text-bark/70 mb-7 max-w-md text-base leading-relaxed">
              Explore handwoven abaca crafts, home pieces, and authentic pasalubong — freshly stocked this week.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate('/shop/products')} className="btn-primary">Browse All Products</button>
              <button onClick={() => navigate('/shop/orders')} className="btn-secondary">Track My Orders</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: '.15s' }}>
            <img src="/images/products/bag-1.jpg" className="rounded-card object-cover w-full h-48 sm:h-64 shadow-soft animate-float" />
            <img src="/images/products/rug-2.jpg" className="rounded-card object-cover w-full h-48 sm:h-64 mt-8 shadow-soft animate-float" style={{ animationDelay: '.7s' }} />
          </div>
        </div>
      </section>

      {/* CATEGORIES — right-sized */}
      <section className="container-nappa py-10">
        <h2 className="font-display text-xl text-bark mb-4">Shop by Category</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
          {categories.map((c) => (
            <CategoryCard
              key={c.name}
              name={c.name}
              image={c.image}
              onClick={() => navigate(`/shop/products?category=${encodeURIComponent(c.name)}`)}
            />
          ))}
        </div>
      </section>

      {loading ? (
        <LoadingSpinner label="Loading products..." />
      ) : (
        <>
          {/* NEW ARRIVALS */}
          <section className="container-nappa py-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-bark">New Arrivals</h2>
              <button onClick={() => navigate('/shop/products')} className="text-sm font-semibold text-oliveDark">See all →</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {newArrivals.map((p, i) => (
                <Reveal key={p._id} delay={(i % 4) * 70}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </section>

          {/* BEST RATED */}
          <section className="container-nappa py-8 pb-16">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl text-bark">Customer Favorites</h2>
              <button onClick={() => navigate('/shop/products')} className="text-sm font-semibold text-oliveDark">See all →</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {bestRated.map((p, i) => (
                <Reveal key={p._id} delay={(i % 4) * 70}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default ClientHome;
