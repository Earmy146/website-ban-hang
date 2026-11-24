import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SfIcon, StarRating } from '../../components/storefront/StoreIcons';
import { useStore } from '../../components/storefront/StoreContext';
import ProductCard from '../../components/storefront/ProductCard';
import { formatMoney, FALLBACK_PRODUCT_IMAGE } from '../../components/storefront/storeApi';

function describeCouponValue(coupon) {
  if (!coupon) return '';
  const type = String(coupon.discountType || '');
  if (type.includes('Miễn phí') || coupon.code === 'SHIPFREE') {
    return 'Miễn phí giao hàng toàn đơn';
  }
  if (type.includes('%')) {
    return `Giảm ngay ${coupon.value}% tiền hàng`;
  }
  return `Trừ thẳng ${formatMoney(coupon.value)} vào đơn`;
}

export default function StoreHomePage() {
  const {
    homeData,
    homeLoading,
    freeShippingThreshold,
    copyCouponCode,
    savedCoupon,
    setIsStylePanelOpen,
  } = useStore();
  const [activeTab, setActiveTab] = useState('bestseller');

  const settings = homeData.settings || {};
  const sfCfg = homeData.storefrontConfig?.settings || homeData.storefrontConfig || {};

  const heroBadge = sfCfg.heroBadge || '⚡ Cửa hàng trực tuyến thế hệ mới 2026';
  const heroTitle =
    sfCfg.heroTitle ||
    sfCfg.bannerTitle ||
    sfCfg.title ||
    'Mua sắm rõ ràng, chọn món cực nhanh — giao tận tay.';
  const heroSubtitle =
    sfCfg.heroSubtitle ||
    sfCfg.bannerSubtitle ||
    sfCfg.subtitle ||
    'Mọi sản phẩm đều hiển thị đúng số lượng còn sẵn trong kho, áp mã giảm giá chỉ với 1 cú nhấp và đổi trả miễn phí trong 30 ngày.';
  const heroCtaText = sfCfg.heroCtaText || sfCfg.primaryCtaText || 'Xem tất cả sản phẩm';
  const heroCtaLink = sfCfg.heroCtaLink || sfCfg.ctaLink || '/store/products';

  const showCategories = sfCfg.showCategoriesSection !== false;
  const showCoupons = sfCfg.showCouponsSection !== false;
  const showReviews = sfCfg.showReviewsSection !== false;

  const featuredLimit = Number(sfCfg.featuredLimit || sfCfg.featuredCount || 8);

  const displayedProducts = useMemo(() => {
    const list = [...(homeData.featuredProducts || [])];
    if (activeTab === 'bestseller') {
      list.sort((a, b) => Number(b.sales || 0) - Number(a.sales || 0));
    } else if (activeTab === 'rating') {
      list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (activeTab === 'newest') {
      list.reverse();
    }
    return list.slice(0, Math.max(4, featuredLimit));
  }, [homeData.featuredProducts, activeTab, featuredLimit]);

  const heroShowcase = useMemo(
    () => (homeData.featuredProducts || []).slice(0, 3),
    [homeData.featuredProducts]
  );

  return (
    <div className="sf-container">
      {/* Hero Section */}
      <section className="sf-hero">
        <div>
          <span className="sf-hero-tag">
            <span>{heroBadge}</span>
          </span>
          <h1>{heroTitle}</h1>
          <p>{heroSubtitle}</p>

          <div className="sf-hero-ctas">
            <Link to={heroCtaLink} className="sf-btn sf-btn-primary">
              <span>🛍️ {heroCtaText}</span>
              <SfIcon name="arrow-right" size={16} />
            </Link>
            <Link to="/store/deals" className="sf-btn sf-btn-amber">
              <SfIcon name="tag" size={16} />
              <span>Lấy Voucher Giảm Giá</span>
            </Link>
            <button
              type="button"
              className="sf-btn sf-btn-outline"
              onClick={() => setIsStylePanelOpen(true)}
            >
              <span>🎨 Đổi phong cách giao diện</span>
            </button>
          </div>

          <div className="sf-hero-stats">
            <div>
              <strong>12,400+</strong>
              <span>Khách mua hài lòng</span>
            </div>
            <div>
              <strong>4.8 / 5 ★</strong>
              <span>Đánh giá người mua thật</span>
            </div>
            <div>
              <strong>30 ngày</strong>
              <span>Đổi trả miễn phí tận nhà</span>
            </div>
          </div>
        </div>

        <div className="sf-hero-showcase">
          {heroShowcase.map((item, idx) => (
            <Link
              key={item.id || item.sku || idx}
              to={`/store/products/${encodeURIComponent(item.id || item.sku)}`}
              className="sf-hero-card"
            >
              <img
                src={item.image || FALLBACK_PRODUCT_IMAGE}
                alt={item.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                }}
              />
              <div>
                <small>{item.brand || item.category}</small>
                <strong>{item.name}</strong>
                <b>{formatMoney(item.price)} →</b>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3-Step Visual Guide: Nhìn vào là hiểu ngay cách mua */}
      <section className="sf-how-grid" aria-label="Hướng dẫn mua hàng 3 bước dễ dàng">
        <div className="sf-how-card">
          <div className="sf-how-num">①</div>
          <div>
            <strong>Chọn món ưng ý</strong>
            <p>
              Xem số lượng còn sẵn trên từng món, bấm <strong>🛒 Thêm giỏ</strong> để chọn nhiều món hoặc <strong>⚡ Mua ngay</strong>.
            </p>
          </div>
        </div>
        <div className="sf-how-card">
          <div className="sf-how-num">②</div>
          <div>
            <strong>Bấm dùng Voucher sẵn có</strong>
            <p>
              Không cần nhớ mã! Tại trang thanh toán có sẵn các vé giảm giá <strong>HELLO10, WELCOME20</strong> bấm 1 chạm là giảm tiền.
            </p>
          </div>
        </div>
        <div className="sf-how-card">
          <div className="sf-how-num">③</div>
          <div>
            <strong>Đặt hàng 30 giây & Theo dõi tận tay</strong>
            <p>
              Nhận ngay mã đơn <strong>#SFxxxxx</strong> sau khi đặt để kiểm tra 4 chặng giao hàng bất cứ lúc nào tại mục Tra cứu đơn.
            </p>
          </div>
        </div>
      </section>

      {/* Value Commitments Strip */}
      <section className="sf-trust-strip" aria-label="Cam kết dịch vụ Veylix">
        <div className="sf-trust-item">
          <span className="sf-trust-icon">
            <SfIcon name="truck" size={20} />
          </span>
          <div>
            <strong>Miễn phí vận chuyển</strong>
            <small>Cho mọi đơn hàng từ {formatMoney(freeShippingThreshold)}</small>
          </div>
        </div>
        <div className="sf-trust-item">
          <span className="sf-trust-icon">
            <SfIcon name="refresh" size={20} />
          </span>
          <div>
            <strong>Đổi trả trong 30 ngày</strong>
            <small>Thủ tục đơn giản, hoàn tiền nhanh</small>
          </div>
        </div>
        <div className="sf-trust-item">
          <span className="sf-trust-icon">
            <SfIcon name="shield" size={20} />
          </span>
          <div>
            <strong>Kiểm hàng khi nhận</strong>
            <small>Đảm bảo chính hãng {settings.storeName || 'Veylix'}</small>
          </div>
        </div>
        <div className="sf-trust-item">
          <span className="sf-trust-icon">
            <SfIcon name="chat" size={20} />
          </span>
          <div>
            <strong>Chat trực tiếp với Shop</strong>
            <small>Nút chat góc phải luôn sẵn sàng</small>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      {showCategories && homeData.categories?.length > 0 && (
        <section className="sf-section">
          <div className="sf-section-head">
            <div>
              <span className="sf-eyebrow">Tìm nhanh theo nhu cầu</span>
              <h2 className="sf-section-title">Bạn đang muốn mua nhóm hàng nào?</h2>
            </div>
            <Link to="/store/products" className="sf-btn sf-btn-outline sf-btn-sm">
              <span>Xem tất cả danh mục</span>
              <SfIcon name="arrow-right" size={15} />
            </Link>
          </div>

          <div className="sf-categories-grid">
            {homeData.categories.map((cat) => (
              <Link
                key={cat.id || cat.slug || cat.name}
                to={`/store/products?category=${encodeURIComponent(cat.name)}`}
                className="sf-category-card"
              >
                <span className="sf-category-emoji" aria-hidden="true">
                  {cat.icon || '✨'}
                </span>
                <div>
                  <strong>{cat.name}</strong>
                  <small>{cat.count || 12} mẫu sẵn có · Bấm xem →</small>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured & Best Seller Products */}
      <section className="sf-section">
        <div className="sf-section-head">
          <div>
            <span className="sf-eyebrow">Kệ hàng nổi bật</span>
            <h2 className="sf-section-title">Sản phẩm được mua nhiều nhất</h2>
            <p className="sf-section-sub">
              Số lượng tồn kho cập nhật trực tiếp. Bạn có thể thêm vào giỏ hoặc bấm <strong>⚡ Mua ngay</strong> ngay trên từng thẻ.
            </p>
          </div>

          <div className="sf-tabs" role="tablist" aria-label="Phân loại sản phẩm nổi bật">
            {[
              { id: 'bestseller', label: '🔥 Bán chạy nhất' },
              { id: 'newest', label: '🆕 Mới lên kệ' },
              { id: 'rating', label: '⭐ Đánh giá cao' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`sf-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {homeLoading && displayedProducts.length === 0 ? (
          <div className="sf-card" style={{ textAlign: 'center', padding: '44px 20px' }}>
            Đang tải kệ hàng sản phẩm...
          </div>
        ) : (
          <div className="sf-products-grid">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id || product.sku} product={product} />
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <Link to="/store/products" className="sf-btn sf-btn-outline">
            <span>Xem toàn bộ sản phẩm & Bộ lọc nhanh</span>
            <SfIcon name="arrow-right" size={16} />
          </Link>
        </div>
      </section>

      {/* Active Coupons & Deals */}
      {showCoupons && homeData.activeCoupons?.length > 0 && (
        <section className="sf-section">
          <div className="sf-section-head">
            <div>
              <span className="sf-eyebrow">Tiết kiệm ngay hôm nay</span>
              <h2 className="sf-section-title">Vé Giảm Giá (Voucher) đang tặng sẵn</h2>
              <p className="sf-section-sub">
                Bấm <strong>Lưu mã giảm giá</strong> — khi sang bước Thanh toán hệ thống sẽ hiện sẵn để bạn áp dụng 1 chạm.
              </p>
            </div>
            <Link to="/store/deals" className="sf-btn sf-btn-outline sf-btn-sm">
              <span>Xem kho khuyến mãi</span>
              <SfIcon name="arrow-right" size={15} />
            </Link>
          </div>

          <div className="sf-coupons-grid">
            {homeData.activeCoupons.map((coupon) => {
              const isCopied = savedCoupon === coupon.code;
              const remaining = Math.max(0, Number(coupon.usageLimit || 0) - Number(coupon.usageCount || 0));
              return (
                <div key={coupon.id || coupon.code} className="sf-coupon-card">
                  <div>
                    <div className="sf-coupon-top">
                      <span className="sf-coupon-code">🎟 {coupon.code}</span>
                      <span className="sf-pill sf-pill-amber">
                        {coupon.eligibility || 'Dành cho mọi khách'}
                      </span>
                    </div>
                    <div className="sf-coupon-value">{describeCouponValue(coupon)}</div>
                    <p className="sf-coupon-cond">
                      Điều kiện: Đơn hàng từ <strong>{formatMoney(coupon.minSpend || 0)}</strong> trở lên
                    </p>
                  </div>

                  <div className="sf-coupon-bottom">
                    <span>
                      {remaining > 0 ? `Còn ${remaining} vé` : 'Số lượng có hạn'} · Hạn: {coupon.endDate || 'Cuối năm'}
                    </span>
                    <button
                      type="button"
                      className={`sf-btn sf-btn-sm ${isCopied ? 'sf-btn-primary' : 'sf-btn-amber'}`}
                      onClick={() => copyCouponCode(coupon.code)}
                    >
                      <SfIcon name={isCopied ? 'check' : 'copy'} size={14} />
                      <span>{isCopied ? 'Đã lưu mã' : 'Sao chép mã'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Real Customer Reviews */}
      {showReviews && homeData.reviews?.length > 0 && (
        <section className="sf-section">
          <div className="sf-section-head">
            <div>
              <span className="sf-eyebrow">Khách mua nói gì?</span>
              <h2 className="sf-section-title">Nhận xét thực tế từ người đã mua hàng</h2>
            </div>
          </div>

          <div className="sf-reviews-grid">
            {homeData.reviews.slice(0, 6).map((rev) => (
              <article key={rev.id || `${rev.customerName}-${rev.title}`} className="sf-review-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <StarRating rating={rev.rating} size={15} />
                  {rev.verified !== false && (
                    <span className="sf-pill sf-pill-success">✓ Đã mua thật</span>
                  )}
                </div>

                <strong style={{ fontSize: '15.5px', fontWeight: 900 }}>{rev.title}</strong>
                <p style={{ fontSize: '14px', color: 'var(--sf-text-muted)', flex: 1 }}>
                  “{rev.comment}”
                </p>

                <div style={{ fontSize: '12.5px', color: 'var(--sf-text-muted)', paddingTop: '8px', borderTop: '1.5px dashed var(--sf-border-subtle)' }}>
                  <strong style={{ color: 'var(--sf-text)' }}>{rev.customerName}</strong> · Đã mua:{' '}
                  <span>{rev.productName}</span>
                </div>

                {rev.response && (
                  <div className="sf-review-reply">
                    <strong>Shop phản hồi:</strong>
                    <div style={{ marginTop: '3px', color: 'var(--sf-text-muted)' }}>{rev.response}</div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
