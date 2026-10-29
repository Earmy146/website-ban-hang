import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState({
    storeName: 'Veylix Store',
    tagline: 'Thương mại trong sự hài hòa',
    supportEmail: 'support@veylix.vn',
    supportPhone: '+84 28 3822 1234',
    currency: 'USD ($)',
    timezone: 'Asia/Ho_Chi_Minh (GMT+7)',
    language: 'Tiếng Việt',
    taxRate: 8,
    address: 'Tầng 12, Tòa nhà Bitexco, Quận 1',
    city: 'TP. Hồ Chí Minh',
    country: 'Việt Nam',
    allowGuestCheckout: true,
    autoFulfill: false
  });

  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  const handleSave = (e) => {
    e.preventDefault();
    showToast('Đã lưu cấu hình cài đặt chung cửa hàng thành công!');
  };

  return (
    <div className="general-settings-page" style={{ paddingBottom: '36px' }}>
      <header className="commerce-heading">
        <div>
          <div className="commerce-breadcrumb">
            <Link to="/overview">Tổng quan</Link>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </span>
            <span>Cài đặt chung</span>
          </div>
          <h1>Cài đặt cửa hàng<span>.</span></h1>
        </div>

        <div className="commerce-heading-actions">
          <button type="submit" form="settings-form" className="primary-button">
            Lưu thay đổi
          </button>
        </div>
      </header>

      <form id="settings-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Thông tin định danh */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Thông tin định danh cửa hàng</h2>
          <p style={{ color: '#776c5b', fontSize: '13px', marginBottom: '20px' }}>Tên thương hiệu, khẩu hiệu và email chăm sóc khách hàng.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Tên cửa hàng *
              </label>
              <input 
                type="text" 
                required
                className="c-field"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={settings.storeName}
                onChange={e => setSettings({ ...settings, storeName: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Khẩu hiệu (Tagline)
              </label>
              <input 
                type="text" 
                className="c-field"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={settings.tagline}
                onChange={e => setSettings({ ...settings, tagline: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginTop: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Email hỗ trợ CSKH *
              </label>
              <input 
                type="email" 
                required
                className="c-field"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={settings.supportEmail}
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Hotline hỗ trợ
              </label>
              <input 
                type="tel" 
                className="c-field"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={settings.supportPhone}
                onChange={e => setSettings({ ...settings, supportPhone: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Tiêu chuẩn khu vực & tiền tệ */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Khu vực & Tiền tệ</h2>
          <p style={{ color: '#776c5b', fontSize: '13px', marginBottom: '20px' }}>Đơn vị thanh toán, múi giờ và mức thuế suất mặc định.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Tiền tệ niêm yết
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={settings.currency}
                onChange={e => setSettings({ ...settings, currency: e.target.value })}
              >
                <option value="USD ($)">Đô la Mỹ - USD ($)</option>
                <option value="VND (₫)">Việt Nam Đồng - VND (₫)</option>
                <option value="EUR (€)">Euro - EUR (€)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Múi giờ hệ thống
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={settings.timezone}
                onChange={e => setSettings({ ...settings, timezone: e.target.value })}
              >
                <option value="Asia/Ho_Chi_Minh (GMT+7)">Asia/Ho_Chi_Minh (GMT+7)</option>
                <option value="Asia/Singapore (GMT+8)">Asia/Singapore (GMT+8)</option>
                <option value="America/New_York (GMT-4)">America/New_York (GMT-4)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Thuế suất VAT (%)
              </label>
              <input 
                type="number" 
                className="c-field"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={settings.taxRate}
                onChange={e => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Địa chỉ trụ sở */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Địa chỉ trụ sở & Xuất kho</h2>
          <p style={{ color: '#776c5b', fontSize: '13px', marginBottom: '20px' }}>Địa chỉ này sẽ được in trên phiếu gửi hàng và hóa đơn.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Địa chỉ chi tiết
              </label>
              <input 
                type="text" 
                className="c-field"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={settings.address}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Tỉnh / Thành phố
              </label>
              <input 
                type="text" 
                className="c-field"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={settings.city}
                onChange={e => setSettings({ ...settings, city: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Quốc gia
              </label>
              <input 
                type="text" 
                className="c-field"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={settings.country}
                onChange={e => setSettings({ ...settings, country: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="submit" className="primary-button" style={{ padding: '10px 24px', fontSize: '14px' }}>
            Lưu cài đặt cửa hàng
          </button>
        </div>
      </form>

      {/* Toasts */}
      <div className="toasts-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: '#27342b', color: '#fff', padding: '10px 18px', borderRadius: '10px', fontSize: '13px' }}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
