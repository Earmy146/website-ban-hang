import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SfIcon, StarRating } from './StoreIcons';
import { useStore } from './StoreContext';
import { formatMoney, FALLBACK_PRODUCT_IMAGE } from './storeApi';
import { getVariantOptionsForCategory } from './ProductCard';

export default function QuickViewModal() {
  const navigate = useNavigate();
  const {
    quickViewProduct: product,
    setQuickViewProduct,
    addToCart,
    isWishlisted,
    toggleWishlist,
  } = useStore();

  const variantMeta = getVariantOptionsForCategory(product?.category);
  const [selectedOpt, setSelectedOpt] = useState(variantMeta.options[0]);
  const [selectedColor, setSelectedColor] = useState(variantMeta.colors[0]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (product) {
      const meta = getVariantOptionsForCategory(product.category);
      setSelectedOpt(meta.options[0]);
      setSelectedColor(meta.colors[0]);
      setQty(1);
    }
  }, [product]);

  if (!product) return null;

  const inventory = Number(product.inventory ?? 0);
  const isOutOfStock = inventory <= 0 || product.status === 'Out of stock';
  const wished = isWishlisted(product);
  const variantLabel = `${selectedOpt} / ${selectedColor}`;

  const handleAdd = () => {
    const ok = addToCart(product, qty, variantLabel, true);
    if (ok) {
      setQuickViewProduct(null);
    }
  };

  const handleBuyNow = () => {
    const ok = addToCart(product, qty, variantLabel, false);
    if (ok) {
      setQuickViewProduct(null);
      navigate('/store/checkout');
    }
  };

  return (
    <div
      className="sf-backdrop sf-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Xem nhanh ${product.name}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) setQuickViewProduct(null);
      }}
    >
      <div className="sf-modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <span className="sf-eyebrow" style={{ marginBottom: 0 }}>
            {product.brand || 'Veylix Studio'} · SKU {product.sku}
          </span>
          <button
            type="button"
            className="sf-icon-btn"
            aria-label="Đóng xem nhanh"
            onClick={() => setQuickViewProduct(null)}
          >
            <SfIcon name="close" size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '26px' }}>
          <div
            style={{
              background: 'var(--sf-bg-soft)',
              border: 'var(--sf-card-border)',
              padding: '28px',
              display: 'grid',
              placeItems: 'center',
              minHeight: '280px',
            }}
          >
            <img
              src={product.image || FALLBACK_PRODUCT_IMAGE}
              alt={product.name}
              style={{ maxHeight: '240px', objectFit: 'contain' }}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
              }}
            />
          </div>

          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.25 }}>{product.name}</h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '10px 0 14px', flexWrap: 'wrap' }}>
              <StarRating rating={product.rating || 4.8} size={15} />
              <span style={{ fontSize: '13px', color: 'var(--sf-text-muted)' }}>
                {Number(product.rating || 4.8).toFixed(1)} · Đã bán {product.sales || 0}
              </span>
              {isOutOfStock ? (
                <span className="sf-pill sf-pill-danger">Hết hàng</span>
              ) : (
                <span className="sf-pill sf-pill-success">Còn {inventory} sản phẩm</span>
              )}
            </div>

            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--sf-forest)', marginBottom: '12px' }}>
              {formatMoney(product.price)}
            </div>

            <p style={{ fontSize: '14px', color: 'var(--sf-text-muted)', marginBottom: '16px' }}>
              {product.desc || 'Chế tác tỉ mỉ từ chất liệu chọn lọc, bảo hành chính hãng và đổi trả miễn phí 30 ngày.'}
            </p>

            <div className="sf-variant-block">
              <span className="sf-variant-label">{variantMeta.optionLabel}: {selectedOpt}</span>
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
              <span className="sf-variant-label">Màu sắc: {selectedColor}</span>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
              <div className="sf-qty-control">
                <button
                  type="button"
                  disabled={qty <= 1 || isOutOfStock}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Giảm số lượng"
                >
                  −
                </button>
                <span>{qty}</span>
                <button
                  type="button"
                  disabled={isOutOfStock || qty >= inventory}
                  onClick={() => setQty((q) => Math.min(Math.max(1, inventory), q + 1))}
                  aria-label="Tăng số lượng"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="sf-btn sf-btn-primary"
                disabled={isOutOfStock}
                onClick={handleAdd}
                style={{ flex: 1 }}
              >
                <SfIcon name="bag" size={16} />
                <span>Thêm vào giỏ</span>
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
                className="sf-icon-btn"
                onClick={() => toggleWishlist(product)}
                title="Yêu thích"
                style={wished ? { color: '#d93829', borderColor: '#f3c1bc', background: '#fff5f4' } : undefined}
              >
                <SfIcon name="heart" size={18} filled={wished} />
              </button>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--sf-border)' }}>
              <Link
                to={`/store/products/${encodeURIComponent(product.id || product.sku)}`}
                onClick={() => setQuickViewProduct(null)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '13.5px', color: 'var(--sf-amber)' }}
              >
                <span>Xem chi tiết sản phẩm & Đánh giá thực tế</span>
                <SfIcon name="arrow-right" size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
