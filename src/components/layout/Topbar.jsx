import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PERIODS, LANGUAGES, NOTIFICATIONS, CURRENT_USER } from '../../data/storeData';
import { PeriodPopover, LanguagePopover, NotificationsPopover, ProfilePopover } from '../ui/HeaderPopovers';
import SearchModal from '../ui/SearchModal';

export default function Topbar({ toggleMobileNav }) {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null); // 'period' | 'language' | 'notifications' | 'profile' | null
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [activePeriod, setActivePeriod] = useState(PERIODS[1]); // Mặc định 30 ngày qua
  const [activeLang, setActiveLang] = useState(LANGUAGES[0]); // Mặc định Tiếng Việt 🇻🇳
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  const headerRef = useRef(null);

  // Đóng popover khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lắng nghe phím tắt Ctrl+K hoặc Cmd+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleMenu = (menuName) => {
    setActiveMenu(prev => (prev === menuName ? null : menuName));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleMarkRead = (id) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, unread: false } : n)));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <>
      <header className="topbar" ref={headerRef}>
        <button 
          type="button" 
          className="icon-button mobile-menu" 
          data-action="toggle-sidebar" 
          aria-label="Mở thanh điều hướng" 
          aria-expanded="false"
          onClick={toggleMobileNav}
        >
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128ZM40,72H216a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16ZM216,184H40a8,8,0,0,0,0,16H216a8,8,0,0,0,0-16Z"></path>
            </svg>
          </span>
        </button>

        <div className="header-primary">
          <button 
            type="button" 
            className="search-trigger" 
            data-action="search" 
            aria-label="Tìm kiếm đơn hàng, sản phẩm, khách hàng"
            onClick={() => setIsSearchOpen(true)}
          >
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </span>
            <span>Tìm kiếm đơn hàng, sản phẩm, khách hàng...</span>
            <kbd>⌘ K</kbd>
          </button>

          <div className="header-metrics">
            <button 
              type="button" 
              className="header-metric" 
              data-action="orders"
              title="Xem danh sách đơn hàng"
              onClick={() => navigate('/commerce/orders')}
            >
              <span className="icon-tile tile-success">
                <span className="icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M230.14,58.87A8,8,0,0,0,224,56H62.68L56.6,22.57A8,8,0,0,0,48.73,16H24a8,8,0,0,0,0,16h18l25.56,140.57a24,24,0,0,0,23.6,19.43h104.9a24,24,0,0,0,23.6-19.43L231.86,66.57A8,8,0,0,0,230.14,58.87ZM104,204a12,12,0,1,1-12-12A12,12,0,0,1,104,204Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,200,204Z"></path>
                  </svg>
                </span>
              </span>
              <span>Đơn hàng<strong>1,248</strong></span>
            </button>

            <button 
              type="button" 
              className="header-metric" 
              data-action="low-stock"
              title="Xem danh sách tồn kho thấp"
              onClick={() => navigate('/commerce/stock')}
            >
              <span className="icon-tile tile-amber">
                <span className="icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.34,44-29.77,16.3-80.35-44ZM128,120,47.66,76l33.9-18.56,80.34,44ZM40,90l80,43.78v85.79L40,175.82Zm176,85.78h0l-80,43.79V133.82l32-17.51V152a8,8,0,0,0,16,0V107.55L216,90v85.77Z"></path>
                  </svg>
                </span>
              </span>
              <span>Tồn kho thấp<strong>8</strong></span>
            </button>

            <button 
              type="button" 
              className="header-metric" 
              data-action="shipments"
              title="Xem danh sách vận đơn chậm trễ"
              onClick={() => navigate('/commerce/deliveries')}
            >
              <span className="icon-tile tile-danger">
                <span className="icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M255.42,117l-14-35A15.93,15.93,0,0,0,226.58,72H192V64a8,8,0,0,0-8-8H32A16,16,0,0,0,16,72V184a16,16,0,0,0,16,16H49a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,255.42,117ZM192,88h34.58l9.6,24H192ZM32,72H176v64H32ZM80,208a16,16,0,1,1,16-16A16,16,0,0,1,80,208Zm81-24H111a32,32,0,0,0-62,0H32V152H176v12.31A32.11,32.11,0,0,0,161,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,192,208Zm48-24H223a32.06,32.06,0,0,0-31-24V128h48Z"></path>
                  </svg>
                </span>
              </span>
              <span>Chậm trễ<strong>3</strong></span>
            </button>
          </div>
        </div>

        <div className="header-tools">
          {/* Period selector */}
          <div className="header-menu-wrap" style={{ position: 'relative' }}>
            <button 
              type="button" 
              className="period-select" 
              aria-label="Khoảng thời gian" 
              aria-haspopup="menu" 
              aria-expanded={activeMenu === 'period'}
              onClick={() => toggleMenu('period')}
            >
              <span className="icon-tile tile-neutral header-control-icon">
                <span className="icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"></path>
                  </svg>
                </span>
              </span>
              <span data-period-label="">{activePeriod.label}</span>
              <span className="icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                </svg>
              </span>
            </button>

            {activeMenu === 'period' && (
              <PeriodPopover 
                activePeriod={activePeriod}
                onSelectPeriod={setActivePeriod}
                onClose={() => setActiveMenu(null)}
              />
            )}
          </div>

          {/* Language selector */}
          <div className="header-menu-wrap" style={{ position: 'relative' }}>
            <button 
              type="button" 
              className="icon-button language-trigger" 
              aria-label="Chọn ngôn ngữ" 
              aria-haspopup="menu" 
              aria-expanded={activeMenu === 'language'}
              onClick={() => toggleMenu('language')}
            >
              <span style={{ fontSize: '18px' }}>{activeLang.flag}</span>
            </button>

            {activeMenu === 'language' && (
              <LanguagePopover 
                activeLang={activeLang}
                onSelectLang={setActiveLang}
                onClose={() => setActiveMenu(null)}
              />
            )}
          </div>

          {/* Notifications */}
          <div className="header-menu-wrap" style={{ position: 'relative' }}>
            <button 
              type="button" 
              className="notification-trigger icon-button" 
              aria-label="Thông báo hệ thống" 
              aria-haspopup="dialog" 
              aria-expanded={activeMenu === 'notifications'}
              title={`${unreadCount} thông báo mới`}
              onClick={() => toggleMenu('notifications')}
            >
              <span className="icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
                </svg>
              </span>
              {unreadCount > 0 && <span className="notification-dot"></span>}
            </button>

            {activeMenu === 'notifications' && (
              <NotificationsPopover 
                notifications={notifications}
                onMarkAllRead={handleMarkAllRead}
                onMarkRead={handleMarkRead}
                onClose={() => setActiveMenu(null)}
              />
            )}
          </div>

          {/* User profile */}
          <div className="header-menu-wrap" style={{ position: 'relative' }}>
            <button 
              type="button" 
              className="profile-button" 
              aria-label="Tài khoản của tôi" 
              aria-haspopup="menu" 
              aria-expanded={activeMenu === 'profile'}
              onClick={() => toggleMenu('profile')}
            >
              <span className="avatar" style={{ borderRadius: '50%', background: '#25211d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {CURRENT_USER.avatarLetter}
              </span>
              <span className="profile-copy">
                <strong>{CURRENT_USER.name}</strong>
                <small>{CURRENT_USER.role}</small>
              </span>
              <span className="icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                </svg>
              </span>
            </button>

            {activeMenu === 'profile' && (
              <ProfilePopover onClose={() => setActiveMenu(null)} />
            )}
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
}
