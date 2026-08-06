import React from 'react';

export default function IconButton({
  onClick,
  children,
  className = '',
  style,
  ping = false
}) {
  return (
    <button
      onClick={onClick}
      className={`icon-btn ${className}`}
      style={style}
    >
      {children}
      {ping && <span className="ping"></span>}
    </button>
  );
}
