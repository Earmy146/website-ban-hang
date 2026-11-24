import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function OrderRowMenu({
  order,
  onViewOrder,
  onUpdateStatus,
  onPrintLabel,
  onCancelOrder
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 228;
      const menuHeight = 195;
      let left = rect.right - menuWidth;
      if (left < 12) left = 12;
      if (left + menuWidth > window.innerWidth - 12) {
        left = window.innerWidth - menuWidth - 12;
      }

      let top = rect.bottom + 6;
      if (top + menuHeight > window.innerHeight - 12) {
        top = Math.max(12, rect.top - menuHeight - 6);
      }
      setCoords({ top, left });
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    const handleScroll = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  return (
    <div className="product-row-menu order-row-menu">
      <button 
        ref={triggerRef}
        type="button" 
        className="product-row-menu-trigger" 
        onClick={toggleMenu}
        aria-label={`Mở menu thao tác cho đơn hàng ${order.id}`}
        title="Thao tác"
      >
        <span className="icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
            <path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM128,72a12,12,0,1,0-12-12A12,12,0,0,0,128,72Zm0,112a12,12,0,1,0,12,12A12,12,0,0,0,128,184Z"></path>
          </svg>
        </span>
      </button>

      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className="product-row-menu-panel order-row-menu-panel is-positioned"
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={e => e.stopPropagation()}
        >
          <button 
            type="button" 
            onClick={() => {
              setIsOpen(false);
              onViewOrder(order);
            }}
          >
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
              </svg>
            </span>
            <span>Xem đơn hàng</span>
          </button>

          <button 
            type="button" 
            onClick={() => {
              setIsOpen(false);
              onUpdateStatus(order);
            }}
          >
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31l123.31-123.31A16,16,0,0,0,227.31,73.37ZM88,208H48V168l88-88,40,40ZM192,104,152,64l24-24,40,40Z"></path>
              </svg>
            </span>
            <span>Đổi trạng thái</span>
          </button>

          <button 
            type="button" 
            onClick={() => {
              setIsOpen(false);
              onPrintLabel(order);
            }}
          >
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M216,48H184V32a16,16,0,0,0-16-16H88A16,16,0,0,0,72,32V48H40A16,16,0,0,0,24,64V176a16,16,0,0,0,16,16H72v32a16,16,0,0,0,16,16h80a16,16,0,0,0,16-16V192h32a16,16,0,0,0,16-16V64A16,16,0,0,0,216,48ZM88,32h80V48H88ZM168,224H88V168h80Zm48-48H184V160a8,8,0,0,0-8-8H80a8,8,0,0,0-8,8v16H40V64H216V176Zm-24-88a12,12,0,1,1-12-12A12,12,0,0,1,192,88Z"></path>
              </svg>
            </span>
            <span>In nhãn vận đơn</span>
          </button>

          <button 
            type="button" 
            className="is-danger" 
            onClick={() => {
              setIsOpen(false);
              onCancelOrder(order);
            }}
          >
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
              </svg>
            </span>
            <span>Hủy đơn hàng</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
