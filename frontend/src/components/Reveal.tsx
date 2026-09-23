import { type ReactNode } from 'react';
import { useReveal } from '../hooks/useReveal';

interface RevealProps {
  children: ReactNode;
  variant?: 'up' | 'left' | 'right' | 'scale';
  delay?: number; // ms
  className?: string;
  as?: string;
}

const variantClass: Record<string, string> = {
  up: 'reveal',
  left: 'reveal reveal-left',
  right: 'reveal reveal-right',
  scale: 'reveal reveal-scale',
};

const Reveal = ({ children, variant = 'up', delay = 0, className = '', as = 'div' }: RevealProps) => {
  const ref = useReveal<HTMLDivElement>();
  const Tag = as as any;
  return (
    <Tag ref={ref} className={`${variantClass[variant]} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
};

export default Reveal;
