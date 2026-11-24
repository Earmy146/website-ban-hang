import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';

const QUICK_SETTINGS_MAP = [
  {
    to: '/commerce/store',
    icon: '🛍️',
    title: 'Tùy chỉnh giao diện Storefront',
    desc: 'Chọn phong cách Veylix sang trọng, bảng màu chủ đạo, Hero Banner & thanh thông báo /store.'
  },
  {
    to: '/commerce/settings-seo',
    icon: '🔍',
    title: 'Tối ưu SEO & Chia sẻ MXH',
    desc: 'Cấu hình Tiêu đề Google, Mô tả Meta, ảnh Open Graph và sơ đồ trang Sitemap.'
  },
  {
    to: '/commerce/shipping-rules',
    icon: '🚚',
    title: 'Phí vận chuyển & Freeship',
    desc: 'Thiết lập biểu phí giao nội thành, ngoại tỉnh, hỏa tốc và ngưỡng miễn phí ship.'
  },
  {
    to: '/commerce/taxes',
    icon: '🧾',
    title: 'Thuế VAT & Hóa đơn',
    desc: 'Cấu hình thuế giá trị gia tăng, thuế nhập khẩu và quy tắc tách thuế khi thanh toán.'
  },
  {
    to: '/commerce/settings-maintenance',
    icon: '🛠️',
    title: 'Chế độ bảo trì cửa hàng',
    desc: 'Tạm đóng cửa hàng khách mua (/store) khi nâng cấp kèm thông điệp hẹn giờ mở lại.'
  },
  {
    to: '/commerce/settings-security',
    icon: '🔐',
    title: 'Bảo mật & Phân quyền hệ thống',
    desc: 'Bật xác thực 2 lớp (2FA), giới hạn phiên đăng nhập và chính sách mật khẩu quản trị.'
  },
];

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
  const [isSaving, setIsSaving] = useState(false);

  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.getSettings();
        if (mounted && data && typeof data === 'object') {
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        if (mounted) showToast(err.message || 'Không thể tải cài đặt cửa hàng', 'error');
      }
    })();
    return () => {
      mounted = false;
    };
  }, [showToast]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        storeName: settings.storeName,
        tagline: settings.tagline,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        currency: settings.currency,
        timezone: settings.timezone,
        language: settings.language,
        taxRate: Number(settings.taxRate) || 0,
        address: settings.address,
        city: settings.city,
        country: settings.country,
        allowGuestCheckout: Boolean(settings.allowGuestCheckout),
        autoFulfill: Boolean(settings.autoFulfill),
      };
      const updated = await api.updateSettings(payload);
      if (updated && typeof updated === 'object') {
        setSettings(prev => ({ ...prev, ...updated }));
      }
      showToast('Đã lưu cấu hình cài đặt chung cửa hàng thành công!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi lưu cài đặt cửa hàng', 'error');
    } finally {
      setIsSaving(false);
    }
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
          <Link to="/store" className="secondary-button" style={{ textDecoration: 'none' }}>
            🛍️ Xem Cửa hàng (/store)
          </Link>
          <button type="submit" form="settings-form" className="primary-button" disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </header>

      {/* Bản đồ Cài đặt Nhanh trực quan */}
      <section className="glass-card" style={{ padding: '22px 24px', marginBottom: '20px' }} aria-label="Bản đồ cài đặt nhanh">
        <div style={{ marginBottom: '14px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#885600', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            BẢN ĐỒ CẤU HÌNH HỆ THỐNG
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: '750', margin: '2px 0 4px 0', color: '#2b2316' }}>
            Đi đến nhanh các phân mục cài đặt chuyên sâu
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#776c5b' }}>
            Chọn đúng khu vực bạn muốn thiết lập dưới đây (giao diện Storefront, SEO, phí giao hàng, thuế, bảo trì hoặc bảo mật).
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {QUICK_SETTINGS_MAP.map(item => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.72)',
                border: '1px solid #e6dac8',
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <span style={{ fontSize: '22px', lineHeight: 1.2 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '14px', color: '#272016' }}>{item.title}</strong>
                  <span style={{ color: '#885600', fontWeight: '700', fontSize: '13px' }}>&rarr;</span>
                </div>
                <small style={{ display: 'block', marginTop: '4px', color: '#6b6050', lineHeight: '1.45', fontSize: '12px' }}>
                  {item.desc}
                </small>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <form id="settings-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Thông tin định danh */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Thông tin định danh cửa hàng</h2>
          <p style={{ color: '#776c5b', fontSize: '13px', marginBottom: '20px' }}>Tên thương hiệu, khẩu hiệu và email chăm sóc khách hàng hiển thị trên Storefront.</p>

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
                value={settings.storeName || ''}
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
                value={settings.tagline || ''}
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
                value={settings.supportEmail || ''}
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
                value={settings.supportPhone || ''}
                onChange={e => setSettings({ ...settings, supportPhone: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Tiêu chuẩn khu vực & tiền tệ */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Khu vực, Tiền tệ & Vận hành tự động</h2>
          <p style={{ color: '#776c5b', fontSize: '13px', marginBottom: '20px' }}>Đơn vị thanh toán, múi giờ, mức thuế suất mặc định và tùy chọn thanh toán nhanh.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Tiền tệ niêm yết
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={settings.currency || 'USD ($)'}
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
                value={settings.timezone || 'Asia/Ho_Chi_Minh (GMT+7)'}
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
                min="0"
                max="100"
                className="c-field"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={settings.taxRate ?? 8}
                onChange={e => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginTop: '18px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                background: '#faf6ee',
                borderRadius: '10px',
                border: '1px solid #e6dac8',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(settings.allowGuestCheckout)}
                onChange={e => setSettings({ ...settings, allowGuestCheckout: e.target.checked })}
              />
              <div>
                <strong style={{ fontSize: '13px', display: 'block' }}>Cho phép khách mua nhanh không cần đăng ký</strong>
                <small style={{ color: '#776c5b', fontSize: '12px' }}>Giúp tăng tỷ lệ chốt đơn tại /store/checkout</small>
              </div>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                background: '#faf6ee',
                borderRadius: '10px',
                border: '1px solid #e6dac8',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={Boolean(settings.autoFulfill)}
                onChange={e => setSettings({ ...settings, autoFulfill: e.target.checked })}
              />
              <div>
                <strong style={{ fontSize: '13px', display: 'block' }}>Tự động khởi tạo vận đơn khi khách thanh toán</strong>
                <small style={{ color: '#776c5b', fontSize: '12px' }}>Chuyển thẳng đơn sang hàng đợi đóng gói tại kho</small>
              </div>
            </label>
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
                value={settings.address || ''}
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
                value={settings.city || ''}
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
                value={settings.country || ''}
                onChange={e => setSettings({ ...settings, country: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="submit" className="primary-button" disabled={isSaving} style={{ padding: '10px 24px', fontSize: '14px' }}>
            {isSaving ? 'Đang lưu...' : 'Lưu cài đặt cửa hàng'}
          </button>
        </div>
      </form>

      {/* Toasts */}
      <div className="toasts-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.type === 'error' ? '#8a2323' : '#27342b', color: '#fff', padding: '10px 18px', borderRadius: '10px', fontSize: '13px' }}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
