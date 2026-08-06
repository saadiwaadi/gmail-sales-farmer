import React from 'react';
import { CloseIcon } from './icons';

export default function Slideover({
  show,
  onClose,
  title,
  subtitle,
  headerActions,
  children
}) {
  return (
    <>
      <div
        className={`overlay ${show ? 'show' : ''}`}
        onClick={onClose}
        style={{ pointerEvents: show ? 'auto' : 'none' }}
      ></div>
      <aside className={`slideover ${show ? 'show' : ''}`}>
        <div className="so-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
          <div>
            <div className="view-title" id="soTitle">{title}</div>
            <div className="view-sub" id="soSub">{subtitle}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
            {headerActions && <div id="soHeadActions">{headerActions}</div>}
            <button className="icon-btn" id="soClose" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
        </div>
        <div className="so-body" id="soBody">
          {children}
        </div>
      </aside>
    </>
  );
}
