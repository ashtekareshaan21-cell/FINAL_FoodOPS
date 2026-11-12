import React from 'react';

interface IconProps {
  className?: string;
}

export function IconBrandMark({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21c-4.5-2.6-7-6.4-7-11V5.5L12 3l7 2.5V10c0 4.6-2.5 8.4-7 11z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.2l2 2 4-4.2" />
    </svg>
  );
}

export function IconDonor({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l8-4v18M13 21V5l6 3v13" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h2M8 14h2M16 11h1M16 15h1" />
    </svg>
  );
}

export function IconNgo({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 4.8-3 8.8-7 10-4-1.2-7-5.2-7-10V7l7-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12.5L11 14l3.5-3.5" />
    </svg>
  );
}

export function IconRider({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17h4l3-7h-4l-3 7zM14 7h3l1 3" />
    </svg>
  );
}

export function IconCheck({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function IconClock({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
    </svg>
  );
}

export function IconPin({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6-5.2-6-10a6 6 0 1112 0c0 4.8-6 10-6 10z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

export function IconLock({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4" />
    </svg>
  );
}

export function IconShield({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3.5V12c0 4.8-3 8.6-7 9.8-4-1.2-7-5-7-9.8V6.5L12 3z" />
    </svg>
  );
}

export function IconLeaf({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19c8 0 14-6 14-14-8 0-14 6-14 14z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19l7-7" />
    </svg>
  );
}

export function IconChart({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16M7 16v-5M12 16V7M17 16v-3" />
    </svg>
  );
}

export function IconAlert({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9l-7.5 13A2 2 0 004.5 20h15a2 2 0 001.7-3.1l-7.5-13a2 2 0 00-3.4 0z" />
    </svg>
  );
}

export function IconArrowRight({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6l6 6-6 6" />
    </svg>
  );
}
