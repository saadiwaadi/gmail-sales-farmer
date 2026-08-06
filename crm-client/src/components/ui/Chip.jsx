import React from 'react';

export default function Chip({ active, onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`chip ${active ? 'active' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
