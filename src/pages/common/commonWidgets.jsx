import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../components/ui/DialogModal';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  return { toasts, showToast };
}

export function ToastStack({ toasts }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div
      className="toasts-container"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            background: t.type === 'error' ? '#8a2323' : t.type === 'info' ? '#362d1e' : '#27342b',
            color: '#fff',
            padding: '11px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 12px 30px rgba(32, 26, 18, 0.25)',
            border: '1px solid rgba(255,255,255,0.14)',
            pointerEvents: 'auto',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function PageHeader({ navInfo, subtitle, children }) {
  return (
    <header className="commerce-heading">
      <div>
        <div className="commerce-breadcrumb">
          <Link to="/overview">Tổng quan</Link>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
            </svg>
          </span>
          <span>{navInfo.parent}</span>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
            </svg>
          </span>
          <span>{navInfo.title}</span>
        </div>
        <h1>
          {navInfo.title}
          <span>.</span>
        </h1>
        {subtitle && (
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: '#6f6453', maxWidth: '680px' }}>
            {subtitle}
          </p>
        )}
      </div>

      {children && <div className="commerce-heading-actions">{children}</div>}
    </header>
  );
}

export function ToggleSwitch({ checked, onChange, label, description, disabled = false, id }) {
  const isOn = Boolean(checked);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '13px 16px',
        borderRadius: '12px',
        background: isOn ? 'rgba(39, 52, 43, 0.05)' : 'rgba(245, 239, 228, 0.65)',
        border: isOn ? '1px solid rgba(39, 52, 43, 0.22)' : '1px solid rgba(212, 200, 184, 0.7)',
        transition: 'all 0.18s ease',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {label && (
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#272016' }}>
            {label}
          </div>
        )}
        {description && (
          <div style={{ fontSize: '12.5px', color: '#756a59', marginTop: '2px', lineHeight: 1.45 }}>
            {description}
          </div>
        )}
      </div>

      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-label={label || 'Bật hoặc tắt'}
        disabled={disabled}
        onClick={() => !disabled && onChange(!isOn)}
        style={{
          position: 'relative',
          width: '46px',
          height: '26px',
          borderRadius: '999px',
          border: 'none',
          padding: 0,
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: isOn ? '#27342b' : '#cbbca6',
          transition: 'background 0.2s ease',
          flexShrink: 0,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '3px',
            left: isOn ? '23px' : '3px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.22)',
            transition: 'left 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </button>
    </div>
  );
}

export function ConfirmDialog({
  isOpen,
  title = 'Xác nhận thao tác',
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  danger = false,
  isSubmitting = false,
  onConfirm,
  onClose,
}) {
  return (
    <DialogModal isOpen={isOpen} title={title} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            padding: '14px 16px',
            borderRadius: '12px',
            background: danger ? '#fdf2f2' : '#f6f0e4',
            border: danger ? '1px solid #f3c6c6' : '1px solid #e3d6c1',
            color: danger ? '#7f1d1d' : '#3a3124',
            fontSize: '14px',
            lineHeight: 1.55,
          }}
        >
          {message}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="secondary-button"
            disabled={isSubmitting}
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? 'secondary-button' : 'primary-button'}
            disabled={isSubmitting}
            onClick={onConfirm}
            style={
              danger
                ? {
                    background: '#991b1b',
                    color: '#ffffff',
                    borderColor: '#7f1d1d',
                  }
                : undefined
            }
          >
            {isSubmitting ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </DialogModal>
  );
}

export function exportCsvFile(filename, headers, rows) {
  const escapeCell = (val) => {
    const str = val === null || val === undefined ? '' : String(val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  const lines = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ];
  const csvContent = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function fallbackExecCommandCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = String(text ?? '');
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  } catch {
    // Bỏ qua an toàn nếu môi trường headless chặn clipboard
  }
}

export async function copyToClipboard(text) {
  const safeText = String(text ?? '');
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(safeText);
      return true;
    } catch {
      fallbackExecCommandCopy(safeText);
      return true;
    }
  }
  fallbackExecCommandCopy(safeText);
  return true;
}

export function QuickGuideBanner({ icon = '💡', title, steps = [], rightSlot = null }) {
  return (
    <section
      className="glass-card"
      style={{
        padding: '14px 20px',
        marginBottom: '18px',
        background: 'linear-gradient(120deg, rgba(255, 251, 242, 0.95) 0%, rgba(245, 237, 222, 0.9) 100%)',
        border: '1px solid rgba(205, 188, 158, 0.75)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div style={{ flex: 1, minWidth: '260px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: steps.length ? '6px' : 0 }}>
          <span style={{ fontSize: '17px' }}>{icon}</span>
          <strong style={{ fontSize: '13.5px', color: '#272016' }}>{title}</strong>
        </div>
        {steps.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            {steps.map((st, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '12px',
                  color: '#4e4333',
                  background: 'rgba(255, 255, 255, 0.78)',
                  border: '1px solid #dfd3bd',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontWeight: 600,
                }}
              >
                {idx + 1}. {st}
              </span>
            ))}
          </div>
        )}
      </div>
      {rightSlot && <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{rightSlot}</div>}
    </section>
  );
}

export function FilterPillTabs({ tabs = [], activeId, onSelect }) {
  return (
    <div
      role="tablist"
      aria-label="Bộ lọc nhanh"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        alignItems: 'center',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            className={`pill ${isActive ? 'active' : ''}`}
            style={{
              padding: '6px 13px',
              borderRadius: '999px',
              fontSize: '12.5px',
              fontWeight: isActive ? 750 : 600,
              cursor: 'pointer',
              border: isActive ? '1px solid #27342b' : '1px solid #d8ccb8',
              background: isActive ? '#27342b' : '#fffdf9',
              color: isActive ? '#ffffff' : '#4a3f30',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: isActive ? 'rgba(255,255,255,0.22)' : '#efe7d8',
                  color: isActive ? '#ffffff' : '#5c5040',
                  fontWeight: 700,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export const FIELD_INPUT_STYLE = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '10px',
  border: '1px solid #d4c8b8',
  background: '#fffdf9',
  color: '#272016',
  fontSize: '13.5px',
};

export const FIELD_LABEL_STYLE = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 650,
  color: '#342b1e',
};
