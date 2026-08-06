import React from 'react';

export default function Modal({ show, onClose, children }) {
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
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </>
  );
}
