import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function DialogModal({ isOpen, title, children, onClose, wide = false }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="modal-backdrop-overlay" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(32, 26, 18, 0.48)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        className={`app-dialog ${wide ? 'dialog-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          margin: '0 auto',
          width: wide ? 'min(820px, calc(100vw - 32px))' : 'min(560px, calc(100vw - 32px))',
          maxHeight: 'min(88vh, 850px)',
          backgroundColor: '#fcfaf3',
          borderRadius: '22px',
          boxShadow: '0 25px 80px rgba(70, 50, 20, 0.38), 0 0 0 1px rgba(255, 255, 255, 0.8)',
          border: '1.5px solid #ffffff',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          color: '#302d24',
          animation: 'dialog-appear 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <header 
          className="dialog-heading" 
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(190, 175, 145, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 253, 248, 0.95)'
          }}
        >
          <h2 style={{ fontSize: '17px', margin: 0, fontWeight: '750', color: '#302d24', letterSpacing: '-0.3px' }}>
            {title}
          </h2>
          <button 
            type="button" 
            className="icon-button" 
            aria-label="Đóng hộp thoại"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'rgba(235, 225, 210, 0.6)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              padding: 0,
              borderRadius: '9px',
              color: '#655a47',
              transition: 'background 0.15s'
            }}
          >
            <span className="icon" aria-hidden="true" style={{ width: '18px', height: '18px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
              </svg>
            </span>
          </button>
        </header>

        <div className="dialog-body" style={{ padding: '22px 24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
