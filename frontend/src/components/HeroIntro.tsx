import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface HeroIntroProps {
  videoSrc: string;
  poster?: string;
  logoSrc: string;
  brand?: string;
  tagline?: string;
  /** ms the logo stays on screen (after it lands) before the circle opens */
  holdMs?: number;
  /** called once the circle has fully expanded and the video is on screen */
  onDone?: () => void;
}

type Stage = 'drop' | 'expand' | 'done';

const EXPAND_MS = 1500;

/**
 * Hero intro sequence:
 *  1. "drop"   – plain dark screen, the round logo falls in and bounces. No video yet.
 *  2. "expand" – a circle opens from behind the logo and grows until it covers the
 *                whole hero. The background video is revealed *inside* that circle,
 *                so it only appears while the circle is expanding.
 *  3. "done"   – circle covers everything, onDone() fires (header + hero text appear).
 */
const HeroIntro = ({
  videoSrc,
  poster,
  logoSrc,
  brand = 'Nappa Food & Crafts',
  tagline = 'Pasalubong Center · Sumlang, Camalig, Albay',
  holdMs = 2000,
  onDone,
}: HeroIntroProps) => {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState<Stage>(reduceMotion ? 'done' : 'drop');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Radius that just reaches the farthest corner of the screen.
  const [exactRadius] = useState(() =>
    typeof window === 'undefined' ? 1200 : Math.ceil(Math.hypot(window.innerWidth, window.innerHeight) / 2) + 40
  );
  // Used after the animation so a later window resize can never leave the corners uncovered.
  const hugeRadius = 6000;

  useEffect(() => {
    if (reduceMotion) {
      videoRef.current?.play().catch(() => {});
      onDone?.();
      return;
    }
    const toExpand = setTimeout(() => {
      setStage('expand');
      videoRef.current?.play().catch(() => {});
    }, holdMs);
    const toDone = setTimeout(() => {
      setStage('done');
      onDone?.();
    }, holdMs + EXPAND_MS + 60);
    return () => {
      clearTimeout(toExpand);
      clearTimeout(toDone);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdMs, reduceMotion]);

  const radius = stage === 'drop' ? 0 : stage === 'expand' ? exactRadius : hugeRadius;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-mist">
      {/* Video — hidden by a zero-size circle until the expand stage starts */}
      <motion.div
        className="absolute inset-0 w-full h-full will-change-[clip-path]"
        initial={{ clipPath: 'circle(0px at 50% 50%)' }}
        animate={{ clipPath: `circle(${radius}px at 50% 50%)` }}
        transition={{ duration: stage === 'expand' ? EXPAND_MS / 1000 : 0, ease: [0.65, 0, 0.35, 1] }}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={videoSrc}
          poster={poster}
          muted
          loop
          playsInline
          preload="auto"
        />
      </motion.div>

      {/* Falling round logo + brand text — fade away as the circle opens */}
      <AnimatePresence>
        {stage !== 'done' && (
          <motion.div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-6"
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
          >
            <motion.div
              animate={stage === 'expand' ? { scale: 0.6, opacity: 0 } : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: 'easeIn' }}
            >
              <motion.img
                src={logoSrc}
                alt="Nappa logo"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-paper object-contain p-2 shadow-card"
                initial={{ y: -420, opacity: 0, rotate: -18 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 150, damping: 11, mass: 1, delay: 0.2 }}
              />
            </motion.div>
            <motion.div
              className="mt-5 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={stage === 'expand' ? { opacity: 0, y: 0 } : { opacity: 1, y: 0 }}
              transition={{ duration: stage === 'expand' ? 0.4 : 0.6, delay: stage === 'expand' ? 0 : 0.9 }}
            >
              <p className="font-display text-2xl sm:text-3xl text-paper tracking-wide">{brand}</p>
              <p className="text-paper/70 text-[11px] sm:text-xs tracking-[0.25em] uppercase mt-2">{tagline}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeroIntro;
