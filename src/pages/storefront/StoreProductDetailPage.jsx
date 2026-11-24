import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { SfIcon, StarRating } from '../../components/storefront/StoreIcons';
import { useStore } from '../../components/storefront/StoreContext';
import ProductCard, { getVariantOptionsForCategory } from '../../components/storefront/ProductCard';
import { storeApi, formatMoney, FALLBACK_PRODUCT_IMAGE } from '../../components/storefront/storeApi';

export default function StoreProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    customer,
    addToCart,
    isWishlisted,
    toggleWishlist,
    freeShippingThreshold,
    showToast,
  } = useStore();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedOpt, setSelectedOpt] = useState('Tiêu chuẩn');
  const [selectedColor, setSelectedColor] = useState('Kem tự nhiên');
  const [qty, setQty] = useState(1);

  // Review Form state
  const [revName, setRevName] = useState(customer?.name || '');
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState('');
  const [revComment, setRevComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (customer?.name && !revName) {
      setRevName(customer.name);
    }
  }, [customer, revName]);

  const loadProduct = useCallback(async (silent = false) => {
    if (!id) return;
    try {
      if (!silent) {
        setLoading(true);
        setError('');
      }
      const data = await storeApi.getProductDetail(id);
      setDetail(data);
      if (!silent && data?.product) {
        const meta = getVariantOptionsForCategory(data.product.category);
        setSelectedOpt(meta.options[0]);
        setSelectedColor(meta.colors[0]);
        setQty(1);
      }
    } catch (err) {
      if (!silent) {
        setError(err.message || 'Không tìm thấy sản phẩm này');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadProduct(false);
  }, [loadProduct]);

  if (loading) {
    return (
      <div className="sf-container" style={{ paddingTop: '48px' }}>
        <div className="sf-card" style={{ textAlign: 'center', padding: '64px 20px' }}>
          Đang tải chi tiết sản phẩm...
        </div>
      </div>
    );
  }

  if (error || !detail?.product) {
    return (
      <div className="sf-container" style={{ paddingTop: '48px' }}>
        <div className="sf-card" style={{ textAlign: 'center', padding: '64px 20px' }}>
          <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>{error || 'Sản phẩm không tồn tại'}</h2>
          <Link to="/store/products" className="sf-btn sf-btn-primary">
            Quay lại cửa hàng
          </Link>
        </div>
      </div>
    );
  }

  const { product, stock, reviews = [], relatedProducts = [] } = detail;
  const availableStock = Number(stock?.available ?? product.inventory ?? 0);
  const productWithLiveStock = { ...product, inventory: availableStock };
  const isOutOfStock = availableStock <= 0 || product.status === 'Out of stock';
  const isLowStock = !isOutOfStock && availableStock <= 15;
  const variantMeta = getVariantOptionsForCategory(product.category);
  const variantText = `${selectedOpt} / ${selectedColor}`;
  const wished = isWishlisted(product);

  const handleAddToCart = () => {
    addToCart(productWithLiveStock, qty, variantText, true);
  };

  const handleBuyNow = () => {
    const ok = addToCart(productWithLiveStock, qty, variantText, false);
    if (ok) {
      navigate('/store/checkout');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!revName.trim() || !revTitle.trim() || !revComment.trim()) {
      showToast('Vui lòng điền đầy đủ họ tên, tiêu đề và nội dung đánh giá', 'error');
      return;
    }
    try {
      setSubmittingReview(true);
      const created = await storeApi.submitReview({
        productId: product.id || product._id,
        productName: product.name,
        customerName: revName.trim(),
        customerEmail: customer?.email || undefined,
        rating: Number(revRating),
        title: revTitle.trim(),
        comment: revComment.trim(),
      });

      const newRevObj = created?.review || created;
      if (newRevObj) {
        setDetail((prev) => ({
          ...prev,
          reviews: [newRevObj, ...(prev?.reviews || [])],
        }));
      }
      setRevTitle('');
      setRevComment('');
      setRevRating(5);
      showToast('Cảm ơn bạn! Đánh giá đã được đăng công khai trên sản phẩm.');
      loadProduct(true);
    } catch (err) {
      showToast(err.message || 'Không thể gửi đánh giá lúc này', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="sf-container">
      {/* Breadcrumb */}
      <nav className="sf-breadcrumb" aria-label="Đường dẫn trang">
        <Link to="/store">Trang chủ</Link>
        <span>/</span>
        <Link to="/store/products">Sản phẩm</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/store/products?category=${encodeURIComponent(product.category)}`}>
              {product.category}
            </Link>
          </>
        )}
        <span>/</span>
        <strong style={{ color: 'var(--sf-text)' }}>{product.name}</strong>
      </nav>

      {/* Product Main Info */}
      <section className="sf-detail-grid">
        <div className="sf-detail-gallery">
          <div className="sf-product-badges">
            {isOutOfStock ? (
              <span className="sf-pill sf-pill-danger">Hết hàng</span>
            ) : isLowStock ? (
              <span className="sf-pill sf-pill-amber">Sắp hết · còn {availableStock}</span>
            ) : (
              <span className="sf-pill sf-pill-success">Sẵn hàng trong kho</span>
            )}
          </div>
          <img
            src={product.image || FALLBACK_PRODUCT_IMAGE}
            alt={product.name}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
            }}
          />
        </div>

        <div className="sf-detail-info">
          <span className="sf-eyebrow">
            {product.brand || 'Veylix Studio'} · Mã SKU: {product.sku}
          </span>
          <h1>{product.name}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <StarRating rating={product.rating || 4.8} size={16} />
            <span style={{ fontWeight: 800, fontSize: '14px' }}>
              {Number(product.rating || 4.8).toFixed(1)} / 5
            </span>
            <span style={{ color: 'var(--sf-text-muted)', fontSize: '13.5px' }}>
              ({reviews.length} đánh giá thực tế · Đã bán {product.sales || 0})
            </span>
          </div>

          <div className="sf-detail-price-row">
            <strong className="sf-detail-price">{formatMoney(product.price)}</strong>
            {isOutOfStock ? (
              <span className="sf-pill sf-pill-danger">Hết hàng tạm thời</span>
            ) : (
              <span className="sf-pill sf-pill-success">
                Còn {availableStock} sản phẩm sẵn sàng giao
              </span>
            )}
          </div>

          <p style={{ fontSize: '15px', color: 'var(--sf-text-muted)', lineHeight: 1.75 }}>
            {product.desc ||
              'Thiết kế chuẩn mực từ Veylix Studio với độ hoàn thiện tinh xảo, vật liệu thân thiện và độ bền vượt thời gian.'}
          </p>

          {/* Variant Pickers */}
          <div className="sf-variant-block">
            <span className="sf-variant-label">
              {variantMeta.optionLabel}: <strong style={{ color: 'var(--sf-amber)' }}>{selectedOpt}</strong>
            </span>
            <div className="sf-variant-chips">
              {variantMeta.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`sf-chip ${selectedOpt === opt ? 'is-selected' : ''}`}
                  onClick={() => setSelectedOpt(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="sf-variant-block">
            <span className="sf-variant-label">
              Màu sắc: <strong style={{ color: 'var(--sf-amber)' }}>{selectedColor}</strong>
            </span>
            <div className="sf-variant-chips">
              {variantMeta.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`sf-chip ${selectedColor === c ? 'is-selected' : ''}`}
                  onClick={() => setSelectedColor(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Actions */}
          <div className="sf-detail-actions">
            <div className="sf-qty-control">
              <button
                type="button"
                disabled={isOutOfStock || qty <= 1}
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Giảm số lượng"
              >
                −
              </button>
              <span>{qty}</span>
              <button
                type="button"
                disabled={isOutOfStock || qty >= availableStock}
                onClick={() => setQty((q) => Math.min(Math.max(1, availableStock), q + 1))}
                aria-label="Tăng số lượng"
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="sf-btn sf-btn-primary"
              style={{ flex: 1, minWidth: '180px' }}
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              <SfIcon name="bag" size={17} />
              <span>{isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng'}</span>
            </button>

            <button
              type="button"
              className="sf-btn sf-btn-amber"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
            >
              <span>Mua ngay</span>
            </button>

            <button
              type="button"
              className="sf-btn sf-btn-outline"
              onClick={() => toggleWishlist(productWithLiveStock)}
              style={wished ? { color: '#d93829', borderColor: '#f3c1bc', background: '#fff5f4' } : undefined}
            >
              <SfIcon name="heart" size={17} filled={wished} />
              <span>{wished ? 'Đã yêu thích' : 'Yêu thích'}</span>
            </button>
          </div>

          {/* Fulfillment & Perks Box */}
          <div
            style={{
              marginTop: '24px',
              padding: '16px 18px',
              borderRadius: '16px',
              background: 'var(--sf-bg)',
              border: '1px solid var(--sf-border)',
              display: 'grid',
              gap: '8px',
              fontSize: '13.5px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SfIcon name="truck" size={16} />
              <span>
                Miễn phí vận chuyển tiêu chuẩn cho đơn hàng từ <strong>{formatMoney(freeShippingThreshold)}</strong>.
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SfIcon name="shield" size={16} />
              <span>Đổi trả miễn phí trong 30 ngày · Kiểm tra hàng thoải mái khi nhận.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews & Submit Review Section */}
      <section className="sf-section">
        <div className="sf-section-head">
          <div>
            <span className="sf-eyebrow">Nhận xét minh bạch</span>
            <h2 className="sf-section-title">Đánh giá & Nhận xét thực tế ({reviews.length})</h2>
          </div>
        </div>

        <div className="sf-checkout-grid">
          {/* Existing Reviews List */}
          <div style={{ display: 'grid', gap: '14px' }}>
            {reviews.length === 0 ? (
              <div className="sf-card">
                <p style={{ color: 'var(--sf-text-muted)' }}>
                  Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên chia sẻ cảm nhận của bạn!
                </p>
              </div>
            ) : (
              reviews.map((rev, idx) => (
                <article key={rev.id || idx} className="sf-review-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <StarRating rating={rev.rating} size={15} />
                      <strong style={{ fontSize: '15px' }}>{rev.title}</strong>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--sf-text-muted)' }}>
                      {rev.date || 'Vừa xong'}
                    </span>
                  </div>

                  <p style={{ fontSize: '14px', color: 'var(--sf-text-muted)' }}>{rev.comment}</p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
                    <strong>{rev.customerName}</strong>
                    <span className="sf-pill sf-pill-success">Đã xác thực</span>
                  </div>

                  {rev.response && (
                    <div className="sf-review-reply">
                      <strong>Phản hồi từ Cửa hàng:</strong>
                      <div style={{ marginTop: '4px', color: 'var(--sf-text-muted)' }}>{rev.response}</div>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>

          {/* Submit New Review Form */}
          <form className="sf-card" onSubmit={handleSubmitReview}>
            <h2>Gửi đánh giá của bạn</h2>
            <p style={{ fontSize: '13.5px', color: 'var(--sf-text-muted)', marginBottom: '16px' }}>
              Chia sẻ trải nghiệm thực tế của bạn về <strong>{product.name}</strong>.
            </p>

            <div style={{ display: 'grid', gap: '14px' }}>
              <div className="sf-field">
                <label>Mức độ hài lòng *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRevRating(star)}
                      aria-label={`Chọn ${star} sao`}
                      className={`sf-chip ${revRating >= star ? 'is-selected' : ''}`}
                      style={{ padding: '6px 10px' }}
                    >
                      <SfIcon name="star" size={15} filled={revRating >= star} />
                      <span>{star}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="sf-field">
                <label htmlFor="sf-rev-name">Tên hiển thị của bạn *</label>
                <input
                  id="sf-rev-name"
                  className="sf-input"
                  placeholder="Ví dụ: Minh Khôi"
                  value={revName}
                  onChange={(e) => setRevName(e.target.value)}
                  required
                />
              </div>

              <div className="sf-field">
                <label htmlFor="sf-rev-title">Tiêu đề nhận xét *</label>
                <input
                  id="sf-rev-title"
                  className="sf-input"
                  placeholder="Ví dụ: Chất lượng tuyệt vời, đáng tiền"
                  value={revTitle}
                  onChange={(e) => setRevTitle(e.target.value)}
                  required
                />
              </div>

              <div className="sf-field">
                <label htmlFor="sf-rev-comment">Nội dung đánh giá chi tiết *</label>
                <textarea
                  id="sf-rev-comment"
                  rows={4}
                  className="sf-textarea"
                  placeholder="Cảm nhận của bạn về chất liệu, thiết kế và đóng gói..."
                  value={revComment}
                  onChange={(e) => setRevComment(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="sf-btn sf-btn-primary sf-btn-block"
                disabled={submittingReview}
              >
                {submittingReview ? 'Đang gửi đánh giá...' : 'Đăng đánh giá sản phẩm'}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="sf-section">
          <div className="sf-section-head">
            <div>
              <span className="sf-eyebrow">Gợi ý đồng bộ</span>
              <h2 className="sf-section-title">Sản phẩm cùng danh mục</h2>
            </div>
            <Link
              to={`/store/products?category=${encodeURIComponent(product.category || '')}`}
              className="sf-btn sf-btn-outline sf-btn-sm"
            >
              <span>Xem thêm</span>
              <SfIcon name="arrow-right" size={15} />
            </Link>
          </div>

          <div className="sf-products-grid">
            {relatedProducts.slice(0, 4).map((rel) => (
              <ProductCard key={rel.id || rel.sku} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
