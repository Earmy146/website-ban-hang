import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SfIcon } from '../../components/storefront/StoreIcons';
import { useStore } from '../../components/storefront/StoreContext';
import { storeApi, formatMoney } from '../../components/storefront/storeApi';

const FULFILLMENT_STEPS = [
  { key: 'Processing', num: '①', label: 'Đang xử lý', desc: 'Shop đã nhận đơn & kiểm hàng' },
  { key: 'Packed', num: '②', label: 'Đã đóng gói', desc: 'Kiện hàng đã bọc chống sốc' },
  { key: 'Shipped', num: '③', label: 'Đang giao hàng', desc: 'Shipper đang trên đường giao' },
  { key: 'Delivered', num: '④', label: 'Đã giao tận tay', desc: 'Giao hàng hoàn tất thành công' },
];

function getStepIndex(status) {
  const idx = FULFILLMENT_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function StoreOrderLookupPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { recentOrders, customer, refreshHome, showToast } = useStore();

  const [orderCodeInput, setOrderCodeInput] = useState(() => searchParams.get('code') || '');
  const [emailInput, setEmailInput] = useState(() => customer?.email || '');

  const [lookupResult, setLookupResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Confirm Cancel Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Thay đổi nhu cầu / Muốn đặt lại mẫu khác');
  const [cancelling, setCancelling] = useState(false);

  const performLookup = useCallback(async (rawCode, rawEmail = '') => {
    const cleanCode = String(rawCode || '').replace(/^#/, '').trim().toUpperCase();
    if (!cleanCode) return;
    setOrderCodeInput(cleanCode);
    setError('');
    try {
      setLoading(true);
      const data = await storeApi.lookupOrder(cleanCode, rawEmail);
      const order = data?.order || data;
      const shipment = data?.shipment || order?.shipment || null;
      const transaction = data?.transaction || order?.transaction || null;
      setLookupResult({ order, shipment, transaction });
    } catch (err) {
      setLookupResult(null);
      setError(err.message || `Không tìm thấy đơn hàng #${cleanCode}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const qCode = searchParams.get('code');
    if (qCode) {
      performLookup(qCode, '');
    }
  }, [searchParams, performLookup]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const clean = orderCodeInput.replace(/^#/, '').trim().toUpperCase();
    if (!clean) {
      showToast('Vui lòng nhập mã đơn hàng cần xem', 'error');
      return;
    }
    setSearchParams({ code: clean }, { replace: true });
    performLookup(clean, emailInput);
  };

  const handleConfirmCancel = async () => {
    const targetOrder = lookupResult?.order;
    if (!targetOrder || cancelling) return;
    const code = targetOrder.orderCode || targetOrder.id;
    try {
      setCancelling(true);
      const res = await storeApi.cancelOrder(code, cancelReason);
      const updatedOrder = res?.order || res || {
        ...targetOrder,
        fulfillmentStatus: 'Cancelled',
        paymentStatus: targetOrder.paymentStatus === 'Paid' ? 'Refunded' : targetOrder.paymentStatus,
      };
      setLookupResult((prev) => ({
        ...prev,
        order: updatedOrder,
      }));
      setCancelModalOpen(false);
      refreshHome();
      showToast(`Đã hủy đơn hàng #${code} và hoàn lại tồn kho thành công!`);
    } catch (err) {
      showToast(err.message || 'Không thể hủy đơn hàng này', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const quickLookupItems = useMemo(() => {
    const items = [];
    const seen = new Set();
    recentOrders.forEach((o) => {
      if (o?.orderCode && !seen.has(o.orderCode)) {
        seen.add(o.orderCode);
        items.push({ code: o.orderCode, note: 'Đơn bạn vừa đặt' });
      }
    });
    [
      { code: 'SF83291', note: 'Mẫu: Đang xử lý' },
      { code: 'SF83290', note: 'Mẫu: Đang giao' },
      { code: 'SF83289', note: 'Mẫu: Đã giao' },
    ].forEach((demo) => {
      if (!seen.has(demo.code)) {
        seen.add(demo.code);
        items.push(demo);
      }
    });
    return items.slice(0, 6);
  }, [recentOrders]);

  const order = lookupResult?.order;
  const shipment = lookupResult?.shipment;
  const transaction = lookupResult?.transaction;
  const isCancelled = order?.fulfillmentStatus === 'Cancelled';
  const currentStep = getStepIndex(order?.fulfillmentStatus);

  return (
    <div className="sf-container" style={{ maxWidth: '960px' }}>
      <div style={{ marginTop: '28px' }}>
        <span className="sf-eyebrow">Biết ngay kiện hàng đang ở đâu</span>
        <h1 className="sf-section-title">Tra cứu Đơn hàng & Hành trình giao nhận</h1>
        <p className="sf-section-sub">
          Nhập mã đơn (ví dụ <strong>SF83291</strong>) hoặc <strong>bấm thẳng vào các mã đơn bên dưới</strong> để xem ngay 4 chặng giao hàng!
        </p>
      </div>

      {/* Lookup Search Card */}
      <section className="sf-card" style={{ marginTop: '22px' }}>
        <form
          onSubmit={handleFormSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '12px',
            alignItems: 'end',
          }}
        >
          <div className="sf-field">
            <label htmlFor="sf-lookup-code">Mã đơn hàng *</label>
            <input
              id="sf-lookup-code"
              className="sf-input"
              placeholder="Ví dụ: SF83291"
              value={orderCodeInput}
              onChange={(e) => setOrderCodeInput(e.target.value)}
              required
            />
          </div>

          <div className="sf-field">
            <label htmlFor="sf-lookup-email">Email người nhận (không bắt buộc)</label>
            <input
              id="sf-lookup-email"
              type="email"
              className="sf-input"
              placeholder="Bỏ trống vẫn tra cứu nhanh được"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
          </div>

          <button type="submit" className="sf-btn sf-btn-primary" disabled={loading}>
            <SfIcon name="search" size={16} />
            <span>{loading ? 'Đang kiểm tra...' : 'Xem tiến độ đơn hàng'}</span>
          </button>
        </form>

        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1.5px dashed var(--sf-border-subtle)' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 900, marginBottom: '8px', color: 'var(--sf-text-muted)' }}>
            ⚡ Bấm 1 chạm để xem nhanh đơn gần đây / đơn mẫu:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {quickLookupItems.map((item) => {
              const active = orderCodeInput.toUpperCase() === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  data-lookup-chip={item.code}
                  className={`sf-chip ${active ? 'is-selected' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '12.5px' }}
                  onClick={() => {
                    setEmailInput('');
                    setSearchParams({ code: item.code }, { replace: true });
                    performLookup(item.code, '');
                  }}
                >
                  <strong>#{item.code}</strong>
                  <span style={{ opacity: 0.8 }}>· {item.note}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {error && (
        <div
          className="sf-card"
          style={{
            marginTop: '20px',
            background: 'var(--sf-danger-soft)',
            color: 'var(--sf-danger)',
            fontWeight: 800,
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Order Details & Stepper */}
      {order && (
        <section className="sf-card" style={{ marginTop: '22px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '16px',
              flexWrap: 'wrap',
              paddingBottom: '18px',
              borderBottom: '2px dashed var(--sf-border-subtle)',
            }}
          >
            <div>
              <span className="sf-eyebrow" style={{ marginBottom: '4px' }}>
                Đặt ngày {order.date || 'Hôm nay'} · {order.channel || 'Cửa hàng trực tuyến'}
              </span>
              <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>
                Đơn hàng #{order.orderCode || order.id}
              </h2>
              <span style={{ fontSize: '13.5px', color: 'var(--sf-text-muted)' }}>
                Người nhận: <strong>{order.customer?.name || 'Khách mua hàng'}</strong> ({order.customer?.email || '—'})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span
                className={`sf-pill ${
                  order.paymentStatus === 'Paid'
                    ? 'sf-pill-success'
                    : order.paymentStatus === 'Refunded'
                    ? 'sf-pill-danger'
                    : 'sf-pill-amber'
                }`}
              >
                {order.paymentStatus === 'Paid'
                  ? '✓ Đã thanh toán'
                  : order.paymentStatus === 'Refunded'
                  ? '↩ Đã hoàn tiền'
                  : '⏳ Thanh toán khi nhận'}
              </span>

              {order.fulfillmentStatus === 'Processing' && (
                <button
                  type="button"
                  className="sf-btn sf-btn-danger sf-btn-sm"
                  onClick={() => setCancelModalOpen(true)}
                >
                  <SfIcon name="close" size={14} />
                  <span>Hủy đơn hàng</span>
                </button>
              )}
            </div>
          </div>

          {/* 4-Step Visual Progress or Cancelled Banner */}
          {isCancelled ? (
            <div
              style={{
                margin: '22px 0',
                padding: '18px 20px',
                background: 'var(--sf-danger-soft)',
                color: 'var(--sf-danger)',
                border: 'var(--sf-btn-border)',
              }}
            >
              <strong style={{ display: 'block', fontSize: '16px' }}>
                ✕ Đơn hàng này đã được hủy
              </strong>
              <span style={{ fontSize: '13.5px' }}>
                Số lượng sản phẩm đã được hoàn trả lại kho hàng Veylix. Nếu đơn đã thanh toán trước, tiền được chuyển sang trạng thái Hoàn tiền.
              </span>
            </div>
          ) : (
            <div className="sf-stepper" aria-label="Tiến độ xử lý đơn hàng 4 chặng">
              {FULFILLMENT_STEPS.map((step, idx) => {
                const isDone = idx < currentStep || order.fulfillmentStatus === 'Delivered';
                const isCurrent = idx === currentStep && order.fulfillmentStatus !== 'Delivered';
                return (
                  <div
                    key={step.key}
                    className={`sf-step ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
                  >
                    <div className="sf-step-num">
                      {isDone ? <SfIcon name="check" size={15} /> : idx + 1}
                    </div>
                    <strong style={{ display: 'block', fontSize: '14px', fontWeight: 900 }}>
                      {step.num} {step.label}
                    </strong>
                    <small style={{ fontSize: '12px', opacity: 0.88 }}>{step.desc}</small>
                  </div>
                );
              })}
            </div>
          )}

          {/* Shipment & Payment Details */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            <div
              style={{
                padding: '18px',
                background: 'var(--sf-bg-soft)',
                border: 'var(--sf-card-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <SfIcon name="truck" size={18} />
                <strong style={{ fontSize: '15px', fontWeight: 900 }}>Thông tin kiện hàng & Giao vận</strong>
              </div>
              <div style={{ fontSize: '13.5px', display: 'grid', gap: '6px' }}>
                <div>
                  <strong>Mã vận đơn:</strong>{' '}
                  <span style={{ fontFamily: 'monospace', fontWeight: 900, color: 'var(--sf-primary)' }}>
                    {shipment?.trackingCode || shipment?.id || 'Đang cấp mã vận đơn'}
                  </span>
                </div>
                <div><strong>Đơn vị giao hàng:</strong> {shipment?.carrier || order.shippingMethod || 'Giao hàng tiêu chuẩn'}</div>
                <div><strong>Trạng thái hiện tại:</strong> {shipment?.statusText || shipment?.status || order.fulfillmentStatus}</div>
                <div><strong>Dự kiến nhận hàng:</strong> {shipment?.eta || 'Trong 2 – 3 ngày làm việc'}</div>
                <div><strong>Địa chỉ nhận:</strong> {shipment?.destination || order.address || '—'}</div>
              </div>
            </div>

            <div
              style={{
                padding: '18px',
                background: 'var(--sf-bg-soft)',
                border: 'var(--sf-card-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <SfIcon name="package" size={18} />
                <strong style={{ fontSize: '15px', fontWeight: 900 }}>Sản phẩm & Số tiền thanh toán</strong>
              </div>
              <div style={{ fontSize: '13.5px', display: 'grid', gap: '6px' }}>
                <div><strong>Món đã mua:</strong> {order.itemsDesc || `${order.itemsCount || 1} sản phẩm`}</div>
                <div><strong>Tổng số lượng:</strong> {order.itemsCount || 1} món</div>
                {transaction && (
                  <div>
                    <strong>Mã giao dịch:</strong> {transaction.txnCode || transaction.id} ({transaction.gateway})
                  </div>
                )}
                <div style={{ paddingTop: '8px', marginTop: '4px', borderTop: '1.5px dashed var(--sf-border-subtle)', fontSize: '16px' }}>
                  <strong>Tổng tiền đơn hàng: </strong>
                  <strong style={{ color: 'var(--sf-primary)', fontWeight: 900 }}>{formatMoney(order.total)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--sf-text-muted)' }}>
              Cần hỗ trợ gấp về đơn hàng? Hãy bấm nút <strong>Chat với Shop</strong> ở góc dưới phải màn hình!
            </span>
            <Link to="/store/support" className="sf-btn sf-btn-outline sf-btn-sm">
              Gửi yêu cầu hỗ trợ
            </Link>
          </div>
        </section>
      )}

      {/* Custom Cancel Confirmation Modal */}
      {cancelModalOpen && order && (
        <div
          className="sf-backdrop sf-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận hủy đơn hàng"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCancelModalOpen(false);
          }}
        >
          <div className="sf-modal-card sf-modal-sm">
            <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>
              Xác nhận hủy đơn #{order.orderCode || order.id}?
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--sf-text-muted)', marginBottom: '16px' }}>
              Đơn hàng đang ở chặng <strong>① Đang xử lý</strong> nên bạn có thể hủy miễn phí ngay lập tức. Số lượng hàng sẽ tự động cộng trả lại kho.
            </p>

            <div className="sf-field" style={{ marginBottom: '18px' }}>
              <label htmlFor="sf-cancel-reason">Chọn lý do hủy đơn</label>
              <select
                id="sf-cancel-reason"
                className="sf-select"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              >
                <option value="Thay đổi nhu cầu / Muốn đặt lại mẫu khác">Thay đổi nhu cầu / Muốn đặt lại mẫu khác</option>
                <option value="Quên áp dụng mã giảm giá">Quên áp dụng mã giảm giá</option>
                <option value="Muốn đổi địa chỉ nhận hàng">Muốn đổi địa chỉ nhận hàng</option>
                <option value="Lý do cá nhân khác">Lý do cá nhân khác</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="sf-btn sf-btn-outline"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
              >
                Giữ lại đơn
              </button>
              <button
                type="button"
                className="sf-btn sf-btn-danger"
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
