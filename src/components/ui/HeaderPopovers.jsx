import React from 'react';
import { Link } from 'react-router-dom';
import { PERIODS, LANGUAGES, CURRENT_USER } from '../../data/storeData';

export function PeriodPopover({ activePeriod, onSelectPeriod, onClose }) {
  return (
    <div id="header-popover-period" className="header-popover popover-period" role="menu" aria-label="Khoảng thời gian">
      <div className="popover-title">Khoảng thời gian</div>
      {PERIODS.map((p) => {
        const isChecked = p.id === activePeriod.id;
        return (
          <button
            key={p.id}
            type="button"
            role="menuitemradio"
            aria-checked={isChecked}
            data-period={p.id}
            onClick={() => {
              onSelectPeriod(p);
              onClose();
            }}
          >
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"></path>
              </svg>
            </span>
            <span>
              <strong>{p.label}</strong>
              <small>{p.range}</small>
            </span>
            {isChecked && (
              <span className="icon" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function LanguagePopover({ activeLang, onSelectLang, onClose }) {
  return (
    <div id="header-popover-language" className="header-popover popover-language" role="menu" aria-label="Ngôn ngữ">
      <div className="popover-title">Chọn ngôn ngữ</div>
      {LANGUAGES.map((l) => {
        const isChecked = l.id === activeLang.id;
        return (
          <button
            key={l.id}
            type="button"
            role="menuitemradio"
            aria-checked={isChecked}
            data-locale={l.id}
            onClick={() => {
              onSelectLang(l);
              onClose();
            }}
          >
            <span style={{ fontSize: '18px', marginRight: '8px' }}>{l.flag}</span>
            <span lang={l.id}>{l.name}</span>
            {isChecked && (
              <span className="icon" aria-hidden="true" style={{ marginLeft: 'auto' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                  <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function NotificationsPopover({ notifications, onMarkAllRead, onMarkRead, onClose }) {
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div id="header-popover-notifications" className="header-popover popover-notifications" role="dialog" aria-label="Thông báo" style={{ width: '340px' }}>
      <div className="popover-title notification-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Thông báo hệ thống</strong>
        {unreadCount > 0 && <span className="c-status amber" style={{ fontSize: '12px' }}>{unreadCount} mới</span>}
      </div>

      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
        {notifications.map((n) => (
          <div
            key={n.id}
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid #41332115',
              backgroundColor: n.unread ? '#fff8eb' : 'transparent',
              cursor: 'pointer'
            }}
            onClick={() => onMarkRead(n.id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <strong style={{ fontSize: '13px' }}>{n.title}</strong>
              <small style={{ opacity: 0.6 }}>{n.time}</small>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#685947', lineHeight: '1.4' }}>{n.detail}</p>
          </div>
        ))}
      </div>

      {unreadCount > 0 && (
        <button
          type="button"
          style={{ width: '100%', padding: '8px', border: 'none', background: 'transparent', color: '#9d5b00', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}
          onClick={onMarkAllRead}
        >
          Đánh dấu tất cả là đã đọc
        </button>
      )}
    </div>
  );
}

export function ProfilePopover({ onClose }) {
  return (
    <div id="header-popover-profile" className="header-popover popover-profile" role="menu" aria-label="Tài khoản cá nhân" style={{ width: '220px' }}>
      <div className="popover-profile-summary" style={{ padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'center', borderBottom: '1px solid #41332115' }}>
        <span className="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#25211d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          {CURRENT_USER.avatarLetter}
        </span>
        <div>
          <strong style={{ display: 'block', fontSize: '13px' }}>{CURRENT_USER.name}</strong>
          <span style={{ fontSize: '11px', color: '#685947' }}>{CURRENT_USER.role}</span>
        </div>
      </div>

      <Link role="menuitem" to="/commerce/settings-general" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', color: 'inherit', textDecoration: 'none', fontSize: '13px' }}>
        <span>Cài đặt tài khoản</span>
      </Link>
      <Link role="menuitem" to="/commerce/users" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', color: 'inherit', textDecoration: 'none', fontSize: '13px' }}>
        <span>Thành viên nhóm</span>
      </Link>
      <button 
        type="button" 
        role="menuitem" 
        onClick={onClose}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', fontSize: '13px', cursor: 'pointer', borderTop: '1px solid #41332115', color: '#c33' }}
      >
        Đăng xuất
      </button>
    </div>
  );
}
