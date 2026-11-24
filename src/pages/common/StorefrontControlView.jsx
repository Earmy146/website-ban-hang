import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../../services/api';
import {
  STOREFRONT_DEFAULTS,
  STOREFRONT_UI_STYLES,
  STOREFRONT_COLOR_THEMES,
  normalizeStorefrontConfig,
} from './moduleCatalog';
import {
  PageHeader,
  QuickGuideBanner,
  ToggleSwitch,
  ConfirmDialog,
  ToastStack,
  useToast,
  FIELD_INPUT_STYLE,
  FIELD_LABEL_STYLE,
} from './commonWidgets';

const ACCENT_PRESETS = [
  { color: '#b87d14', label: 'Vàng Hổ Phách' },
  { color: '#27342b', label: 'Xanh Rừng Veylix' },
  { color: '#2563eb', label: 'Xanh Đại Dương' },
  { color: '#db2777', label: 'Hồng Hoa Trà' },
  { color: '#7c3aed', label: 'Tím Thanh Lịch' },
];

export default function StorefrontControlView({ navInfo }) {
  const [config, setConfig] = useState(STOREFRONT_DEFAULTS);
  const [rawSettings, setRawSettings] = useState({});
  const [storeSummary, setStoreSummary] = useState({ activeProducts: 12, activeCoupons: 4 });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const { toasts, showToast } = useToast();

  const loadStoreConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cfgRes, productsRes, couponsRes] = await Promise.all([
        request('/module-configs/store').catch(() => null),
        request('/products').catch(() => []),
        request('/coupons').catch(() => []),
      ]);

      const incoming = cfgRes?.settings && typeof cfgRes.settings === 'object' ? cfgRes.settings : {};
      setRawSettings(incoming);
      setConfig(normalizeStorefrontConfig(incoming));

      setStoreSummary({
        activeProducts: Array.isArray(productsRes) ? productsRes.filter((p) => !p.isDeleted).length : 12,
        activeCoupons: Array.isArray(couponsRes) ? couponsRes.filter((c) => c.status === 'Active').length : 4,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoreConfig();
  }, [loadStoreConfig]);

  const updateField = (key, val) => {
    setConfig((prev) => ({ ...prev, [key]: val }));
  };

  const buildPayload = (cfg) => ({
    ...rawSettings,
    ...cfg,
    showAnnouncement: Boolean(cfg.announcementEnabled),
    announcement: cfg.announcementText,
    announcementBar: cfg.announcementText,
    bannerTitle: cfg.heroTitle,
    bannerSubtitle: cfg.heroSubtitle,
    primaryCtaText: cfg.heroCtaText,
    ctaText: cfg.heroCtaText,
    ctaLink: cfg.heroCtaLink,
    primaryColor: cfg.accentColor,
    defaultUiStyle: cfg.defaultUiStyle || 'veylix',
    uiStyle: cfg.defaultUiStyle || 'veylix',
    defaultColorTheme: cfg.defaultColorTheme || 'veylix',
    colorTheme: cfg.defaultColorTheme || 'veylix',
    defaultColorMode: cfg.defaultColorMode || 'light',
    colorMode: cfg.defaultColorMode || 'light',
    featuredCount: Number(cfg.featuredLimit) || 8,
    featuredProductsCount: Number(cfg.featuredLimit) || 8,
  });

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      const payload = buildPayload(config);
      const saved = await request('/module-configs/store', {
        method: 'PUT',
        body: {
          title: navInfo.title,
          group: navInfo.parent,
          settings: payload,
        },
        notifyTopbar: true,
      });
      if (saved?.settings) {
        setRawSettings(saved.settings);
      }
      showToast('Đã xuất bản giao diện & phong cách Cửa hàng trực tuyến (/store) thành công!');
    } catch (err) {
      showToast(err.message || 'Không thể lưu cấu hình Storefront', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = buildPayload(STOREFRONT_DEFAULTS);
      await request('/module-configs/store', {
        method: 'PUT',
        body: {
          title: navInfo.title,
          group: navInfo.parent,
          settings: payload,
        },
      });
      setRawSettings(payload);
      setConfig(STOREFRONT_DEFAULTS);
      setIsResetOpen(false);
      showToast('Đã khôi phục phong cách Veylix Kem Ấm sang trọng mặc định cho Storefront!');
    } catch (err) {
      showToast(err.message || 'Không thể khôi phục mặc định', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const activeStyleObj =
    STOREFRONT_UI_STYLES.find((s) => s.id === config.defaultUiStyle) || STOREFRONT_UI_STYLES[0];
  const activeThemeObj =
    STOREFRONT_COLOR_THEMES.find((t) => t.id === config.defaultColorTheme) || STOREFRONT_COLOR_THEMES[0];
  const previewPrimaryColor = activeThemeObj?.swatch || config.accentColor || '#b87d14';
  const isDarkPreview = config.defaultColorMode === 'dark';
  const previewRadius =
    config.defaultUiStyle === 'liquid-glass'
      ? '22px'
      : config.defaultUiStyle === 'flat'
        ? '12px'
        : '18px';

  return (
    <div className="general-commerce-page" style={{ paddingBottom: '40px' }}>
      <PageHeader
        navInfo={navInfo}
        subtitle="Tùy chỉnh toàn diện Cửa hàng khách mua (/store): chọn Phong cách giao diện sang trọng mặc định (Veylix Kem Ấm, Glass, Liquid Glass, Flat), Bảng màu hài hòa, Thanh thông báo và Hero Banner."
      >
        <Link
          to="/store"
          className="secondary-button"
          style={{
            background: '#fff8eb',
            borderColor: '#d9a441',
            color: '#6b4700',
            fontWeight: 750,
          }}
        >
          🛍️ Mở giao diện Cửa hàng người dùng (/store)
        </Link>
        <button
          type="submit"
          form="storefront-control-form"
          className="primary-button"
          disabled={isSaving || isLoading}
        >
          {isSaving ? 'Đang xuất bản...' : 'Lưu cấu hình'}
        </button>
      </PageHeader>

      <QuickGuideBanner
        icon="🎨"
        title="Quản lý giao diện Cửa hàng dễ hiểu trong 3 bước:"
        steps={[
          'Chọn 1 trong 4 Phong cách giao diện mềm mại & Bảng màu mặc định cho khách mới',
          'Chỉnh sửa câu chào trên Thanh thông báo và tiêu đề Hero Banner bên trái',
          'Xem kết quả ngay ở khung Mô phỏng bên phải rồi bấm "Lưu cấu hình"',
        ]}
      />

      {/* Hero CTA Card dẫn thẳng sang /store */}
      <section
        className="glass-card"
        style={{
          padding: '20px 24px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(125deg, #27342b 0%, #3a4a3f 100%)',
          color: '#f6f1e7',
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.8px',
              padding: '3px 9px',
              borderRadius: '999px',
              background: 'rgba(255, 224, 138, 0.22)',
              color: '#ffe08a',
              marginBottom: '6px',
            }}
          >
            GIAO DIỆN ĐANG CHỌN: {activeStyleObj.label.toUpperCase()}
          </span>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 750, color: '#ffffff' }}>
            Cửa hàng trực tuyến đang mở bán {storeSummary.activeProducts} sản phẩm & {storeSummary.activeCoupons} mã giảm giá
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(246, 241, 231, 0.85)' }}>
            Khách hàng cũng có thể tự đổi phong cách yêu thích qua nút <strong>🎨 Giao diện</strong> ngay trên thanh Header <code>/store</code>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            to="/store"
            className="primary-button"
            style={{
              background: '#e5a93c',
              color: '#231c10',
              fontWeight: 800,
              border: 'none',
            }}
          >
            Mở giao diện Cửa hàng người dùng (/store) →
          </Link>
          <Link
            to="/commerce/settings-maintenance"
            className="secondary-button"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)' }}
          >
            Chế độ bảo trì
          </Link>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', alignItems: 'start' }}>
        {/* CỘT TRÁI: FORM CẤU HÌNH */}
        <form
          id="storefront-control-form"
          onSubmit={handleSave}
          style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
        >
          {/* KHỐI 1: 4 PHONG CÁCH GIAO DIỆN SANG TRỌNG & 6 BẢNG MÀU HÀI HÒA */}
          <section className="glass-card" style={{ padding: '22px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 750, margin: '0 0 4px 0' }}>
              1. Phong cách Giao diện & Bảng màu mặc định cho khách mua
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#756a59' }}>
              Thiết kế mềm mại, hiện đại và dễ nhìn ngay từ lần đầu khách truy cập <code>/store</code>.
            </p>

            <label style={FIELD_LABEL_STYLE}>Chọn Phong cách Giao diện tinh tế (4 phong cách)</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              {STOREFRONT_UI_STYLES.map((st) => {
                const isSelected = config.defaultUiStyle === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    data-testid={`admin-sf-style-${st.id}`}
                    onClick={() => updateField('defaultUiStyle', st.id)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: isSelected ? '2px solid #27342b' : '1px solid #dbd0be',
                      background: isSelected ? '#f5efe2' : '#fffdf9',
                      boxShadow: isSelected ? '0 8px 20px rgba(39, 52, 43, 0.12)' : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.16s ease',
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: '13px', color: '#272016' }}>{st.label}</strong>
                    <small style={{ color: '#6e6353', fontSize: '11.5px', lineHeight: 1.4, display: 'block', marginTop: '3px' }}>
                      {st.desc}
                    </small>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px' }}>
              <div>
                <label style={FIELD_LABEL_STYLE}>Bảng màu hài hòa mặc định (6 tông màu)</label>
                <select
                  className="c-field"
                  style={FIELD_INPUT_STYLE}
                  value={config.defaultColorTheme}
                  onChange={(e) => {
                    const nextTheme = e.target.value;
                    const found = STOREFRONT_COLOR_THEMES.find((t) => t.id === nextTheme);
                    setConfig((prev) => ({
                      ...prev,
                      defaultColorTheme: nextTheme,
                      accentColor: found ? found.swatch : prev.accentColor,
                    }));
                  }}
                >
                  {STOREFRONT_COLOR_THEMES.map((th) => (
                    <option key={th.id} value={th.id}>
                      {th.label}
                    </option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '8px', marginTop: '9px', flexWrap: 'wrap' }}>
                  {STOREFRONT_COLOR_THEMES.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      title={th.label}
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          defaultColorTheme: th.id,
                          accentColor: th.swatch,
                        }))
                      }
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: th.swatch,
                        border: config.defaultColorTheme === th.id ? '2.5px solid #272016' : '2px solid #ffffff',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={FIELD_LABEL_STYLE}>Chế độ Sáng / Tối mặc định</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => updateField('defaultColorMode', 'light')}
                    className={config.defaultColorMode === 'light' ? 'primary-button' : 'secondary-button'}
                    style={{ flex: 1, justifyContent: 'center', padding: '8px 10px', fontSize: '12.5px' }}
                  >
                    ☀️ Sáng
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('defaultColorMode', 'dark')}
                    className={config.defaultColorMode === 'dark' ? 'primary-button' : 'secondary-button'}
                    style={{ flex: 1, justifyContent: 'center', padding: '8px 10px', fontSize: '12.5px' }}
                  >
                    🌙 Tối
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card" style={{ padding: '22px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 750, margin: '0 0 4px 0' }}>
              2. Thanh thông báo đầu trang (Announcement Bar)
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#756a59' }}>
              Hiển thị thông điệp Freeship hoặc mã giảm giá nổi bật ở mép trên cùng của cửa hàng.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <ToggleSwitch
                checked={Boolean(config.announcementEnabled)}
                onChange={(v) => updateField('announcementEnabled', v)}
                label="Hiển thị Thanh thông báo đầu trang"
                description="Thu hút sự chú ý ngay khi khách vừa vào trang chủ /store."
              />
              <div>
                <label style={FIELD_LABEL_STYLE}>Nội dung thanh thông báo *</label>
                <input
                  type="text"
                  required
                  className="c-field"
                  style={FIELD_INPUT_STYLE}
                  value={config.announcementText}
                  onChange={(e) => updateField('announcementText', e.target.value)}
                />
              </div>
              <div>
                <label style={FIELD_LABEL_STYLE}>Đường dẫn điều hướng khi nhấn vào</label>
                <input
                  type="text"
                  className="c-field"
                  style={FIELD_INPUT_STYLE}
                  value={config.announcementLink}
                  onChange={(e) => updateField('announcementLink', e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="glass-card" style={{ padding: '22px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 750, margin: '0 0 4px 0' }}>
              3. Khu vực Hero Banner Trang chủ
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#756a59' }}>
              Tiêu đề lớn, thông điệp truyền cảm hứng và nút kêu gọi mua sắm đầu trang.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={FIELD_LABEL_STYLE}>Nhãn giới thiệu nhỏ (Hero Badge)</label>
                <input
                  type="text"
                  className="c-field"
                  style={FIELD_INPUT_STYLE}
                  value={config.heroBadge}
                  onChange={(e) => updateField('heroBadge', e.target.value)}
                />
              </div>
              <div>
                <label style={FIELD_LABEL_STYLE}>Tiêu đề chính Hero Banner *</label>
                <input
                  type="text"
                  required
                  className="c-field"
                  style={FIELD_INPUT_STYLE}
                  value={config.heroTitle}
                  onChange={(e) => updateField('heroTitle', e.target.value)}
                />
              </div>
              <div>
                <label style={FIELD_LABEL_STYLE}>Phụ đề mô tả Hero Banner *</label>
                <textarea
                  rows={3}
                  required
                  className="c-field"
                  style={FIELD_INPUT_STYLE}
                  value={config.heroSubtitle}
                  onChange={(e) => updateField('heroSubtitle', e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={FIELD_LABEL_STYLE}>Nhãn nút kêu gọi (CTA)</label>
                  <input
                    type="text"
                    className="c-field"
                    style={FIELD_INPUT_STYLE}
                    value={config.heroCtaText}
                    onChange={(e) => updateField('heroCtaText', e.target.value)}
                  />
                </div>
                <div>
                  <label style={FIELD_LABEL_STYLE}>Đường dẫn đích CTA</label>
                  <input
                    type="text"
                    className="c-field"
                    style={FIELD_INPUT_STYLE}
                    value={config.heroCtaLink}
                    onChange={(e) => updateField('heroCtaLink', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="glass-card" style={{ padding: '22px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 750, margin: '0 0 4px 0' }}>
              4. Màu nhấn tùy chỉnh & Các phân khu Trang chủ
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#756a59' }}>
              Tùy chỉnh mã màu HEX chi tiết, số sản phẩm nổi bật và ẩn/hiện từng khối nội dung.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={FIELD_LABEL_STYLE}>Mã màu nhấn HEX</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={String(config.accentColor || '#b87d14').slice(0, 7)}
                    onChange={(e) => updateField('accentColor', e.target.value)}
                    style={{ width: '42px', height: '38px', borderRadius: '8px', border: '1px solid #d4c8b8', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="c-field"
                    style={FIELD_INPUT_STYLE}
                    value={config.accentColor}
                    onChange={(e) => updateField('accentColor', e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {ACCENT_PRESETS.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      title={p.label}
                      onClick={() => updateField('accentColor', p.color)}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: p.color,
                        border: config.accentColor === p.color ? '2px solid #272016' : '1.5px solid #fff',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={FIELD_LABEL_STYLE}>Số sản phẩm nổi bật trang chủ</label>
                <select
                  className="c-field"
                  style={FIELD_INPUT_STYLE}
                  value={config.featuredLimit}
                  onChange={(e) => updateField('featuredLimit', Number(e.target.value))}
                >
                  <option value={4}>4 sản phẩm tiêu biểu</option>
                  <option value={6}>6 sản phẩm nổi bật</option>
                  <option value={8}>8 sản phẩm (Khuyên dùng)</option>
                  <option value={12}>12 sản phẩm (Đầy đủ danh mục)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <ToggleSwitch
                checked={Boolean(config.showCategoriesSection)}
                onChange={(v) => updateField('showCategoriesSection', v)}
                label="Hiển thị lưới Danh mục sản phẩm nổi bật"
                description="Giúp khách lọc nhanh Thời trang, Balo, Gia dụng, Công nghệ trong 1 chạm."
              />
              <ToggleSwitch
                checked={Boolean(config.showCouponsSection)}
                onChange={(v) => updateField('showCouponsSection', v)}
                label="Hiển thị khu vực Mã Giảm Giá 1 chạm trên trang chủ"
                description="Cho phép khách bấm lưu hoặc dùng ngay các mã HELLO10, WELCOME20, SHIPFREE."
              />
              <ToggleSwitch
                checked={Boolean(config.showReviewsSection)}
                onChange={(v) => updateField('showReviewsSection', v)}
                label="Hiển thị Đánh giá thực tế đã xác minh từ người mua"
                description="Đồng bộ trực tiếp các đánh giá Published từ /commerce/reviews."
              />
              <ToggleSwitch
                checked={Boolean(config.enableLiveChat)}
                onChange={(v) => updateField('enableLiveChat', v)}
                label="Bật bong bóng Live Chat hỗ trợ trực tuyến góc phải dưới"
                description="Tin nhắn khách gửi sẽ đổ trực tiếp về Hộp thư CSKH (/commerce/chat)."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
              <button type="button" className="secondary-button" onClick={() => setIsResetOpen(true)}>
                Khôi phục mặc định
              </button>
              <button type="submit" className="primary-button" disabled={isSaving}>
                {isSaving ? 'Đang lưu...' : 'Lưu cấu hình cửa hàng'}
              </button>
            </div>
          </section>
        </form>

        {/* CỘT PHẢI: MÔ PHỎNG TRỰC TIẾP MỀM MẠI SANG TRỌNG */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '88px' }}>
          <section className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#8a5a00', letterSpacing: '0.6px' }}>
                  LIVE PREVIEW ({config.defaultUiStyle?.toUpperCase()} · {config.defaultColorMode?.toUpperCase()})
                </span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 750 }}>Mô phỏng trực tiếp trang /store</h3>
              </div>
              <Link to="/store" style={{ fontSize: '12.5px', fontWeight: 700, color: '#27342b', textDecoration: 'underline' }}>
                Trải nghiệm thật ↗
              </Link>
            </div>

            {/* Khung trình duyệt thu nhỏ bo tròn tinh tế */}
            <div
              style={{
                borderRadius: previewRadius,
                overflow: 'hidden',
                border: isDarkPreview ? '1px solid #3f3f46' : '1px solid #dcd0bc',
                background: isDarkPreview ? '#1c1a17' : '#fcfaf5',
                color: isDarkPreview ? '#f5f2eb' : '#25211d',
                boxShadow:
                  config.defaultUiStyle === 'flat'
                    ? 'none'
                    : '0 16px 38px rgba(45, 35, 20, 0.12)',
                transition: 'all 0.25s ease',
              }}
            >
              {/* Thanh trình duyệt */}
              <div
                style={{
                  background: isDarkPreview ? '#2a2622' : '#ede4d3',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981' }} />
                <span
                  style={{
                    marginLeft: '8px',
                    flex: 1,
                    background: isDarkPreview ? '#1c1a17' : '#fffdf9',
                    color: isDarkPreview ? '#d6d0c4' : '#6b6050',
                    borderRadius: '8px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  veylix.vn/store — {activeStyleObj.label}
                </span>
              </div>

              {/* Announcement Bar */}
              {config.announcementEnabled && (
                <div
                  style={{
                    background: previewPrimaryColor,
                    color: '#ffffff',
                    textAlign: 'center',
                    padding: '6px 12px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                  }}
                >
                  {config.announcementText}
                </div>
              )}

              {/* Mini Header */}
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: isDarkPreview ? '1px solid #332e29' : '1px solid #ece3d3',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                }}
              >
                <strong style={{ fontSize: '14px', letterSpacing: '-0.3px' }}>VEYLIX.</strong>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span>Sản phẩm</span>
                  <span>Ưu đãi</span>
                  <span
                    style={{
                      padding: '3px 9px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      borderRadius: '999px',
                      border: isDarkPreview ? '1px solid #443e37' : '1px solid #dfd3bd',
                      background: isDarkPreview ? '#2a2622' : '#ffffff',
                    }}
                  >
                    🎨 Giao diện
                  </span>
                </div>
              </div>

              {/* Hero Preview */}
              <div
                style={{
                  padding: '24px 20px',
                  background: isDarkPreview
                    ? 'linear-gradient(135deg, #25211c 0%, #1c1a17 100%)'
                    : 'linear-gradient(135deg, #f6f0e4 0%, #fffdf8 100%)',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.8px',
                    padding: '3px 9px',
                    borderRadius: '999px',
                    background: `${previewPrimaryColor}22`,
                    color: previewPrimaryColor,
                    marginBottom: '8px',
                  }}
                >
                  {config.heroBadge}
                </span>
                <h4
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '19px',
                    fontWeight: 800,
                    color: isDarkPreview ? '#ffffff' : '#25211d',
                    lineHeight: 1.28,
                  }}
                >
                  {config.heroTitle}
                </h4>
                <p
                  style={{
                    margin: '0 0 14px 0',
                    fontSize: '12.5px',
                    color: isDarkPreview ? '#cfc8ba' : '#635849',
                    lineHeight: 1.5,
                  }}
                >
                  {config.heroSubtitle}
                </p>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background: previewPrimaryColor,
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 750,
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.14)',
                  }}
                >
                  {config.heroCtaText || 'Mua sắm ngay'} →
                </span>
              </div>

              {/* Mini Product Grid Preview */}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '10px' }}>
                  <strong>Sản phẩm nổi bật ({config.featuredLimit} món)</strong>
                  <span style={{ color: previewPrimaryColor, fontWeight: 750 }}>Xem tất cả</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {[
                    '/assets/images/products/everyday-tee.png',
                    '/assets/images/products/minimal-backpack.png',
                    '/assets/images/products/ceramic-mug.png',
                    '/assets/images/products/canvas-tote-bag.png',
                  ].map((img, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: isDarkPreview ? '#2a2622' : '#f5efe4',
                        borderRadius: '12px',
                        padding: '7px',
                        textAlign: 'center',
                      }}
                    >
                      <img
                        src={img}
                        alt=""
                        style={{ width: '100%', height: '46px', objectFit: 'contain', marginBottom: '4px' }}
                      />
                      <div style={{ fontSize: '10px', fontWeight: 700 }}>Món #{idx + 1}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lối tắt quản trị nội dung Storefront */}
            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Link to="/commerce/menus" className="secondary-button" style={{ justifyContent: 'center', fontSize: '12.5px' }}>
                Menu điều hướng
              </Link>
              <Link to="/commerce/faqs" className="secondary-button" style={{ justifyContent: 'center', fontSize: '12.5px' }}>
                Thư viện Hỏi đáp (FAQs)
              </Link>
              <Link to="/commerce/popups" className="secondary-button" style={{ justifyContent: 'center', fontSize: '12.5px' }}>
                Popup & Thông báo
              </Link>
              <Link to="/commerce/media" className="secondary-button" style={{ justifyContent: 'center', fontSize: '12.5px' }}>
                Thư viện Ảnh Studio
              </Link>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isResetOpen}
        title="Khôi phục giao diện Storefront mặc định"
        message="Các thiết lập Phong cách Veylix Kem Ấm sang trọng, Thanh thông báo, Hero Banner và màu nhấn sẽ trở về thiết kế chuẩn ban đầu."
        confirmLabel="Khôi phục mặc định"
        isSubmitting={isSaving}
        onConfirm={handleReset}
        onClose={() => setIsResetOpen(false)}
      />

      <ToastStack toasts={toasts} />
    </div>
  );
}
