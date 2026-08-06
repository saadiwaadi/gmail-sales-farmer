import React from 'react';

export default function Modal({ show, onClose, className = '', style = {}, children }) {
  return (
    <>
      <div
        className={`overlay ${show ? 'show' : ''}`}
        onClick={onClose}
        style={{ pointerEvents: show ? 'auto' : 'none' }}
      ></div>
      <div
        className={`modal-wrap ${show ? 'show' : ''}`}
        style={{ pointerEvents: show ? 'auto' : 'none' }}
      >
        <div className={`modal ${className}`} style={style} onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </>
  );
}
