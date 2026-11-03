import React from 'react';

interface IconProps {
  className?: string;
}

export const BrickIcon: React.FC<IconProps> = ({className = 'w-6 h-6'}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="2.5" y="4.5" width="8.5" height="6" rx="1.2" />
    <rect x="13" y="4.5" width="8.5" height="6" rx="1.2" />
    <rect x="2.5" y="13.5" width="5" height="6" rx="1.2" />
    <rect x="9.5" y="13.5" width="6.5" height="6" rx="1.2" />
    <rect x="18" y="13.5" width="3.5" height="6" rx="1" />
  </svg>
);

export const BlockIcon: React.FC<IconProps> = ({className = 'w-6 h-6'}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
    <rect x="6" y="9" width="4.5" height="6" rx="0.8" />
    <rect x="13.5" y="9" width="4.5" height="6" rx="0.8" />
  </svg>
);

export const CementBagIcon: React.FC<IconProps> = ({className = 'w-6 h-6'}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M6.5 4h11l1.5 3.5v9A3.5 3.5 0 0 1 15.5 20h-7A3.5 3.5 0 0 1 5 16.5v-9L6.5 4Z" />
    <path d="M5.5 7.5h13" />
    <path d="M9.5 12h5" />
    <path d="M10.5 15h3" />
  </svg>
);

export const SandPileIcon: React.FC<IconProps> = ({className = 'w-6 h-6'}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M2.5 18.5 10.2 8.2a2.3 2.3 0 0 1 3.6 0l7.7 10.3H2.5Z" />
    <circle cx="12" cy="13.5" r="0.7" fill="currentColor" />
    <circle cx="9.5" cy="15.5" r="0.7" fill="currentColor" />
    <circle cx="14.5" cy="15.5" r="0.7" fill="currentColor" />
  </svg>
);

export const MortarTubIcon: React.FC<IconProps> = ({className = 'w-6 h-6'}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M3 11h18l-2 8H5l-2-8Z" />
    <path d="M6.5 11c1.2-2.2 3.2-3.5 5.5-3.5s4.3 1.3 5.5 3.5" />
  </svg>
);

export const WallAreaIcon: React.FC<IconProps> = ({className = 'w-6 h-6'}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 9.5h18" />
    <path d="M3 14.5h18" />
    <path d="M9 4v5.5" />
    <path d="M15 9.5v5" />
    <path d="M10 14.5V20" />
  </svg>
);
