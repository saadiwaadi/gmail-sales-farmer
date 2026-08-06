import React from 'react';
import { AI_STATUS_LABELS } from '../../data/mockData';

export default function Badge({ status }) {
  const cls = (status || 'NOT_STARTED').toLowerCase();
  const glow = status === 'PROCESSING' ? ' glow-amber' : '';
  const label = AI_STATUS_LABELS[status] || status;

  return (
    <span className={`ai-status-badge ${cls}${glow}`}>
      <span className="sdot"></span>
      {label}
    </span>
  );
}
