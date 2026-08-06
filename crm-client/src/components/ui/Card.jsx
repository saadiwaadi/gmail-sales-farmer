import React from 'react';

export default function Card({
  children,
  className = '',
  style,
  glow = true,
  glass = false
}) {
  const cardClasses = `${glass ? 'glass' : 'card'} ${className}`;

  return (
    <div className={cardClasses} style={style}>
      {glass && <div className="glass-edge"></div>}
      {children}
      {glow && <div className="card-glow"></div>}
    </div>
  );
}
