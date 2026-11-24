import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SfIcon } from './StoreIcons';
import { useStore } from './StoreContext';
import { formatMoney, FALLBACK_PRODUCT_IMAGE } from './storeApi';

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cart,
    cartCount,
    cartSubtotal,
    freeShippingThreshold,
    isCartOpen,
    setIsCartOpen,
    updateCartQty,
    removeFromCart,
    clearCart,
    savedCoupon,
  } = useStore();

  const [confirmClear, setConfirmClear] = useState(false);

  if (!isCartOpen) return null;

  const remainingForFreeShip = Math.max(0, freeShippingThreshold - cartSubtotal);
  const progressPct = Math.min(100, (cartSubtotal / freeShippingThreshold) * 100);

  const goCheckout = () => {
    setIsCartOpen(false);
    navigate('/store/checkout');
  };

  return (
    <div
      className="sf-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Giỏ hàng của bạn"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsCartOpen(false);
      }}
    >
      <aside className="sf-drawer">
        <div className="sf-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SfIcon name="bag" size={20} />
            <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>
              Giỏ hàng của bạn ({cartCount} món)
            </h2>
          </div>
          <button
            type="button"
            className="sf-icon-btn"
            aria-label="Đóng giỏ hàng"
            onClick={() => setIsCartOpen(false)}
          >
            <SfIcon name="close" size={18} />
          </button>
        </div>

        {/* 3-Step Clear Purchase Progress */}
        <div className="sf-flow-steps" aria-label="Các bước đặt hàng">
          <div className="sf-flow-step is-active">① Giỏ hàng</div>
          <div className="sf-flow-step">② Địa chỉ & Ưu đãi</div>
          <div className="sf-flow-step">③ Hoàn tất</div>
        </div>

        <div className="sf-shipping-bar">
          {remainingForFreeShip > 0 ? (
            <span>
              🚚 Mua thêm <strong>{formatMoney(remainingForFreeShip)}</strong> nữa để được{' '}
              <strong style={{ color: 'var(--sf-success)' }}>Miễn phí giao hàng tận nơi</strong>!
            </span>
          ) : (
            <span style={{ color: 'var(--sf-success)', fontWeight: 900 }}>
              🎉 Tuyệt vời! Đơn hàng này của bạn được Miễn phí giao hàng ($0)!
            </span>
          )}
          <div className="sf-shipping-progress">
            <span style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="sf-drawer-body">
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '44px 16px', margin: 'auto 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'var(--sf-bg-soft)',
                  border: 'var(--sf-btn-border)',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--sf-primary)',
                }}
              >
                <SfIcon name="bag" size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '8px' }}>
                Chưa có món nào trong giỏ
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--sf-text-muted)', marginBottom: '20px' }}>
                Hãy bấm nút <strong>🛒 Thêm giỏ</strong> hoặc <strong>⚡ Mua ngay</strong> trên món đồ bạn thích nhé!
              </p>
              <Link
                to="/store/products"
                className="sf-btn sf-btn-primary"
                onClick={() => setIsCartOpen(false)}
              >
                <span>Chọn mua sản phẩm ngay</span>
                <SfIcon name="arrow-right" size={16} />
              </Link>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.cartKey} className="sf-cart-item">
                  <Link
                    to={`/store/products/${encodeURIComponent(item.productId || item.sku)}`}
                    onClick={() => setIsCartOpen(false)}
                  >
                    <img
                      src={item.image || FALLBACK_PRODUCT_IMAGE}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                      }}
                    />
                  </Link>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <Link
                        to={`/store/products/${encodeURIComponent(item.productId || item.sku)}`}
                        onClick={() => setIsCartOpen(false)}
                        style={{ fontWeight: 800, fontSize: '14px', lineHeight: 1.35 }}
                      >
                        {item.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.cartKey)}
                        aria-label={`Xóa ${item.name}`}
                        title="Bỏ món này khỏi giỏ"
                        style={{ color: 'var(--sf-danger)', padding: '2px' }}
                      >
                        <SfIcon name="trash" size={15} />
                      </button>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--sf-text-muted)', marginTop: '3px' }}>
                      Phân loại: {item.variant}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '10px',
                      }}
                    >
                      <div className="sf-qty-control" style={{ height: '32px' }}>
                        <button
                          type="button"
                          style={{ width: '28px', fontSize: '15px' }}
                          onClick={() => updateCartQty(item.cartKey, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span style={{ minWidth: '28px', fontSize: '13px' }}>{item.quantity}</span>
                        <button
                          type="button"
                          style={{ width: '28px', fontSize: '15px' }}
                          disabled={item.quantity >= (item.maxStock || 99)}
                          onClick={() => updateCartQty(item.cartKey, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <strong style={{ fontSize: '15.5px', fontWeight: 900, color: 'var(--sf-primary)' }}>
                        {formatMoney(item.price * item.quantity)}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                {!confirmClear ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    style={{ fontSize: '12.5px', color: 'var(--sf-danger)', fontWeight: 800 }}
                  >
                    🗑 Làm trống giỏ hàng
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
                    <span>Xóa tất cả món trong giỏ?</span>
                    <button
                      type="button"
                      className="sf-btn sf-btn-danger sf-btn-sm"
                      onClick={() => {
                        clearCart();
                        setConfirmClear(false);
                      }}
                    >
                      Đồng ý xóa
                    </button>
                    <button
                      type="button"
                      className="sf-btn sf-btn-outline sf-btn-sm"
                      onClick={() => setConfirmClear(false)}
                    >
                      Không
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="sf-drawer-footer">
            {savedCoupon && (
              <div
                style={{
                  background: 'var(--sf-primary-soft)',
                  border: '1.5px solid var(--sf-border-color)',
                  padding: '8px 12px',
                  fontSize: '12.5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>🎟 Đã lưu mã: <strong>{savedCoupon}</strong></span>
                <span style={{ color: 'var(--sf-primary)', fontWeight: 900 }}>Dùng ở bước tiếp →</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: 'var(--sf-text-muted)', fontWeight: 800 }}>Tiền hàng tạm tính</span>
              <strong style={{ fontSize: '22px', fontWeight: 900, color: 'var(--sf-primary)' }}>
                {formatMoney(cartSubtotal)}
              </strong>
            </div>
            <small style={{ fontSize: '12px', color: 'var(--sf-text-muted)', marginTop: '-6px' }}>
              Bước tiếp theo bạn sẽ chọn Địa chỉ nhận hàng & bấm chọn Voucher giảm giá.
            </small>

            <button type="button" className="sf-btn sf-btn-primary sf-btn-block" onClick={goCheckout}>
              <span>Sang bước ②: Điền địa chỉ & Áp mã giảm giá</span>
              <SfIcon name="arrow-right" size={16} />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
