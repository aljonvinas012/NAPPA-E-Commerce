import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router doesn't reset scroll position on navigation by itself —
// without this, scrolling down on one page and then clicking to another
// page leaves you scrolled down on the new page too. This resets the
// window to the top on every route change (but not on back/forward
// browser navigation within the same page, which is handled natively).
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
