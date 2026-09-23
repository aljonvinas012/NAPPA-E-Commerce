import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import type { IProduct } from '../types';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'products', label: 'Products' },
  { id: 'contact', label: 'Contact' },
];

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    api.get('/products').then(({ data }) => setProducts(data.slice(0, 8))).catch(() => {});
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      setContactStatus('error');
      return;
    }
    setContactStatus('success');
    setContactForm({ name: '', email: '', message: '' });
    setTimeout(() => setContactStatus('idle'), 5000);
  };

  return (
    <div className="bg-paper">
      {/* NAV */}
      <header className="sticky top-0 z-50 bg-paper/95 backdrop-blur border-b border-tan/30">
        <div className="container-nappa flex items-center justify-between py-3">
          <button onClick={() => scrollTo('home')} className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Nappa logo" className="w-10 h-10 object-contain" />
            <span className="hidden sm:block font-display text-sm text-bark leading-tight text-left">
              Nappa Food & Crafts<br /><span className="text-[11px] font-body text-bark/60">Pasalubong Center</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <button key={l.id} onClick={() => scrollTo(l.id)} className="text-sm font-semibold text-ink hover:text-oliveDark transition-colors">
                {l.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <button onClick={() => navigate('/shop')} className="btn-primary !py-2">Go to Shop</button>
            ) : (
              <>
                <Link to="/login" className="btn-secondary !py-2">Login</Link>
                <Link to="/register" className="btn-primary !py-2">Sign Up</Link>
              </>
            )}
          </div>

          <button className="md:hidden text-2xl text-bark" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
            {menuOpen ? <i className="fas fa-xmark" /> : <i className="fas fa-bars" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-tan/30 bg-paper animate-slide-down">
            <div className="flex flex-col px-5 py-3">
              {navLinks.map((l) => (
                <button key={l.id} onClick={() => scrollTo(l.id)} className="text-left py-2.5 text-sm font-semibold text-ink border-b border-tan/15">
                  {l.label}
                </button>
              ))}
              <div className="flex gap-3 pt-3">
                {user ? (
                  <button onClick={() => navigate('/shop')} className="btn-primary flex-1 !py-2">Go to Shop</button>
                ) : (
                  <>
                    <Link to="/login" className="btn-secondary flex-1 !py-2 text-center">Login</Link>
                    <Link to="/register" className="btn-primary flex-1 !py-2 text-center">Sign Up</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="container-nappa py-14 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div className="animate-fade-in-up">
          <span className="inline-block text-xs font-bold tracking-wide text-oliveDark bg-olive/10 px-3 py-1.5 rounded-full mb-4">
            Straight from Camalig, Albay
          </span>
          <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] text-bark mb-5">
            Discover the heart of Filipino craftsmanship
          </h1>
          <p className="text-bark/70 text-base leading-relaxed mb-7 max-w-md">
            From handwoven abaca bags to authentic Bicolano pasalubong, every product here carries
            the hands and heritage of local artisans supported by the OTOP Hub of Region V.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => scrollTo('products')} className="btn-primary">Shop the Collection</button>
            <button onClick={() => scrollTo('about')} className="btn-secondary">Our Story</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: '.15s' }}>
          <img src="/images/products/basket-2.jpg" className="rounded-card object-cover w-full h-40 sm:h-56 shadow-soft animate-float" style={{ animationDelay: '0s' }} />
          <img src="/images/products/lampshade-1.jpg" className="rounded-card object-cover w-full h-40 sm:h-56 mt-6 shadow-soft animate-float" style={{ animationDelay: '.6s' }} />
          <img src="/images/products/bag-3.jpg" className="rounded-card object-cover w-full h-40 sm:h-56 shadow-soft animate-float" style={{ animationDelay: '1.1s' }} />
          <img src="/images/products/pili-roasted.jpg" className="rounded-card object-cover w-full h-40 sm:h-56 mt-6 shadow-soft animate-float" style={{ animationDelay: '1.6s' }} />
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-cream/50 py-16 md:py-24 woven-pattern overflow-hidden">
        <div className="container-nappa grid md:grid-cols-2 gap-10 items-center">
          <Reveal variant="left" className="order-2 md:order-1">
            <img src="/images/products/furniture-3.jpg" alt="Filipino craftsmanship" className="rounded-card shadow-card w-full h-72 object-cover" />
          </Reveal>
          <Reveal variant="right" className="order-1 md:order-2">
            <h2 className="font-display text-3xl text-bark mb-4">A hub for local Bicolano artisans</h2>
            <p className="text-bark/70 leading-relaxed mb-4">
              Nappa Food and Crafts Pasalubong Center was created in 2022 to distribute and sell the local products
              of Region V, consolidating sales and marketing through DTI's One Town One Product Hub (OTOP Hub).
            </p>
            <p className="text-bark/70 leading-relaxed mb-4">
              Under the Napa Group of Companies, led by General Manager and Owner Michelle C. Napa, our first shop
              opened at Sumlang Lake in 2022 and continues to operate to this day.
            </p>
            <p className="text-bark/70 leading-relaxed">
              Today, we've grown to reinvent the distribution of high-end Bicolano products — from handmade abaca
              crafts and wooden furniture to authentic pasalubong foods — supporting local communities every step
              of the way.
            </p>
          </Reveal>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className="container-nappa py-16 md:py-24">
        <Reveal className="text-center max-w-xl mx-auto mb-10">
          <h2 className="font-display text-3xl text-bark mb-3">Handpicked from our shop</h2>
          <p className="text-bark/60">A small taste of the abaca crafts, home pieces, and pasalubong waiting for you.</p>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          {products.map((p, i) => (
            <Reveal key={p._id} variant="up" delay={(i % 4) * 80}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
        <Reveal className="text-center mt-10">
          <button onClick={() => navigate(user ? '/shop/products' : '/login')} className="btn-primary">
            View Full Collection
          </button>
        </Reveal>
      </section>

      {/* CONTACT */}
      <section id="contact" className="relative overflow-hidden bg-bark text-paper py-20 md:py-28">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-olive/25 blur-[90px] animate-float-slow pointer-events-none" />
        <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-cream/15 blur-[100px] animate-float pointer-events-none" />

        <div className="container-nappa relative grid lg:grid-cols-5 gap-10">
          <Reveal variant="left" className="lg:col-span-2 flex flex-col justify-center">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wide text-cream bg-paper/10 border border-paper/20 px-3 py-1.5 rounded-full mb-5 w-fit">
              <i className="fas fa-location-dot" /> Camalig, Albay · Region V
            </span>
            <h2 className="font-display text-3xl md:text-4xl mb-4 leading-tight">Let's talk pasalubong.</h2>
            <p className="text-paper/70 mb-8 max-w-sm leading-relaxed">
              Have a question about an order, a product, or want to become a partner artisan?
              Send us a message — our team based at Sumlang Lake usually replies within a day.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <span className="w-11 h-11 rounded-xl bg-paper/10 border border-paper/15 flex items-center justify-center shrink-0"><i className="fas fa-location-dot text-cream" /></span>
                <p className="text-sm text-paper/80 leading-relaxed pt-2">Phase 2 Sumlang Lake, Zone 4, Brgy. Sumlang, Camalig, Albay</p>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-11 h-11 rounded-xl bg-paper/10 border border-paper/15 flex items-center justify-center shrink-0"><i className="fas fa-phone text-cream" /></span>
                <p className="text-sm text-paper/80 pt-2.5">0917-770-8925</p>
              </div>
              <div className="flex items-start gap-4">
                <span className="w-11 h-11 rounded-xl bg-paper/10 border border-paper/15 flex items-center justify-center shrink-0"><i className="fas fa-envelope text-cream" /></span>
                <p className="text-sm text-paper/80 pt-2.5">nappafoodcrafts@gmail.com</p>
              </div>
            </div>
          </Reveal>

          <Reveal variant="right" className="lg:col-span-3">
            <form onSubmit={handleContactSubmit} className="bg-paper rounded-card p-7 md:p-8 text-ink shadow-card">
              <h3 className="font-display text-xl text-bark mb-1">Send us a message</h3>
              <p className="text-sm text-bark/50 mb-6">We'll get back to you as soon as we can.</p>

              {contactStatus === 'success' && (
                <div className="alert-banner alert-success"><i className="fas fa-circle-check" /> Message sent! We'll get back to you soon.</div>
              )}
              {contactStatus === 'error' && (
                <div className="alert-banner alert-danger"><i className="fas fa-circle-exclamation" /> Please fill in all fields.</div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="field-label">Name</label>
                  <div className="input-icon-wrap">
                    <i className="fas fa-user" />
                    <input
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="input-field"
                      placeholder="Juan Dela Cruz"
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">Email</label>
                  <div className="input-icon-wrap">
                    <i className="fas fa-envelope" />
                    <input
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="input-field"
                      placeholder="juan@email.com"
                    />
                  </div>
                </div>
              </div>
              <div className="mb-5">
                <label className="field-label">Message</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="input-field min-h-[120px]"
                  placeholder="How can we help?"
                />
              </div>
              <button type="submit" className="btn-primary w-full">
                Send Message <i className="fas fa-paper-plane" />
              </button>
            </form>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
