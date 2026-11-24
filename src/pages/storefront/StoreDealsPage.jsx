import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SfIcon } from '../../components/storefront/StoreIcons';
import { useStore } from '../../components/storefront/StoreContext';
import ProductCard from '../../components/storefront/ProductCard';
import { storeApi, formatMoney } from '../../components/storefront/storeApi';

export default function StoreDealsPage() {
  const { homeData, copyCouponCode, savedCoupon, freeShippingThreshold } = useStore();
  const [dealProducts, setDealProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const items = await storeApi.getProducts({ sort: 'popular', inStockOnly: 'true' });
        if (active) setDealProducts(items.slice(0, 8));
      } catch {
        if (active) setDealProducts(homeData.featuredProducts || []);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [homeData.featuredProducts]);

  const coupons = homeData.activeCoupons || [];

  return (
    <div className="sf-container">
      {/* Deals Banner */}
      <section
        className="sf-hero"
        style={{
          gridTemplateColumns: '1fr',
          padding: '38px 40px',
        }}
      >
        <div>
          <span className="sf-hero-tag">
            <SfIcon name="tag" size={15} />
            <span>Tuần lễ Ưu đãi Veylix Studio</span>
          </span>
          <h1 style={{ maxWidth: '720px' }}>Kho Vé Giảm Giá (Voucher) & Kệ hàng Bán chạy</h1>
          <p style={{ marginBottom: '20px' }}>
            Bấm <strong>Sao chép mã</strong> dưới đây — hệ thống sẽ lưu sẵn và hiện ngay cho bạn dùng ở bước Thanh toán. Miễn phí giao hàng cho đơn từ {formatMoney(freeShippingThreshold)}!
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/store/checkout" className="sf-btn sf-btn-primary">
              <span>Đến trang Thanh toán dùng mã</span>
              <SfIcon name="arrow-right" size={16} />
            </Link>
            <Link to="/store/products" className="sf-btn sf-btn-outline">
              <span>Xem tất cả sản phẩm</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Active Coupons Vault */}
      <section className="sf-section">
        <div className="sf-section-head">
          <div>
            <span className="sf-eyebrow">Kho mã giảm giá thực tế</span>
            <h2 className="sf-section-title">Mã Ưu đãi đang kích hoạt ({coupons.length})</h2>
          </div>
        </div>

        {coupons.length === 0 ? (
          <div className="sf-card" style={{ textAlign: 'center' }}>
            Hiện chưa có mã giảm giá công khai mới. Bạn vẫn được miễn phí vận chuyển cho đơn từ {formatMoney(freeShippingThreshold)}!
          </div>
        ) : (
          <div className="sf-coupons-grid">
            {coupons.map((coupon) => {
              const isSaved = savedCoupon === coupon.code;
              const usedPct = coupon.usageLimit
                ? Math.min(100, Math.round((Number(coupon.usageCount || 0) / Number(coupon.usageLimit)) * 100))
                : 35;

              return (
                <div key={coupon.id || coupon.code} className="sf-coupon-card">
                  <div>
                    <div className="sf-coupon-top">
                      <span className="sf-coupon-code">{coupon.code}</span>
                      <span className="sf-pill sf-pill-amber">
                        {coupon.eligibility || 'Tất cả khách hàng'}
                      </span>
                    </div>
                    <div className="sf-coupon-value">
                      {String(coupon.discountType || '').includes('Miễn phí')
                        ? 'Miễn phí vận chuyển'
                        : String(coupon.discountType || '').includes('%')
                        ? `Giảm ${coupon.value}%`
                        : `Giảm ${formatMoney(coupon.value)}`}
                    </div>
                    <p className="sf-coupon-cond">
                      Đơn tối thiểu: <strong>{formatMoney(coupon.minSpend || 0)}</strong> · Hạn dùng: {coupon.endDate || '31 Thg 12, 2026'}
                    </p>

                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--sf-text-muted)' }}>
                        <span>Đã dùng {coupon.usageCount || 0}/{coupon.usageLimit || 100}</span>
                        <span>{usedPct}%</span>
                      </div>
                      <div className="sf-shipping-progress" style={{ height: '5px', marginTop: '4px' }}>
                        <span style={{ width: `${usedPct}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="sf-coupon-bottom">
                    <span>Áp dụng trực tuyến</span>
                    <button
                      type="button"
                      className={`sf-btn sf-btn-sm ${isSaved ? 'sf-btn-primary' : 'sf-btn-amber'}`}
                      onClick={() => copyCouponCode(coupon.code)}
                    >
                      <SfIcon name={isSaved ? 'check' : 'copy'} size={14} />
                      <span>{isSaved ? 'Đã sao chép' : 'Sao chép mã'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Featured Deal Products */}
      <section className="sf-section">
        <div className="sf-section-head">
          <div>
            <span className="sf-eyebrow">Gợi ý mua kèm để đủ ngưỡng Voucher</span>
            <h2 className="sf-section-title">Sản phẩm Nổi bật đang có sẵn</h2>
          </div>
        </div>

        {loading ? (
          <div className="sf-card" style={{ textAlign: 'center', padding: '44px 20px' }}>
            Đang tải danh sách sản phẩm ưu đãi...
          </div>
        ) : (
          <div className="sf-products-grid">
            {dealProducts.map((p) => (
              <ProductCard key={p.id || p.sku} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
