import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PERIODS, LANGUAGES, NOTIFICATIONS, CURRENT_USER } from '../../data/storeData';
import { PeriodPopover, LanguagePopover, NotificationsPopover, ProfilePopover } from '../ui/HeaderPopovers';
import SearchModal from '../ui/SearchModal';
import api, { TOPBAR_REFRESH_EVENT, setGlobalPeriod } from '../../services/api';

export default function Topbar({ toggleMobileNav }) {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdminLocked, setIsAdminLocked] = useState(false);
  const [loginEmail, setLoginEmail] = useState(CURRENT_USER.email || 'alex.chen@veylix.vn');
  const [topbarToasts, setTopbarToasts] = useState([]);

  const [periods, setPeriods] = useState(PERIODS);
  const [activePeriod, setActivePeriod] = useState(PERIODS[1]);
  const [activeLang, setActiveLang] = useState(LANGUAGES[0]);
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [metrics, setMetrics] = useState({
    ordersCount: 1248,
    lowStockCount: 8,
    delayedCount: 3,
  });
  const [currentUser, setCurrentUser] = useState(CURRENT_USER);

  const headerRef = useRef(null);

  const showTopbarToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setTopbarToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setTopbarToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const loadTopbarData = useCallback(async () => {
    try {
      const [summaryData, notifData] = await Promise.all([
        api.getTopbarSummary().catch(() => null),
        api.getNotifications().catch(() => null),
      ]);

      if (summaryData) {
        setMetrics(prev => ({
          ordersCount: summaryData.ordersCount ?? prev.ordersCount,
          lowStockCount: summaryData.lowStockCount ?? prev.lowStockCount,
          delayedCount: summaryData.delayedCount ?? prev.delayedCount,
        }));
        if (summaryData.currentUser) {
          const u = summaryData.currentUser;
          setCurrentUser({
            ...CURRENT_USER,
            ...u,
            avatarLetter: u.avatarLetter || (u.name ? u.name.trim()[0].toUpperCase() : 'A'),
          });
        }
        if (Array.isArray(summaryData.periods) && summaryData.periods.length > 0) {
          setPeriods(summaryData.periods);
          setActivePeriod(curr => summaryData.periods.find(p => String(p.id) === String(curr.id)) || summaryData.periods[1] || summaryData.periods[0]);
        }
      }

      if (Array.isArray(notifData)) {
        setNotifications(notifData);
      }
    } catch {
      // Giữ nguyên dữ liệu dự phòng
    }
  }, []);

  useEffect(() => {
    loadTopbarData();
    const handleRefresh = () => loadTopbarData();
    window.addEventListener(TOPBAR_REFRESH_EVENT, handleRefresh);
    return () => window.removeEventListener(TOPBAR_REFRESH_EVENT, handleRefresh);
  }, [loadTopbarData]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleSelectPeriod = (periodItem) => {
    setActivePeriod(periodItem);
    setGlobalPeriod(periodItem.id);
    showTopbarToast(`Đã chuyển khoảng thời gian sang "${periodItem.label}"`);
  };

  const handleSelectLang = async (langItem) => {
    setActiveLang(langItem);
    try {
      const currSettings = await api.getSettings().catch(() => null);
      if (currSettings && currSettings.storeName) {
        await api.updateSettings({ ...currSettings, language: langItem.name });
      } else {
        await api.updateModuleConfig('settings-localization', {
          title: 'Ngôn ngữ & Tiền tệ',
          settings: { defaultLanguage: langItem.name, locale: langItem.id },
        });
      }
      showTopbarToast(`Đã lưu ngôn ngữ hiển thị: ${langItem.flag} ${langItem.name}`);
    } catch {
      showTopbarToast(`Đã chuyển ngôn ngữ hiển thị: ${langItem.flag} ${langItem.name}`);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    try {
      const updated = await api.markAllNotificationsRead();
      if (Array.isArray(updated)) {
        setNotifications(updated);
      }
    } catch {}
  };

  const handleMarkRead = async (id) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, unread: false } : n)));
    try {
      const updated = await api.markNotificationRead(id);
      if (updated && updated.id) {
        setNotifications(prev => prev.map(n => (n.id === id ? updated : n)));
      }
    } catch {}
  };

  const handleAdminRelogin = (e) => {
    if (e) e.preventDefault();
    setIsAdminLocked(false);
    showTopbarToast(`Chào mừng trở lại, ${currentUser.name}!`);
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
              <span>Đơn hàng<strong>{Number(metrics.ordersCount || 0).toLocaleString()}</strong></span>
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
              <span>Tồn kho thấp<strong>{Number(metrics.lowStockCount || 0).toLocaleString()}</strong></span>
            </button>

            <button 
              type="button" 
              className="header-metric" 
              data-action="shipments"
              title="Xem danh sách vận đơn chậm trễ"
              onClick={() => navigate('/commerce/fulfillment')}
            >
              <span className="icon-tile tile-danger">
                <span className="icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M255.42,117l-14-35A15.93,15.93,0,0,0,226.58,72H192V64a8,8,0,0,0-8-8H32A16,16,0,0,0,16,72V184a16,16,0,0,0,16,16H49a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A7.94,7.94,0,0,0,255.42,117ZM192,88h34.58l9.6,24H192ZM32,72H176v64H32ZM80,208a16,16,0,1,1,16-16A16,16,0,0,1,80,208Zm81-24H111a32,32,0,0,0-62,0H32V152H176v12.31A32.11,32.11,0,0,0,161,184Zm31,24a16,16,0,1,1,16-16A16,16,0,0,1,192,208Zm48-24H223a32.06,32.06,0,0,0-31-24V128h48Z"></path>
                  </svg>
                </span>
              </span>
              <span>Chậm trễ<strong>{Number(metrics.delayedCount || 0).toLocaleString()}</strong></span>
            </button>
          </div>
        </div>

        <div className="header-tools">
          {/* Nút chuyển nhanh sang Cửa hàng người dùng (/store) */}
          <Link
            to="/store"
            className="secondary-button"
            title="Xem giao diện mua sắm của khách hàng (/store)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              fontSize: '12.5px',
              fontWeight: '700',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="icon" aria-hidden="true" style={{ width: '16px', height: '16px', color: '#b87d14' }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M232,96a7.89,7.89,0,0,0-.3-2.2L217.35,43.6A16.07,16.07,0,0,0,202,32H54A16.07,16.07,0,0,0,38.65,43.6L24.31,93.8A7.89,7.89,0,0,0,24,96h0v16a40,40,0,0,0,16,32v72a8,8,0,0,0,8,8H208a8,8,0,0,0,8-8V144a40,40,0,0,0,16-32V96ZM54,48H202l11.42,40H42.61ZM200,208H56V151.2a40.57,40.57,0,0,0,8,.8,40,40,0,0,0,32-16,40,40,0,0,0,64,0,40,40,0,0,0,32,16,40.57,40.57,0,0,0,8-.8Z"></path>
              </svg>
            </span>
            <span>Xem cửa hàng</span>
          </Link>

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
                periods={periods}
                activePeriod={activePeriod}
                onSelectPeriod={handleSelectPeriod}
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
                onSelectLang={handleSelectLang}
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
                {currentUser.avatarLetter}
              </span>
              <span className="profile-copy">
                <strong>{currentUser.name}</strong>
                <small>{currentUser.role}</small>
              </span>
              <span className="icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                </svg>
              </span>
            </button>

            {activeMenu === 'profile' && (
              <ProfilePopover
                currentUser={currentUser}
                onClose={() => setActiveMenu(null)}
                onLogout={() => setIsAdminLocked(true)}
              />
            )}
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      {/* Màn hình Đăng nhập Quản trị khi bấm Đăng xuất */}
      {isAdminLocked && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'linear-gradient(135deg, #f6f1e7 0%, #eadfce 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: 'min(440px, 100%)',
              padding: '32px 28px',
              background: '#fffdf9',
              borderRadius: '22px',
              boxShadow: '0 24px 60px rgba(45, 34, 18, 0.16)',
              border: '1px solid #e6dac6',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <img src="/assets/images/veylix-mark.svg" alt="Veylix" style={{ width: '36px', height: '36px' }} />
              <div>
                <strong style={{ fontSize: '18px', display: 'block', color: '#25211d' }}>Veylix Admin</strong>
                <small style={{ color: '#776c5b' }}>Phiên quản trị đã được đăng xuất an toàn</small>
              </div>
            </div>

            <form onSubmit={handleAdminRelogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#352e22' }}>
                  Email Quản trị viên
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c8b8', fontSize: '13px', background: '#faf6ee' }}
                />
              </div>

              <button
                type="submit"
                className="primary-button"
                style={{ width: '100%', justifyContent: 'center', padding: '11px 16px', fontSize: '13.5px' }}
              >
                Đăng nhập nhanh ({currentUser.name})
              </button>

              <Link
                to="/store"
                className="secondary-button"
                style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: '13px', textDecoration: 'none', textAlign: 'center' }}
              >
                Chuyển sang giao diện Khách hàng (/store) &rarr;
              </Link>
            </form>
          </div>
        </div>
      )}

      {/* Toasts của Topbar */}
      {topbarToasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100001, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {topbarToasts.map(t => (
            <div
              key={t.id}
              style={{
                background: t.type === 'error' ? '#8a2323' : '#27342b',
                color: '#fff',
                padding: '10px 18px',
                borderRadius: '10px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
