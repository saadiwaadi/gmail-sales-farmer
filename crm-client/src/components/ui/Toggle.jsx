import React from 'react';

export default function Toggle({ on, onChange }) {
  return (
    <div
      onClick={onChange}
      className={`switch ${on ? 'on' : ''}`}
    />
  );
}
