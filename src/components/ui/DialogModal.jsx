import React from 'react';

export default function DialogModal({ isOpen, title, children, onClose, wide = false }) {
  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop" 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(32, 26, 18, 0.45)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <dialog 
        className={`app-dialog ${wide ? 'wide' : ''}`}
        open 
        style={{
          margin: 0,
          width: '90%',
          maxWidth: wide ? '720px' : '520px',
          backgroundColor: '#fffdf9',
          borderRadius: '20px',
          boxShadow: '0 24px 48px rgba(0,0,0,0.22)',
          border: '1px solid #4133211f',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh'
        }}
        onClick={e => e.stopPropagation()}
      >
        <header 
          className="dialog-heading" 
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid #41332115',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fffcf5'
          }}
        >
          <h2 style={{ fontSize: '16px', margin: 0, fontWeight: '700', color: '#25211d' }}>
            {title}
          </h2>
          <button 
            type="button" 
            className="icon-button" 
            aria-label="Đóng hộp thoại"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor" width="20" height="20">
                <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
              </svg>
            </span>
          </button>
        </header>

        <div className="dialog-body" style={{ padding: '20px 22px', overflowY: 'auto' }}>
          {children}
        </div>
      </dialog>
    </div>
  );
}

