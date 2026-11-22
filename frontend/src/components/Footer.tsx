const Footer = () => (
  <footer className="bg-bark text-paper/80 mt-auto">
    {/* Phones: 1 column on very small screens, 2 columns on bigger phones (brand on top).
        sm and up: the original 3-column layout. */}
    <div className="container-nappa py-8 sm:py-10 grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
      <div className="min-[420px]:col-span-2 sm:col-span-1">
        <div className="flex items-center gap-2 mb-3">
          <img src="/images/logo.png" alt="Nappa logo" className="w-9 h-9 object-contain bg-paper rounded-full" />
          <span className="font-display text-paper text-base">Nappa Food & Crafts</span>
        </div>
        <p className="text-sm text-paper/60 max-w-xs">
          Bringing the heart of Bicolano craftsmanship and pasalubong straight from Sumlang, Camalig, Albay to your home.
        </p>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-paper mb-2 sm:mb-3 text-sm">Visit Us</p>
        <p className="text-sm text-paper/60 leading-relaxed">
          Phase 2 Sumlang Lake, Zone 4<br />Brgy. Sumlang, Camalig, Albay, Philippines
        </p>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-paper mb-2 sm:mb-3 text-sm">Get in Touch</p>
        <p className="text-sm text-paper/60 leading-relaxed break-words">
          0917-770-8925<br /><span className="break-all">nappafoodcrafts@gmail.com</span>
        </p>
      </div>
    </div>
    <div
      className="border-t border-paper/10 py-4 px-4 text-center text-[11px] sm:text-xs text-paper/40"
      style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
    >
      © {new Date().getFullYear()} Nappa Food & Crafts Pasalubong Center. All rights reserved.
    </div>
  </footer>
);

export default Footer;
