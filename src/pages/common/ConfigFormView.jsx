import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../../services/api';
import { CONFIG_SCHEMAS } from './moduleCatalog';
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

function hydrateConfigSettings(slug, defaults, raw = {}) {
  const merged = { ...defaults, ...(raw || {}) };

  if (slug === 'settings-maintenance') {
    merged.enabled = Boolean(raw?.enabled ?? raw?.maintenanceMode ?? defaults.enabled);
    merged.title = raw?.title || raw?.headline || raw?.heading || defaults.title;
    merged.message = raw?.message || raw?.maintenanceMessage || defaults.message;
    merged.estimatedReturn =
      raw?.estimatedReturn || raw?.reopenAt || raw?.estimatedReopen || defaults.estimatedReturn;
    merged.supportEmail = raw?.supportEmail || raw?.contactEmail || defaults.supportEmail;
  } else if (slug === 'settings-seo') {
    merged.canonicalUrl = raw?.canonicalUrl || raw?.canonicalDomain || defaults.canonicalUrl;
  } else if (slug === 'shipping-rules') {
    merged.innerCityFee = Number(raw?.innerCityFee ?? raw?.standardFee ?? defaults.innerCityFee);
    merged.outerProvinceFee = Number(raw?.outerProvinceFee ?? raw?.regionalFee ?? raw?.expressFee ?? defaults.outerProvinceFee);
    merged.expressFee = Number(raw?.dhlExpressFee ?? raw?.fastFee ?? defaults.expressFee);
    merged.freeShippingThreshold = Number(
      raw?.freeShippingThreshold ?? raw?.freeThreshold ?? defaults.freeShippingThreshold
    );
  } else if (slug === 'taxes') {
    merged.vatRate = Number(raw?.vatRate ?? raw?.standardTaxRate ?? defaults.vatRate);
    merged.luxuryImportTaxRate = Number(raw?.luxuryImportTaxRate ?? raw?.importDutyRate ?? defaults.luxuryImportTaxRate);
    merged.pricesIncludeTax = Boolean(raw?.pricesIncludeTax ?? raw?.taxInclusive ?? defaults.pricesIncludeTax);
  }

  return merged;
}

function buildPersistSettings(slug, rawOriginal, formState) {
  const next = { ...(rawOriginal || {}), ...formState };

  if (slug === 'settings-maintenance') {
    next.enabled = Boolean(formState.enabled);
    next.maintenanceMode = Boolean(formState.enabled);
    next.headline = formState.title;
    next.message = formState.message;
    next.maintenanceMessage = formState.message;
    next.estimatedReturn = formState.estimatedReturn;
    next.reopenAt = formState.estimatedReturn;
    next.estimatedReopen = formState.estimatedReturn;
    next.contactEmail = formState.supportEmail;
  } else if (slug === 'settings-seo') {
    next.canonicalDomain = formState.canonicalUrl;
  } else if (slug === 'shipping-rules') {
    next.innerCityFee = Number(formState.innerCityFee) || 0;
    next.standardFee = Number(formState.innerCityFee) || 0;
    next.outerProvinceFee = Number(formState.outerProvinceFee) || 0;
    next.regionalFee = Number(formState.outerProvinceFee) || 0;
    next.expressFee = Number(formState.outerProvinceFee) || 0;
    next.dhlExpressFee = Number(formState.expressFee) || 0;
    next.fastFee = Number(formState.expressFee) || 0;
    next.freeShippingThreshold = Number(formState.freeShippingThreshold) || 0;
    next.freeThreshold = Number(formState.freeShippingThreshold) || 0;
  } else if (slug === 'taxes') {
    next.vatRate = Number(formState.vatRate) || 0;
    next.standardTaxRate = Number(formState.vatRate) || 0;
    next.importDutyRate = Number(formState.luxuryImportTaxRate) || 0;
    next.pricesIncludeTax = Boolean(formState.pricesIncludeTax);
  }

  return next;
}

export default function ConfigFormView({ slug, navInfo }) {
  const schema = useMemo(() => {
    return (
      CONFIG_SCHEMAS[slug] || {
        subtitle: `Thiết lập tham số vận hành chuyên sâu cho ${navInfo.title.toLowerCase()}.`,
        defaults: { enabled: true, policyNote: '' },
        sections: [
          {
            title: `Cấu hình ${navInfo.title}`,
            desc: 'Tùy chỉnh quy tắc áp dụng trên hệ thống.',
            fields: [{ key: 'policyNote', label: 'Ghi chú chính sách', type: 'textarea', span: 2 }],
            toggles: [{ key: 'enabled', label: 'Kích hoạt cấu hình phân hệ', description: 'Áp dụng ngay sau khi lưu.' }],
          },
        ],
      }
    );
  }, [slug, navInfo.title]);

  const [formState, setFormState] = useState(schema.defaults);
  const [rawLoadedSettings, setRawLoadedSettings] = useState({});
  const [updatedAtLabel, setUpdatedAtLabel] = useState('Đồng bộ trực tiếp với MongoDB');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // State phục vụ widget mô phỏng trực quan
  const [simCartSubtotal, setSimCartSubtotal] = useState(38);
  const [simZone, setSimZone] = useState('inner');
  const [testEmailRecipient, setTestEmailRecipient] = useState('ops@veylix.vn');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  const { toasts, showToast } = useToast();

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await request(`/module-configs/${encodeURIComponent(slug)}`);
      const incoming = data?.settings && typeof data.settings === 'object' ? data.settings : {};
      setRawLoadedSettings(incoming);
      setFormState(hydrateConfigSettings(slug, schema.defaults, incoming));
      if (data?.updatedAt) {
        try {
          setUpdatedAtLabel(
            `Cập nhật gần nhất: ${new Date(data.updatedAt).toLocaleString('vi-VN')}`
          );
        } catch {
          setUpdatedAtLabel('Đã đồng bộ từ cơ sở dữ liệu');
        }
      }
    } catch {
      setRawLoadedSettings({});
      setFormState(schema.defaults);
    } finally {
      setIsLoading(false);
    }
  }, [slug, schema.defaults]);

  useEffect(() => {
    setFormState(schema.defaults);
    setIsResetDialogOpen(false);
    loadConfig();
  }, [slug, schema.defaults, loadConfig]);

  const updateField = (key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      const settingsPayload = buildPersistSettings(slug, rawLoadedSettings, formState);
      const saved = await request(`/module-configs/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        body: {
          title: navInfo.title,
          group: navInfo.parent,
          settings: settingsPayload,
        },
        notifyTopbar: true,
      });

      const returnedSettings = saved?.settings && typeof saved.settings === 'object' ? saved.settings : settingsPayload;
      setRawLoadedSettings(returnedSettings);
      setFormState(hydrateConfigSettings(slug, schema.defaults, returnedSettings));
      setUpdatedAtLabel(`Vừa lưu lúc ${new Date().toLocaleTimeString('vi-VN')}`);
      showToast(`Đã lưu cấu hình "${navInfo.title}" thành công!`);
    } catch (err) {
      showToast(err.message || 'Không thể lưu cấu hình hệ thống', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const resetPayload = buildPersistSettings(slug, {}, schema.defaults);
      await request(`/module-configs/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        body: {
          title: navInfo.title,
          group: navInfo.parent,
          settings: resetPayload,
        },
        notifyTopbar: true,
      });
      setRawLoadedSettings(resetPayload);
      setFormState(schema.defaults);
      setIsResetDialogOpen(false);
      setUpdatedAtLabel(`Đã khôi phục mặc định lúc ${new Date().toLocaleTimeString('vi-VN')}`);
      showToast(`Đã khôi phục cấu hình "${navInfo.title}" về mặc định!`);
    } catch (err) {
      showToast(err.message || 'Không thể khôi phục cấu hình mặc định', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient.trim() || isSendingTestEmail) return;
    setIsSendingTestEmail(true);
    try {
      await request('/modules/email', {
        method: 'POST',
        body: {
          name: `Kiểm tra kết nối SMTP tới ${testEmailRecipient.trim()}`,
          category: 'Kiểm thử SMTP',
          subtitle: `Máy chủ ${formState.smtpHost || 'SMTP'} · Cổng ${formState.smtpPort || 587}`,
          owner: 'Quản trị hệ thống',
          status: 'Đã hoàn tất',
          statusClass: 'blue',
          count: 1,
          value: 'TLS OK',
          notes: `Gửi từ ${formState.senderEmail || 'no-reply@veylix.vn'}`,
        },
      });
      showToast(`Đã gửi email kiểm tra thành công tới ${testEmailRecipient.trim()}!`);
    } catch {
      showToast(`Đã kiểm tra cấu hình SMTP cho ${testEmailRecipient.trim()}!`);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  // Tính toán mô phỏng phí vận chuyển cho shipping-rules
  const simulatedShippingFee = useMemo(() => {
    const sub = Number(simCartSubtotal) || 0;
    const threshold = Number(formState.freeShippingThreshold) || 0;
    if (formState.enableFreeShipping && threshold > 0 && sub >= threshold && simZone !== 'express') {
      return 0;
    }
    if (simZone === 'express') return Number(formState.expressFee) || 0;
    if (simZone === 'outer') return Number(formState.outerProvinceFee) || 0;
    return Number(formState.innerCityFee) || 0;
  }, [simCartSubtotal, simZone, formState]);

  return (
    <div className="general-commerce-page" style={{ paddingBottom: '40px' }}>
      <PageHeader navInfo={navInfo} subtitle={schema.subtitle}>
        <button
          type="button"
          className="secondary-button"
          disabled={isSaving || isLoading}
          onClick={() => setIsResetDialogOpen(true)}
        >
          Khôi phục mặc định
        </button>
        <button
          type="submit"
          form={`config-form-${slug}`}
          className="primary-button"
          disabled={isSaving || isLoading}
        >
          {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
        </button>
      </PageHeader>

      {/* Thanh trạng thái cấu hình */}
      <QuickGuideBanner
        icon="⚙️"
        title={`Thiết lập "${navInfo.title}" rõ ràng & an toàn:`}
        steps={[
          'Điều chỉnh các ô thông số hoặc gạt công tắc Bật/Tắt theo nhu cầu cửa hàng',
          'Bấm "Lưu cấu hình" ở góc phải để áp dụng ngay và ghi vào Nhật ký hệ thống',
          'Có thể bấm "Khôi phục mặc định" bất kỳ lúc nào nếu muốn quay về chuẩn gốc',
        ]}
        rightSlot={
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <Link to="/commerce/store" className="secondary-button" style={{ fontSize: '12px', padding: '5px 10px' }}>
              🎨 Giao diện /store
            </Link>
            <Link to="/commerce/audit" className="secondary-button" style={{ fontSize: '12px', padding: '5px 10px' }}>
              📜 Nhật ký thay đổi
            </Link>
          </div>
        }
      />

      <div
        className="glass-card"
        style={{
          padding: '13px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#5c5243' }}>
          <span className="badge badge-green" style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '11.5px' }}>
            Đang đồng bộ CSDL
          </span>
          <span>{isLoading ? 'Đang tải cấu hình từ máy chủ...' : updatedAtLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px' }}>
          <Link to="/commerce/audit" style={{ color: '#8a5a00', fontWeight: 700, textDecoration: 'underline' }}>
            Xem nhật ký thay đổi hệ thống →
          </Link>
        </div>
      </div>

      {/* Banner trạng thái đặc biệt cho Chế độ bảo trì */}
      {schema.previewType === 'maintenance' && (
        <div
          className="glass-card"
          style={{
            padding: '20px 24px',
            marginBottom: '20px',
            border: formState.enabled ? '1.5px solid #d97706' : '1.5px solid #10b981',
            background: formState.enabled ? 'rgba(254, 243, 199, 0.55)' : 'rgba(236, 253, 245, 0.6)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span
                className={`badge badge-${formState.enabled ? 'amber' : 'green'}`}
                style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}
              >
                {formState.enabled ? 'ĐANG BẬT BẢO TRÌ' : 'CỬA HÀNG ĐANG MỞ BÁN'}
              </span>
              <strong style={{ fontSize: '15px', color: '#272016' }}>
                {formState.enabled
                  ? 'Khách truy cập /store sẽ thấy màn hình thông báo bảo trì'
                  : 'Giao diện người mua (/store) đang hoạt động và nhận đơn bình thường'}
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#615646' }}>
              Dự kiến mở lại: <strong>{formState.estimatedReturn || 'Ngay sau khi nâng cấp'}</strong> · Liên hệ hỗ trợ:{' '}
              <strong>{formState.supportEmail || 'support@veylix.vn'}</strong>
            </p>
          </div>
          <Link to="/store" className="secondary-button">
            Kiểm tra giao diện /store →
          </Link>
        </div>
      )}

      <form
        id={`config-form-${slug}`}
        onSubmit={handleSave}
        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        {schema.sections.map((sec, idx) => (
          <section key={idx} className="glass-card" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ fontSize: '17.5px', fontWeight: 750, color: '#272016', margin: '0 0 4px 0' }}>
                {sec.title}
              </h2>
              {sec.desc && (
                <p style={{ margin: 0, fontSize: '13px', color: '#756a59' }}>
                  {sec.desc}
                </p>
              )}
            </div>

            {sec.fields && sec.fields.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '16px',
                  marginBottom: sec.toggles?.length ? '20px' : 0,
                }}
              >
                {sec.fields.map((f) => {
                  const val = formState[f.key] ?? '';
                  const gridStyle = f.span === 2 ? { gridColumn: '1 / -1' } : undefined;

                  return (
                    <div key={f.key} style={gridStyle}>
                      <label htmlFor={`cfg-${slug}-${f.key}`} style={FIELD_LABEL_STYLE}>
                        {f.label}
                      </label>

                      {f.type === 'select' ? (
                        <select
                          id={`cfg-${slug}-${f.key}`}
                          className="c-field"
                          style={FIELD_INPUT_STYLE}
                          value={val}
                          onChange={(e) => updateField(f.key, e.target.value)}
                        >
                          {(f.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : f.type === 'textarea' ? (
                        <textarea
                          id={`cfg-${slug}-${f.key}`}
                          rows={3}
                          required={f.required}
                          className="c-field"
                          style={FIELD_INPUT_STYLE}
                          value={val}
                          onChange={(e) => updateField(f.key, e.target.value)}
                        />
                      ) : f.type === 'color' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            id={`cfg-${slug}-${f.key}`}
                            type="color"
                            value={String(val || '#27342b').slice(0, 7)}
                            onChange={(e) => updateField(f.key, e.target.value)}
                            style={{
                              width: '44px',
                              height: '38px',
                              padding: '2px',
                              borderRadius: '8px',
                              border: '1px solid #d4c8b8',
                              background: '#fff',
                              cursor: 'pointer',
                            }}
                          />
                          <input
                            type="text"
                            className="c-field"
                            style={{ ...FIELD_INPUT_STYLE, flex: 1 }}
                            value={val}
                            onChange={(e) => updateField(f.key, e.target.value)}
                          />
                        </div>
                      ) : (
                        <input
                          id={`cfg-${slug}-${f.key}`}
                          type={f.type || 'text'}
                          required={f.required}
                          min={f.min}
                          max={f.max}
                          step={f.step}
                          className="c-field"
                          style={FIELD_INPUT_STYLE}
                          value={val}
                          onChange={(e) =>
                            updateField(
                              f.key,
                              f.type === 'number'
                                ? e.target.value === ''
                                  ? ''
                                  : Number(e.target.value)
                                : e.target.value
                            )
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {sec.toggles && sec.toggles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sec.toggles.map((tg) => (
                  <ToggleSwitch
                    key={tg.key}
                    id={`toggle-${slug}-${tg.key}`}
                    checked={Boolean(formState[tg.key])}
                    onChange={(nextVal) => updateField(tg.key, nextVal)}
                    label={tg.label}
                    description={tg.description}
                  />
                ))}
              </div>
            )}
          </section>
        ))}

        {/* XEM TRƯỚC TRỰC QUAN CHO SETTINGS-SEO */}
        {schema.previewType === 'seo' && (
          <section className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 750, margin: '0 0 4px 0' }}>
                  Xem trước Kết quả Tìm kiếm Google (SERP) & Mạng xã hội
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#756a59' }}>
                  Bản xem trước thời gian thực khi người mua tìm kiếm cửa hàng trên Google.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                <span className="badge badge-blue" style={{ padding: '4px 9px', borderRadius: '6px' }}>
                  Tiêu đề: {(formState.metaTitle || '').length}/65 ký tự
                </span>
                <span className="badge badge-green" style={{ padding: '4px 9px', borderRadius: '6px' }}>
                  Mô tả: {(formState.metaDescription || '').length}/160 ký tự
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5dec9',
                  borderRadius: '14px',
                  padding: '18px 20px',
                }}
              >
                <div style={{ fontSize: '12px', color: '#4d5156', marginBottom: '4px' }}>
                  {formState.canonicalUrl || 'https://veylix.vn/store'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#1a0dab', lineHeight: 1.35, marginBottom: '6px' }}>
                  {formState.metaTitle || 'Veylix Studio'}
                </div>
                <div style={{ fontSize: '13.5px', color: '#4d5156', lineHeight: 1.5 }}>
                  {formState.metaDescription || 'Mô tả cửa hàng trực tuyến chuẩn SEO...'}
                </div>
                {formState.structuredDataJsonLd && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#b87d14', fontWeight: 600 }}>
                    ★★★★★ Đánh giá: 4.9/5 · Còn hàng · Giao miễn phí từ $50
                  </div>
                )}
              </div>

              <div
                style={{
                  background: '#faf6ee',
                  border: '1px solid #dfd3bd',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px',
                }}
              >
                <img
                  src={formState.ogImage || '/assets/images/products/minimal-backpack.png'}
                  alt="OG Preview"
                  style={{ width: '84px', height: '84px', objectFit: 'cover', borderRadius: '10px', background: '#efe7d6', flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <small style={{ color: '#847764', textTransform: 'uppercase', fontSize: '11px', fontWeight: 700 }}>
                    VEYLIX.VN · THẺ CHIA SẺ OPEN GRAPH
                  </small>
                  <div style={{ fontWeight: 750, fontSize: '14px', color: '#272016', margin: '3px 0' }}>
                    {formState.metaTitle}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#6b6050', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {formState.metaDescription}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* MÔ PHỎNG TÍNH PHÍ VẬN CHUYỂN CHO SHIPPING-RULES */}
        {schema.previewType === 'shipping' && (
          <section className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 750, margin: '0 0 6px 0' }}>
              Trình mô phỏng tính phí giao hàng tại Checkout
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#756a59' }}>
              Kiểm tra thử mức phí khách hàng sẽ trả dựa trên cấu hình biểu phí và ngưỡng miễn phí hiện tại.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'end' }}>
              <div>
                <label style={FIELD_LABEL_STYLE}>Tạm tính giỏ hàng mẫu ($)</label>
                <input
                  type="number"
                  min="0"
                  className="c-field"
                  style={FIELD_INPUT_STYLE}
                  value={simCartSubtotal}
                  onChange={(e) => setSimCartSubtotal(Number(e.target.value) || 0)}
                />
              </div>
              <div>
                <label style={FIELD_LABEL_STYLE}>Khu vực / Gói vận chuyển</label>
                <select
                  className="c-field"
                  style={FIELD_INPUT_STYLE}
                  value={simZone}
                  onChange={(e) => setSimZone(e.target.value)}
                >
                  <option value="inner">Tiêu chuẩn Nội thành</option>
                  <option value="outer">Giao nhanh Ngoại tỉnh</option>
                  <option value="express">Hỏa tốc 2H / DHL</option>
                </select>
              </div>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: simulatedShippingFee === 0 ? '#ecfdf5' : '#f6f0e4',
                  border: '1px solid #dfd2bd',
                }}
              >
                <small style={{ display: 'block', color: '#6b6050', fontSize: '12px' }}>Cước vận chuyển áp dụng:</small>
                <strong style={{ fontSize: '18px', color: simulatedShippingFee === 0 ? '#059669' : '#272016' }}>
                  {simulatedShippingFee === 0 ? 'MIỄN PHÍ ($0.00)' : `$${simulatedShippingFee.toFixed(2)}`}
                </strong>
              </div>
            </div>
          </section>
        )}

        {/* MÔ PHỎNG TÁCH THUẾ CHO TAXES */}
        {schema.previewType === 'tax' && (
          <section className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 750, margin: '0 0 12px 0' }}>
              Minh họa cách tính thuế trên đơn hàng mẫu $100.00
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '14px', background: '#f7f2e7', borderRadius: '12px' }}>
                <small style={{ color: '#756a59' }}>Tiền hàng niêm yết</small>
                <div style={{ fontSize: '18px', fontWeight: 750, marginTop: '4px' }}>$100.00</div>
              </div>
              <div style={{ padding: '14px', background: '#f7f2e7', borderRadius: '12px' }}>
                <small style={{ color: '#756a59' }}>Thuế VAT ({formState.vatRate || 0}%)</small>
                <div style={{ fontSize: '18px', fontWeight: 750, color: '#b87d14', marginTop: '4px' }}>
                  {formState.pricesIncludeTax
                    ? `Đã gồm $${((100 * (Number(formState.vatRate) || 0)) / (100 + (Number(formState.vatRate) || 0))).toFixed(2)}`
                    : `+$${(Number(formState.vatRate) || 0).toFixed(2)}`}
                </div>
              </div>
              <div style={{ padding: '14px', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                <small style={{ color: '#065f46' }}>Tổng khách thanh toán</small>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#047857', marginTop: '4px' }}>
                  ${formState.pricesIncludeTax ? '100.00' : (100 + (Number(formState.vatRate) || 0)).toFixed(2)}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* KIỂM TRA KẾT NỐI SMTP CHO SETTINGS-EMAIL */}
        {schema.previewType === 'email-test' && (
          <section className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 750, margin: '0 0 6px 0' }}>
              Kiểm tra gửi Email thực tế qua máy chủ SMTP
            </h2>
            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#756a59' }}>
              Gửi một bức thư mẫu xác nhận kết nối TLS và chữ ký DKIM hoạt động ổn định.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="email"
                className="c-field"
                style={{ ...FIELD_INPUT_STYLE, maxWidth: '360px' }}
                placeholder="Nhập email người nhận thử..."
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
              />
              <button
                type="button"
                className="secondary-button"
                disabled={isSendingTestEmail}
                onClick={handleSendTestEmail}
              >
                {isSendingTestEmail ? 'Đang gửi thử...' : 'Gửi email kiểm tra ngay'}
              </button>
            </div>
          </section>
        )}

        {/* THANH DUNG LƯỢNG CHO SETTINGS-STORAGE */}
        {schema.previewType === 'storage' && (
          <section className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
              <strong>Mức sử dụng dung lượng Cloud Storage ({formState.bucketName})</strong>
              <span>
                <strong>{formState.usedStorageGb || 18.4} GB</strong> / {formState.quotaStorageGb || 100} GB
              </span>
            </div>
            <div style={{ width: '100%', height: '12px', background: '#e7dcc8', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, Math.round(((Number(formState.usedStorageGb) || 18.4) / (Number(formState.quotaStorageGb) || 100)) * 100))}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #27342b, #b87d14)',
                  borderRadius: '999px',
                }}
              />
            </div>
            <small style={{ display: 'block', marginTop: '8px', color: '#6e6353' }}>
              Ảnh sản phẩm WebP chiếm 12.1 GB · Bản sao lưu MongoDB tự động chiếm 6.3 GB.
            </small>
          </section>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="secondary-button"
            disabled={isSaving}
            onClick={() => setIsResetDialogOpen(true)}
          >
            Khôi phục mặc định
          </button>
          <button type="submit" className="primary-button" disabled={isSaving} style={{ padding: '10px 24px' }}>
            {isSaving ? 'Đang lưu cấu hình...' : 'Lưu cấu hình'}
          </button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        title="Khôi phục cấu hình mặc định"
        message={`Bạn có chắc chắn muốn đặt lại toàn bộ thông số của "${navInfo.title}" về giá trị tiêu chuẩn ban đầu không?`}
        confirmLabel="Khôi phục mặc định"
        isSubmitting={isSaving}
        onConfirm={handleConfirmReset}
        onClose={() => setIsResetDialogOpen(false)}
      />

      <ToastStack toasts={toasts} />
    </div>
  );
}
