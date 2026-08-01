import React from 'react';

/**
 * SepotoLogo Component
 * Logo resmi Sepoto dengan tipografi "sepot.project"
 * di mana huruf 'o' kedua digantikan oleh ikon kamera Aperture Shutter.
 * Mendukung varian: dark, light, brand, dan gradient (headline).
 */
export default function SepotoLogo({
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'inherit'
  variant = 'dark', // 'dark' | 'light' | 'brand' | 'gradient'
}) {
  const sizeClasses = {
    sm: { text: 'text-base', icon: 'w-3 h-3 mx-[0.5px] translate-y-[1px]' },
    md: { text: 'text-lg sm:text-xl', icon: 'w-3.5 h-3.5 sm:w-4 sm:h-4 mx-[1px] translate-y-[1px]' },
    lg: { text: 'text-2xl sm:text-3xl', icon: 'w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 mx-[1.5px] translate-y-[1.5px]' },
    xl: { text: 'text-3xl sm:text-4xl', icon: 'w-6 h-6 sm:w-7 sm:h-7 mx-[2px] translate-y-[2px]' },
    inherit: { text: '', icon: 'w-[0.72em] h-[0.72em] mx-[0.04em] translate-y-[0.08em]' },
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  // Penentuan warna teks & ikon
  const textClass =
    variant === 'light'
      ? 'text-white'
      : variant === 'brand'
      ? 'text-brand'
      : variant === 'gradient'
      ? 'text-gradient-brand'
      : 'text-[#111827]';

  const iconClass =
    variant === 'light'
      ? 'text-white'
      : variant === 'brand' || variant === 'gradient'
      ? 'text-brand'
      : 'text-[#111827]';

  return (
    <div className={`inline-flex items-center font-extrabold tracking-tight select-none ${currentSize.text} ${className}`}>
      {/* Teks "sepot" */}
      <span className={textClass}>sepot</span>

      {/* Aperture Shutter Icon replacing 'o' */}
      <span className={`inline-flex items-center justify-center shrink-0 ${iconClass} ${currentSize.icon} [-webkit-text-fill-color:initial]`}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="14.31" y1="8" x2="20.05" y2="17.94" />
          <line x1="9.69" y1="8" x2="21.17" y2="8" />
          <line x1="7.38" y1="12" x2="13.12" y2="2.06" />
          <line x1="9.69" y1="16" x2="3.95" y2="6.06" />
          <line x1="14.31" y1="16" x2="2.83" y2="16" />
          <line x1="16.62" y1="12" x2="10.88" y2="21.94" />
        </svg>
      </span>

      {/* Teks ".project" */}
      <span className={textClass}>.project</span>
    </div>
  );
}
