import React from 'react';

export default function Button({
  variant = 'primary',
  onClick,
  children,
  className = '',
  style,
  disabled = false
}) {
  const variantClass = `btn-${variant}`;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn ${variantClass} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}
