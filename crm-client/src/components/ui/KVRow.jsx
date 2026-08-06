import React from 'react';

export default function KVRow({ label, value }) {
  return (
    <div className="kv-row">
      <span className="k">{label}</span>
      <span>{value}</span>
    </div>
  );
}
