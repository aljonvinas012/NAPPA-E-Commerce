import { useEffect, useRef } from 'react';

/**
 * Attaches an IntersectionObserver to the returned ref. Once the element
 * scrolls into view, the `in-view` class is added (see `.reveal` styles in
 * index.css), triggering a fade/slide-in transition. Used across the
 * landing page and client home for scroll animations.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}

export default useReveal;
