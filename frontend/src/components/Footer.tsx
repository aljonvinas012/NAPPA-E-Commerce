
const Footer = () => (
  <footer className="bg-bark text-paper/80 mt-auto">
    <div className="container-nappa py-10 grid sm:grid-cols-3 gap-8">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <img src="/images/logo.png" alt="Nappa logo" className="w-9 h-9 object-contain bg-paper rounded-full" />
          <span className="font-display text-paper text-base">Nappa Food & Crafts</span>
        </div>
        <p className="text-sm text-paper/60 max-w-xs">
          Bringing the heart of Bicolano craftsmanship and pasalubong straight from Camalig, Albay to your home.
        </p>
      </div>
      <div>
        <p className="font-semibold text-paper mb-3 text-sm">Visit Us</p>
        <p className="text-sm text-paper/60 leading-relaxed">
          Phase 2 Sumlang Lake, Zone 4<br />Brgy. Sumlang, Camalig, Albay, Philippines
        </p>
      </div>
      <div>
        <p className="font-semibold text-paper mb-3 text-sm">Get in Touch</p>
        <p className="text-sm text-paper/60 leading-relaxed">
          0917-770-8925<br />nappafoodcrafts@gmail.com
        </p>
      </div>
    </div>
    <div className="border-t border-paper/10 py-4 text-center text-xs text-paper/40">
      © {new Date().getFullYear()} Nappa Food & Crafts Pasalubong Center. All rights reserved.
    </div>
  </footer>
);

export default Footer;
