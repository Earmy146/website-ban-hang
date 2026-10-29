import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QUICK_SEARCH_ITEMS } from '../../data/storeData';
import navData from '../../data/navigation.json';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Gom thêm danh sách các trang từ navData vào danh sách tìm kiếm
  const allSearchable = [
    ...QUICK_SEARCH_ITEMS,
    ...navData.flatMap(group => 
      group.items.flatMap(item => {
        if (item.type === 'link') return [{ type: 'page', id: item.path, title: item.title, subtitle: `Trang · ${group.groupTitle}`, path: item.path }];
        return (item.children || []).map(child => ({
          type: 'page',
          id: child.path,
          title: child.title,
          subtitle: `Trang · ${item.title}`,
          path: child.path
        }));
      })
    )
  ];

  const filtered = query.trim() === '' 
    ? QUICK_SEARCH_ITEMS 
    : allSearchable.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) || 
        item.subtitle.toLowerCase().includes(query.toLowerCase())
      );

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(32, 26, 18, 0.45)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '80px'
    }} onClick={onClose}>
      <dialog 
        className="app-dialog" 
        open 
        style={{
          margin: 0,
          width: '90%',
          maxWidth: '580px',
          backgroundColor: '#fffdf9',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          border: '1px solid #4133211f',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        <header className="dialog-heading" style={{
          padding: '14px 18px',
          borderBottom: '1px solid #41332115',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 id="dialog-title" style={{ fontSize: '15px', margin: 0, fontWeight: '600' }}>
            Tìm kiếm nhanh trong cửa hàng
          </h2>
          <button 
            type="button" 
            className="icon-button" 
            aria-label="Đóng hộp thoại"
            onClick={onClose}
          >
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
              </svg>
            </span>
          </button>
        </header>

        <div className="dialog-body" style={{ padding: '14px 18px' }}>
          <input 
            ref={inputRef}
            id="workspace-search" 
            className="search-input" 
            autoComplete="off" 
            placeholder="Nhập mã đơn, tên sản phẩm, khách hàng..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: '14px',
              borderRadius: '10px',
              border: '1px solid #41332125',
              backgroundColor: '#f7f2ea',
              outline: 'none',
              marginBottom: '12px'
            }}
          />

          <div className="search-results" style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#685947', padding: '24px 0', fontSize: '13px' }}>
                Không tìm thấy kết quả phù hợp
              </p>
            ) : (
              filtered.map((item, idx) => (
                <button 
                  key={idx}
                  type="button" 
                  className="search-result"
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.1s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f3ebe0'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span className="icon-tile tile-neutral">
                    <span className="icon" aria-hidden="true">
                      {item.type === 'order' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                          <path d="M168,152a8,8,0,0,1-8,8H96a8,8,0,0,1,0-16h64A8,8,0,0,1,168,152Zm-8-40H96a8,8,0,0,0,0,16h64a8,8,0,0,0,0-16Zm56-64V216a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V48A16,16,0,0,1,56,32H92.26a47.92,47.92,0,0,1,71.48,0H200A16,16,0,0,1,216,48ZM96,64h64a32,32,0,0,0-64,0ZM200,48H173.25A47.93,47.93,0,0,1,176,64v8a8,8,0,0,1-8,8H88a8,8,0,0,1-8-8V64a47.93,47.93,0,0,1,2.75-16H56V216H200Z"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                          <path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H32a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z"></path>
                        </svg>
                      )}
                    </span>
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '13px' }}>{item.title}</strong>
                    <small style={{ color: '#685947', fontSize: '12px' }}>{item.subtitle}</small>
                  </span>
                  <span className="icon" aria-hidden="true" style={{ opacity: 0.4 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                      <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path>
                    </svg>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
