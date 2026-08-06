import React from 'react';
import { useToast } from '../../hooks/useToast';

export default function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="toast-container" id="toastContainer">
      {toasts.map(t => {
        const color = t.kind === 'attn' ? 'var(--rust)' : t.kind === 'processing' ? 'var(--amber)' : 'var(--accent)';
        return (
          <div key={t.id} className={`toast ${t.leaving ? 'leaving' : ''}`}>
            <span className="sdot" style={{ background: color }}></span>
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
