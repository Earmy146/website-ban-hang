import React from 'react';
import { SfIcon } from './StoreIcons';
import { useStore } from './StoreContext';

export const SF_UI_STYLES = [
  {
    id: 'veylix',
    icon: '🏛️',
    label: 'Veylix Kem Ấm (Mặc định)',
    desc: 'Bo góc mềm mại, nền kem ấm & bóng đổ mịn sang trọng',
  },
  {
    id: 'glass',
    icon: '✨',
    label: 'Thủy Tinh Mờ (Glass)',
    desc: 'Hiệu ứng kính mờ trong trẻo, thoáng đãng chiều sâu',
  },
  {
    id: 'liquid-glass',
    icon: '💧',
    label: 'Kính Lỏng Hiện Đại',
    desc: 'Ánh kính khúc xạ tinh tế theo phong cách không gian số',
  },
  {
    id: 'flat',
    icon: '□',
    label: 'Tối Giản Tinh Khôi (Flat)',
    desc: 'Gọn gàng, phẳng phiu, thanh lịch & nhẹ nhàng',
  },
];

export const SF_COLOR_THEMES = [
  { id: 'veylix', emoji: '🏛️', label: 'Vàng Hổ Phách Veylix', swatch: '#b87d14' },
  { id: 'xanh-rung', emoji: '🌿', label: 'Xanh Rừng Ngọc Lục', swatch: '#0f7650' },
  { id: 'xanh-duong', emoji: '🌊', label: 'Xanh Đại Dương', swatch: '#0369a1' },
  { id: 'hong', emoji: '🌸', label: 'Hồng Phấn Tinh Tế', swatch: '#be185d' },
  { id: 'tim', emoji: '👑', label: 'Tím Lavender', swatch: '#6d28d9' },
  { id: 'cam', emoji: '🔥', label: 'Cam Ấm Hiện Đại', swatch: '#c2410c' },
];

export function ThemePersonalizerSection() {
  const {
    uiStyle,
    colorTheme,
    colorMode,
    setUiStyle,
    setColorTheme,
    setColorMode,
    resetUiPreferences,
  } = useStore();

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* 1. Light / Dark Mode */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', color: 'var(--sf-text-muted)' }}>
          1. Chế độ Ánh sáng màn hình
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            data-mode-option="light"
            className={`sf-style-option ${colorMode === 'light' ? 'is-active' : ''}`}
            onClick={() => setColorMode('light')}
          >
            <strong style={{ display: 'block', fontSize: '14px' }}>☀️ Chế độ Sáng (Light)</strong>
            <small style={{ color: 'var(--sf-text-muted)', fontSize: '12px' }}>Nền kem sáng dịu mắt</small>
          </button>
          <button
            type="button"
            data-mode-option="dark"
            className={`sf-style-option ${colorMode === 'dark' ? 'is-active' : ''}`}
            onClick={() => setColorMode('dark')}
          >
            <strong style={{ display: 'block', fontSize: '14px' }}>🌙 Chế độ Tối (Dark)</strong>
            <small style={{ color: 'var(--sf-text-muted)', fontSize: '12px' }}>Êm dịu khi mua sắm ban đêm</small>
          </button>
        </div>
      </div>

      {/* 2. 4 Elegant UI Styles */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', color: 'var(--sf-text-muted)' }}>
          2. Phong cách Thiết kế ({SF_UI_STYLES.length} phong cách tinh tế)
        </div>
        <div className="sf-style-grid">
          {SF_UI_STYLES.map((st) => {
            const active = uiStyle === st.id;
            return (
              <button
                key={st.id}
                type="button"
                data-style-option={st.id}
                className={`sf-style-option ${active ? 'is-active' : ''}`}
                onClick={() => setUiStyle(st.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <strong style={{ fontSize: '14px' }}>
                    {st.icon} {st.label}
                  </strong>
                  {active && <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--sf-primary)' }}>✓</span>}
                </div>
                <small style={{ display: 'block', fontSize: '12px', color: 'var(--sf-text-muted)', marginTop: '3px' }}>
                  {st.desc}
                </small>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 6 Harmonious Color Themes */}
      <div>
        <div style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', color: 'var(--sf-text-muted)' }}>
          3. Tông Màu Chủ Đạo ({SF_COLOR_THEMES.length} bảng màu hài hòa)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: '8px' }}>
          {SF_COLOR_THEMES.map((th) => {
            const active = colorTheme === th.id;
            return (
              <button
                key={th.id}
                type="button"
                data-theme-option={th.id}
                className={`sf-style-option ${active ? 'is-active' : ''}`}
                onClick={() => setColorTheme(th.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 12px' }}
              >
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: th.swatch,
                    border: '2px solid rgba(255,255,255,0.8)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    flexShrink: 0,
                  }}
                />
                <strong style={{ fontSize: '13px' }}>
                  {th.emoji} {th.label}
                </strong>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="sf-btn sf-btn-outline sf-btn-sm" onClick={resetUiPreferences}>
          <SfIcon name="refresh" size={14} />
          <span>Đặt lại mặc định</span>
        </button>
      </div>
    </div>
  );
}

export default function ThemePersonalizerModal() {
  const { isStylePanelOpen, setIsStylePanelOpen } = useStore();
  if (!isStylePanelOpen) return null;

  return (
    <div
      className="sf-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Bảng Cá nhân hóa Giao diện"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsStylePanelOpen(false);
      }}
    >
      <aside className="sf-drawer" style={{ width: 'min(480px, 100vw)' }}>
        <div className="sf-drawer-header">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
              🎨 Tùy chỉnh Giao diện Mua sắm
            </h2>
            <small style={{ fontSize: '12.5px', color: 'var(--sf-text-muted)' }}>
              Chọn phong cách mềm mại & bảng màu hài hòa theo sở thích của bạn
            </small>
          </div>
          <button
            type="button"
            className="sf-icon-btn"
            aria-label="Đóng bảng giao diện"
            onClick={() => setIsStylePanelOpen(false)}
          >
            <SfIcon name="close" size={18} />
          </button>
        </div>

        <div className="sf-drawer-body">
          <ThemePersonalizerSection />
        </div>

        <div className="sf-drawer-footer">
          <button
            type="button"
            className="sf-btn sf-btn-primary sf-btn-block"
            onClick={() => setIsStylePanelOpen(false)}
          >
            <SfIcon name="check" size={16} />
            <span>Hoàn tất & Tiếp tục mua sắm</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
