import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SfIcon } from '../../components/storefront/StoreIcons';
import { useStore } from '../../components/storefront/StoreContext';
import { storeApi, formatMoney, FALLBACK_PRODUCT_IMAGE } from '../../components/storefront/storeApi';

const SHIPPING_METHODS = [
  {
    id: 'Giao hàng tiêu chuẩn',
    label: 'Giao hàng tiêu chuẩn',
    eta: 'Nhận sau 2 – 4 ngày làm việc',
    fee: 5,
    eligibleForThresholdFree: true,
  },
  {
    id: 'Giao hàng nhanh GHTK',
    label: 'Giao hàng nhanh GHTK',
    eta: 'Nhận nhanh 1 – 2 ngày làm việc',
    fee: 8,
    eligibleForThresholdFree: true,
  },
  {
    id: 'Giao hỏa tốc DHL',
    label: 'Giao hỏa tốc DHL Express',
    eta: 'Ưu tiên giao trong 24 giờ',
    fee: 15,
    eligibleForThresholdFree: false,
  },
];

const PAYMENT_METHODS = [
  { id: 'COD', label: '💵 Thanh toán khi nhận hàng (COD)', desc: 'Nhận hàng tận tay, kiểm tra rồi mới trả tiền' },
  { id: 'VNPay QR', label: '📱 Quét mã VNPay QR', desc: 'Quét bằng ứng dụng ngân hàng Việt Nam' },
  { id: 'MoMo', label: '👛 Ví điện tử MoMo', desc: 'Thanh toán nhanh qua ứng dụng MoMo' },
  { id: 'Stripe', label: '💳 Thẻ quốc tế Visa / Mastercard (Stripe)', desc: 'Thanh toán thẻ bảo mật quốc tế' },
];

const BUILTIN_VOUCHERS = [
  { code: 'HELLO10', discountType: 'Phần trăm (%)', value: 10, minSpend: 40 },
  { code: 'WELCOME20', discountType: 'Số tiền cố định ($)', value: 20, minSpend: 120 },
  { code: 'SHIPFREE', discountType: 'Miễn phí vận chuyển', value: 0, minSpend: 90 },
];

export default function StoreCheckoutPage() {
  const {
    cart,
    cartCount,
    cartSubtotal,
    freeShippingThreshold,
    homeData,
    customer,
    savedCoupon,
    setSavedCoupon,
    clearCart,
    recordPlacedOrder,
    refreshHome,
    updateCartQty,
    removeFromCart,
    showToast,
  } = useStore();

  const [form, setForm] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.location || '',
    note: '',
  });

  const [shippingMethod, setShippingMethod] = useState(SHIPPING_METHODS[0].id);
  const [paymentMethod, setPaymentMethod] = useState('Stripe');

  const [couponInput, setCouponInput] = useState(savedCoupon || '');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [placedResult, setPlacedResult] = useState(null);

  useEffect(() => {
    if (customer) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || customer.name || '',
        email: prev.email || customer.email || '',
        phone: prev.phone || customer.phone || '',
        address: prev.address || customer.location || '',
      }));
    }
  }, [customer]);

  const voucherCards = useMemo(() => {
    const map = new Map();
    (homeData.activeCoupons || []).forEach((c) => {
      if (c?.code) map.set(c.code.toUpperCase(), c);
    });
    BUILTIN_VOUCHERS.forEach((b) => {
      if (!map.has(b.code)) map.set(b.code, b);
    });
    return Array.from(map.values());
  }, [homeData.activeCoupons]);

  const handleApplyCoupon = async (rawCode) => {
    const code = String(rawCode ?? couponInput).trim().toUpperCase();
    setCouponInput(code);
    setCouponError('');
    if (!code) {
      setAppliedCoupon(null);
      return;
    }
    try {
      setValidatingCoupon(true);
      const res = await storeApi.validateCoupon(code, cartSubtotal);
      setAppliedCoupon({
        code,
        coupon: res?.coupon || { code },
        discountAmount: Number(res?.discountAmount || 0),
        freeShipping: Boolean(res?.freeShipping || code === 'SHIPFREE'),
        message: res?.message || `Đã áp dụng mã ${code} thành công!`,
      });
      setSavedCoupon(code);
      showToast(res?.message || `Áp dụng mã giảm giá ${code} thành công!`);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.message || 'Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện');
    } finally {
      setValidatingCoupon(false);
    }
  };

  useEffect(() => {
    if (appliedCoupon?.code && cartSubtotal > 0) {
      storeApi
        .validateCoupon(appliedCoupon.code, cartSubtotal)
        .then((res) => {
          setAppliedCoupon({
            code: appliedCoupon.code,
            coupon: res?.coupon || { code: appliedCoupon.code },
            discountAmount: Number(res?.discountAmount || 0),
            freeShipping: Boolean(res?.freeShipping || appliedCoupon.code === 'SHIPFREE'),
            message: res?.message || `Đã áp dụng mã ${appliedCoupon.code}`,
          });
          setCouponError('');
        })
        .catch((err) => {
          setAppliedCoupon(null);
          setCouponError(err.message || 'Giỏ hàng thay đổi khiến mã không còn đủ điều kiện');
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSubtotal]);

  const selectedShipObj =
    SHIPPING_METHODS.find((m) => m.id === shippingMethod) || SHIPPING_METHODS[0];

  const shippingFee = useMemo(() => {
    if (appliedCoupon?.freeShipping) return 0;
    if (cartSubtotal >= freeShippingThreshold && selectedShipObj.eligibleForThresholdFree) {
      return 0;
    }
    return selectedShipObj.fee;
  }, [appliedCoupon, cartSubtotal, freeShippingThreshold, selectedShipObj]);

  const discountAmount = Number(appliedCoupon?.discountAmount || 0);
  const taxRate = Number(homeData.settings?.taxRate ?? 8);
  const taxableBase = Math.max(0, cartSubtotal - discountAmount);
  const taxAmount = Number(((taxableBase * taxRate) / 100).toFixed(2));
  const finalTotal = Number((taxableBase + shippingFee + taxAmount).toFixed(2));

  const fillDemoCustomer = () => {
    setForm({
      name: 'Sarah Kim',
      email: 'sarah.kim@example.com',
      phone: '+84 912 345 678',
      address: 'Số 88 Đồng Khởi, Quận 1, TP. Hồ Chí Minh',
      note: 'Giao giờ hành chính, gọi trước khi giao 15 phút.',
    });
    showToast('Đã điền nhanh thông tin mẫu! Bạn có thể bấm Hoàn tất đặt hàng ngay.');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0 || submitting) return;

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim()) {
      showToast('Vui lòng điền đủ Họ tên, SĐT, Email và Địa chỉ nhận hàng', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const res = await storeApi.checkout({
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        },
        items: cart.map((item) => ({
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          variant: item.variant,
        })),
        shippingMethod,
        paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
        note: form.note.trim() || undefined,
      });

      const order = res?.order || res;
      const shipment = res?.shipment || null;
      const transaction = res?.transaction || null;

      const orderCode = order?.orderCode || order?.id || 'SF99999';
      const trackingCode = shipment?.trackingCode || shipment?.id || 'TRK-99999';
      const txnCode = transaction?.txnCode || transaction?.id || 'TXN-99999';
      const paidTotal = Number(order?.total ?? finalTotal);

      recordPlacedOrder({
        orderCode,
        trackingCode,
        txnCode,
        total: paidTotal,
        date: order?.date || 'Hôm nay',
        email: form.email.trim(),
        customerName: form.name.trim(),
      });

      clearCart(true);
      setSavedCoupon('');
      setAppliedCoupon(null);
      setPlacedResult({
        orderCode,
        trackingCode,
        txnCode,
        total: paidTotal,
        shippingMethod,
        paymentMethod,
        customerName: form.name.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
      });
      refreshHome();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`Đặt hàng thành công! Mã đơn #${orderCode}`);
    } catch (err) {
      showToast(err.message || 'Không thể hoàn tất đặt hàng lúc này', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Order Confirmation View (Step 3 Completed)
  if (placedResult) {
    return (
      <div className="sf-container" style={{ maxWidth: '800px', paddingTop: '30px' }}>
        <div className="sf-card" style={{ padding: 0, overflow: 'hidden', marginBottom: '20px' }}>
          <div className="sf-flow-steps" style={{ borderBottom: 0 }}>
            <div className="sf-flow-step is-done">① Giỏ hàng ✓</div>
            <div className="sf-flow-step is-done">② Địa chỉ & Ưu đãi ✓</div>
            <div className="sf-flow-step is-active">③ Hoàn tất đơn hàng</div>
          </div>
        </div>

        <section className="sf-card" style={{ textAlign: 'center', padding: '42px 32px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              background: 'var(--sf-success-soft)',
              color: 'var(--sf-success)',
              border: 'var(--sf-card-border)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 18px',
            }}
          >
            <SfIcon name="check" size={34} />
          </div>

          <span className="sf-eyebrow">Đơn hàng đã chuyển vào kho đóng gói</span>
          <h1 style={{ fontSize: '30px', fontWeight: 900, marginBottom: '10px' }}>
            Đặt hàng thành công!
          </h1>
          <p style={{ color: 'var(--sf-text-muted)', maxWidth: '540px', margin: '0 auto 26px' }}>
            Cảm ơn <strong>{placedResult.customerName}</strong>! Bạn hãy lưu lại Mã đơn hàng dưới đây để kiểm tra tiến độ giao hàng bất cứ lúc nào.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
              background: 'var(--sf-bg-soft)',
              padding: '20px',
              border: 'var(--sf-card-border)',
              textAlign: 'left',
              marginBottom: '24px',
            }}
          >
            <div>
              <small style={{ color: 'var(--sf-text-muted)', fontSize: '12px', fontWeight: 700 }}>Mã đơn hàng của bạn</small>
              <strong style={{ display: 'block', fontSize: '20px', fontWeight: 900, color: 'var(--sf-primary)' }}>
                #{placedResult.orderCode}
              </strong>
            </div>
            <div>
              <small style={{ color: 'var(--sf-text-muted)', fontSize: '12px', fontWeight: 700 }}>Mã vận đơn bưu cục</small>
              <strong style={{ display: 'block', fontSize: '18px', fontWeight: 900 }}>
                {placedResult.trackingCode}
              </strong>
            </div>
            <div>
              <small style={{ color: 'var(--sf-text-muted)', fontSize: '12px', fontWeight: 700 }}>Tổng thanh toán</small>
              <strong style={{ display: 'block', fontSize: '20px', fontWeight: 900, color: 'var(--sf-success)' }}>
                {formatMoney(placedResult.total)}
              </strong>
            </div>
          </div>

          <div
            style={{
              textAlign: 'left',
              padding: '16px 20px',
              border: 'var(--sf-btn-border)',
              background: 'var(--sf-surface-elevated)',
              marginBottom: '28px',
              fontSize: '14px',
              display: 'grid',
              gap: '6px',
            }}
          >
            <div><strong>Người nhận:</strong> {placedResult.customerName} ({placedResult.email})</div>
            <div><strong>Giao tới địa chỉ:</strong> {placedResult.address}</div>
            <div><strong>Hình thức giao & trả tiền:</strong> {placedResult.shippingMethod} · {placedResult.paymentMethod} (Mã GD: {placedResult.txnCode})</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              to={`/store/orders?code=${encodeURIComponent(placedResult.orderCode)}`}
              className="sf-btn sf-btn-primary"
            >
              <SfIcon name="package" size={17} />
              <span>Theo dõi đơn hàng ngay</span>
            </Link>
            <Link to="/store/products" className="sf-btn sf-btn-outline">
              <span>Tiếp tục mua sắm</span>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  // Empty Cart View
  if (cart.length === 0) {
    return (
      <div className="sf-container" style={{ maxWidth: '640px', paddingTop: '44px' }}>
        <div className="sf-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '10px' }}>
            Giỏ hàng đang trống
          </h1>
          <p style={{ color: 'var(--sf-text-muted)', marginBottom: '22px' }}>
            Bạn hãy chọn ít nhất một sản phẩm vào giỏ trước khi điền địa chỉ nhận hàng nhé!
          </p>
          <Link to="/store/products" className="sf-btn sf-btn-primary">
            <span>Quay lại chọn sản phẩm</span>
            <SfIcon name="arrow-right" size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sf-container">
      <div style={{ marginTop: '26px' }}>
        <span className="sf-eyebrow">Đặt hàng nhanh trong 30 giây</span>
        <h1 className="sf-section-title">Thanh toán & Xác nhận giao hàng</h1>
      </div>

      {/* 3-Step Clear Progress Header */}
      <div className="sf-card" style={{ padding: 0, overflow: 'hidden', marginTop: '16px' }}>
        <div className="sf-flow-steps" style={{ borderBottom: 0, fontSize: '13.5px', padding: '14px 18px' }}>
          <div className="sf-flow-step is-done">① Giỏ hàng ({cartCount} món) ✓</div>
          <div className="sf-flow-step is-active">② Điền địa chỉ & Chọn Voucher</div>
          <div className="sf-flow-step">③ Hoàn tất nhận mã đơn</div>
        </div>
      </div>

      <form className="sf-checkout-grid" onSubmit={handlePlaceOrder}>
        {/* Left Column: Customer, Shipping & Payment */}
        <div>
          <section className="sf-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <h2 style={{ marginBottom: 0 }}>1. Giao hàng tới đâu?</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="sf-btn sf-btn-amber sf-btn-sm"
                  onClick={fillDemoCustomer}
                >
                  ⚡ Điền nhanh thông tin mẫu
                </button>
                {customer && (
                  <span className="sf-pill sf-pill-success">
                    ✓ Tài khoản: {customer.name}
                  </span>
                )}
              </div>
            </div>

            <div className="sf-form-grid">
              <div className="sf-field">
                <label htmlFor="sf-co-name">Họ và tên người nhận *</label>
                <input
                  id="sf-co-name"
                  className="sf-input"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="sf-field">
                <label htmlFor="sf-co-phone">Số điện thoại nhận hàng *</label>
                <input
                  id="sf-co-phone"
                  className="sf-input"
                  placeholder="Ví dụ: 0912 345 678"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  required
                />
              </div>

              <div className="sf-field sf-field-full">
                <label htmlFor="sf-co-email">Email nhận mã đơn & hóa đơn *</label>
                <input
                  id="sf-co-email"
                  type="email"
                  className="sf-input"
                  placeholder="khachhang@example.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              <div className="sf-field sf-field-full">
                <label htmlFor="sf-co-address">Địa chỉ nhận hàng chi tiết *</label>
                <input
                  id="sf-co-address"
                  className="sf-input"
                  placeholder="Số nhà, tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  required
                />
              </div>

              <div className="sf-field sf-field-full">
                <label htmlFor="sf-co-note">Lời nhắn cho người giao hàng (không bắt buộc)</label>
                <input
                  id="sf-co-note"
                  className="sf-input"
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>
            </div>
          </section>

          <section className="sf-card">
            <h2>2. Chọn tốc độ giao hàng</h2>
            <div className="sf-radio-grid">
              {SHIPPING_METHODS.map((m) => {
                const isFree =
                  appliedCoupon?.freeShipping ||
                  (cartSubtotal >= freeShippingThreshold && m.eligibleForThresholdFree);
                const selected = shippingMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`sf-radio-card ${selected ? 'is-selected' : ''}`}
                    onClick={() => setShippingMethod(m.id)}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: '14.5px' }}>{m.label}</strong>
                      <small style={{ color: 'var(--sf-text-muted)', fontSize: '12.5px' }}>{m.eta}</small>
                    </div>
                    <strong style={{ fontSize: '15px', color: isFree ? 'var(--sf-success)' : 'var(--sf-text)' }}>
                      {isFree ? 'Miễn phí ($0)' : formatMoney(m.fee)}
                    </strong>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="sf-card">
            <h2>3. Chọn cách thanh toán</h2>
            <div className="sf-radio-grid">
              {PAYMENT_METHODS.map((pm) => {
                const selected = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    className={`sf-radio-card ${selected ? 'is-selected' : ''}`}
                    onClick={() => setPaymentMethod(pm.id)}
                  >
                    <div>
                      <strong style={{ display: 'block', fontSize: '14.5px' }}>{pm.label}</strong>
                      <small style={{ color: 'var(--sf-text-muted)', fontSize: '12.5px' }}>{pm.desc}</small>
                    </div>
                    <span className={`sf-pill ${selected ? 'sf-pill-forest' : 'sf-pill-amber'}`}>
                      {selected ? '✓ Đã chọn' : 'Chọn'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary & One-Click Voucher Tickets */}
        <aside className="sf-card" style={{ position: 'sticky', top: '94px' }}>
          <h2>Đơn hàng của bạn ({cartCount} món)</h2>

          <div style={{ display: 'grid', gap: '12px', maxHeight: '240px', overflowY: 'auto', marginBottom: '18px' }}>
            {cart.map((item) => (
              <div
                key={item.cartKey}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '54px minmax(0, 1fr) auto',
                  gap: '10px',
                  alignItems: 'center',
                }}
              >
                <img
                  src={item.image || FALLBACK_PRODUCT_IMAGE}
                  alt={item.name}
                  style={{
                    width: '54px',
                    height: '54px',
                    objectFit: 'contain',
                    background: 'var(--sf-bg-soft)',
                    border: '1px solid var(--sf-border-subtle)',
                    padding: '4px',
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </strong>
                  <small style={{ color: 'var(--sf-text-muted)', fontSize: '12px' }}>
                    {item.variant} · SL: {item.quantity}
                  </small>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
                    <button
                      type="button"
                      style={{ fontSize: '12px', fontWeight: 800, color: 'var(--sf-text-muted)' }}
                      onClick={() => updateCartQty(item.cartKey, item.quantity - 1)}
                    >
                      [−]
                    </button>
                    <button
                      type="button"
                      style={{ fontSize: '12px', fontWeight: 800, color: 'var(--sf-text-muted)' }}
                      onClick={() => updateCartQty(item.cartKey, item.quantity + 1)}
                    >
                      [+]
                    </button>
                    <button
                      type="button"
                      style={{ fontSize: '12px', fontWeight: 800, color: 'var(--sf-danger)' }}
                      onClick={() => removeFromCart(item.cartKey)}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
                <strong style={{ fontSize: '14.5px', fontWeight: 900 }}>
                  {formatMoney(item.price * item.quantity)}
                </strong>
              </div>
            ))}
          </div>

          {/* One-Click Voucher Tickets */}
          <div
            style={{
              padding: '14px',
              background: 'var(--sf-bg-soft)',
              border: 'var(--sf-card-border)',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '13.5px', fontWeight: 900, marginBottom: '10px' }}>
              🎟 Chọn Vé Giảm Giá (Bấm 1 chạm để áp dụng)
            </div>

            <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
              {voucherCards.slice(0, 4).map((v) => {
                const code = String(v.code || '').toUpperCase();
                const minSpend = Number(v.minSpend || 0);
                const eligible = cartSubtotal >= minSpend;
                const missing = Math.max(0, minSpend - cartSubtotal);
                const isSelected = appliedCoupon?.code === code;
                const benefitText = String(v.discountType || '').includes('Miễn phí')
                  ? 'Miễn phí ship'
                  : String(v.discountType || '').includes('%')
                  ? `Giảm ${v.value}%`
                  : `Giảm ${formatMoney(v.value)}`;

                return (
                  <div
                    key={code}
                    className={`sf-voucher-ticket ${isSelected ? 'is-active' : ''}`}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <strong style={{ fontFamily: 'monospace', fontSize: '13.5px', fontWeight: 900 }}>
                          {code}
                        </strong>
                        <span className="sf-pill sf-pill-amber">{benefitText}</span>
                      </div>
                      <small
                        style={{
                          display: 'block',
                          marginTop: '3px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: eligible ? 'var(--sf-success)' : 'var(--sf-text-muted)',
                        }}
                      >
                        {eligible
                          ? `✓ Đủ điều kiện dùng ngay (đơn ≥ ${formatMoney(minSpend)})`
                          : `Mua thêm ${formatMoney(missing)} để đủ đơn ${formatMoney(minSpend)}`}
                      </small>
                    </div>

                    <button
                      type="button"
                      className={`sf-btn sf-btn-sm ${isSelected ? 'sf-btn-primary' : 'sf-btn-amber'}`}
                      disabled={validatingCoupon}
                      onClick={() => handleApplyCoupon(code)}
                    >
                      {isSelected ? '✓ Đang dùng' : 'Dùng mã này'}
                    </button>
                  </div>
                );
              })}
            </div>

            <label htmlFor="sf-coupon-input" style={{ display: 'block', fontSize: '12px', fontWeight: 800, marginBottom: '6px' }}>
              Hoặc tự nhập mã khác:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="sf-coupon-input"
                className="sf-input"
                placeholder="Nhập mã (VD: HELLO10)"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              />
              <button
                type="button"
                className="sf-btn sf-btn-outline sf-btn-sm"
                disabled={validatingCoupon || !couponInput.trim()}
                onClick={() => handleApplyCoupon(couponInput)}
              >
                {validatingCoupon ? 'Đang kiểm...' : 'Áp dụng'}
              </button>
            </div>

            {appliedCoupon && (
              <div
                style={{
                  marginTop: '10px',
                  fontSize: '12.5px',
                  color: 'var(--sf-success)',
                  fontWeight: 800,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>✓ {appliedCoupon.message}</span>
                <button
                  type="button"
                  style={{ color: 'var(--sf-danger)', fontWeight: 900 }}
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponInput('');
                  }}
                >
                  Bỏ mã
                </button>
              </div>
            )}

            {couponError && (
              <div style={{ marginTop: '8px', fontSize: '12.5px', color: 'var(--sf-danger)', fontWeight: 800 }}>
                ⚠ {couponError}
              </div>
            )}
          </div>

          {/* Transparent Calculation Breakdown */}
          <div className="sf-summary-rows">
            <div className="sf-summary-row">
              <span style={{ color: 'var(--sf-text-muted)', fontWeight: 700 }}>Tiền hàng tạm tính</span>
              <strong>{formatMoney(cartSubtotal)}</strong>
            </div>

            {discountAmount > 0 && (
              <div className="sf-summary-row" style={{ color: 'var(--sf-success)', fontWeight: 800 }}>
                <span>Tiền được giảm ({appliedCoupon?.code})</span>
                <strong>−{formatMoney(discountAmount)}</strong>
              </div>
            )}

            <div className="sf-summary-row">
              <span style={{ color: 'var(--sf-text-muted)', fontWeight: 700 }}>Phí giao hàng tận nơi</span>
              <strong style={shippingFee === 0 ? { color: 'var(--sf-success)' } : undefined}>
                {shippingFee === 0 ? 'Miễn phí ($0)' : formatMoney(shippingFee)}
              </strong>
            </div>

            <div className="sf-summary-row">
              <span style={{ color: 'var(--sf-text-muted)', fontWeight: 700 }}>Thuế VAT ({taxRate}%)</span>
              <strong>{formatMoney(taxAmount)}</strong>
            </div>
          </div>

          <div className="sf-summary-total">
            <span>Tổng tiền thanh toán</span>
            <strong>{formatMoney(finalTotal)}</strong>
          </div>

          <button
            type="submit"
            className="sf-btn sf-btn-primary sf-btn-block"
            disabled={submitting}
          >
            <SfIcon name="shield" size={17} />
            <span>{submitting ? 'Đang tạo đơn hàng...' : 'Hoàn tất đặt hàng'}</span>
          </button>
        </aside>
      </form>
    </div>
  );
}
