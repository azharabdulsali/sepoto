import React from 'react';

/**
 * ProtectedPhoto Component
 * Mencegah klik kanan (Save Image As...), drag & drop foto ke tab/folder lain,
 * serta melengkapi foto dengan Transparent Shield Overlay & Anti-Select styling.
 */
export default function ProtectedPhoto({
  src,
  alt = 'Foto Event Sepoto',
  className = '',
  imgClassName = '',
  loading = 'lazy',
  ...props
}) {
  const handlePrevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  return (
    <div
      className={`relative select-none overflow-hidden ${className}`}
      onContextMenu={handlePrevent}
      onDragStart={handlePrevent}
      {...props}
    >
      {/* Gambar utama dengan proteksi pointer-events & user-select */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        onContextMenu={handlePrevent}
        onDragStart={handlePrevent}
        className={`select-none pointer-events-none ${imgClassName}`}
        style={{
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserDrag: 'none',
        }}
      />

      {/* Transparent Shield Overlay yang berada di atas gambar */}
      <div
        className="absolute inset-0 z-0 bg-transparent select-none pointer-events-auto"
        onContextMenu={handlePrevent}
        onDragStart={handlePrevent}
      />
    </div>
  );
}
