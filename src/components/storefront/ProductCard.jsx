import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SfIcon } from './StoreIcons';
import { useStore } from './StoreContext';
import { formatMoney, FALLBACK_PRODUCT_IMAGE } from './storeApi';

export function getVariantOptionsForCategory(category = '') {
  const cat = String(category).toLowerCase();
  if (cat.includes('thời trang') || cat.includes('may mặc')) {
    return {
      optionLabel: 'Kích cỡ',
      options: ['S', 'M', 'L', 'XL'],
      colors: ['Kem tự nhiên', 'Đen than ấm', 'Xanh rừng thông', 'Nâu cát'],
    };
  }
  if (cat.includes('balo') || cat.includes('túi') || cat.includes('phụ kiện')) {
    return {
      optionLabel: 'Phiên bản',
      options: ['Tiêu chuẩn', 'Cỡ lớn (Plus)'],
      colors: ['Đen nhám', 'Kem Canvas', 'Nâu da sáp', 'Xanh rêu'],
    };
  }
  if (cat.includes('công nghệ') || cat.includes('thiết bị')) {
    return {
      optionLabel: 'Kết nối',
      options: ['Bluetooth 5.2', 'Dual-Mode USB-C'],
      colors: ['Xám không gian', 'Trắng ngà', 'Đen nhám'],
    };
  }
  return {
    optionLabel: 'Phiên bản',
    options: ['Tiêu chuẩn', 'Hộp quà Studio'],
    colors: ['Men kem ấm', 'Nâu gỗ sồi', 'Xám đá mộc'],
  };
}

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart, isWishlisted, toggleWishlist, setQuickViewProduct } = useStore();
  if (!product) return null;

  const productUrl = `/store/products/${encodeURIComponent(product.id || product.sku)}`;
  const inventory = Number(product.inventory ?? 0);
  const isOutOfStock = inventory <= 0 || product.status === 'Out of stock';
  const isLowStock = !isOutOfStock && (inventory <= 15 || product.status === 'Low stock');
  const isBestSeller = Number(product.sales || 0) >= 300;
  const wished = isWishlisted(product);

  const defaultVariant = () => {
    const { options, colors } = getVariantOptionsForCategory(product.category);
    return `${options[0]} / ${colors[0]}`;
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    addToCart(product, 1, defaultVariant(), true);
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    const ok = addToCart(product, 1, defaultVariant(), false);
    if (ok) {
      navigate('/store/checkout');
    }
  };

  return (
    <article className="sf-product-card">
      <div className="sf-product-media">
        <div className="sf-product-badges">
          {isOutOfStock ? (
            <span className="sf-pill sf-pill-danger">✕ Tạm hết</span>
          ) : isLowStock ? (
            <span className="sf-pill sf-pill-amber">⚡ Sắp hết - còn {inventory} món</span>
          ) : (
            <span className="sf-pill sf-pill-success">✓ Còn sẵn {inventory} món</span>
          )}
          {!isOutOfStock && isBestSeller && (
            <span className="sf-pill sf-pill-forest">🔥 Bán chạy</span>
          )}
        </div>

        <div className="sf-card-top-tools">
          <button
            type="button"
            className={`sf-wishlist-btn ${wished ? 'is-active' : ''}`}
            aria-label={wished ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
            title={wished ? 'Bỏ khỏi danh sách Yêu thích' : 'Lưu vào danh sách Yêu thích'}
            onClick={() => toggleWishlist(product)}
          >
            <SfIcon name="heart" size={16} filled={wished} />
          </button>

          <button
            type="button"
            className="sf-wishlist-btn"
            aria-label={`Xem nhanh ${product.name}`}
            title="Xem nhanh chi tiết & chọn kích cỡ, màu sắc"
            onClick={() => setQuickViewProduct(product)}
          >
            <SfIcon name="eye" size={16} />
          </button>
        </div>

        <Link to={productUrl} style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%' }}>
          <img
            src={product.image || FALLBACK_PRODUCT_IMAGE}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
            }}
          />
        </Link>
      </div>

      <div className="sf-product-body">
        <div className="sf-product-meta">
          <span>{product.brand || product.category || 'Veylix Studio'}</span>
          <span className="sf-rating-inline" title="Điểm đánh giá từ người mua thực tế">
            {Number(product.rating || 4.8).toFixed(1)} ★ ({product.sales || 0} đã bán)
          </span>
        </div>

        <Link to={productUrl} className="sf-product-title">
          {product.name}
        </Link>

        <p className="sf-product-desc">
          {product.desc || 'Chất liệu chọn lọc cao cấp, hoàn thiện tỉ mỉ và đổi trả miễn phí 30 ngày.'}
        </p>

        <div className="sf-product-price-bar">
          <strong className="sf-price">{formatMoney(product.price)}</strong>
          <Link
            to={productUrl}
            style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--sf-primary)', textDecoration: 'underline' }}
          >
            Chọn phân loại →
          </Link>
        </div>

        <div className="sf-product-actions-dual">
          <button
            type="button"
            className="sf-btn sf-btn-outline sf-btn-sm"
            disabled={isOutOfStock}
            onClick={handleQuickAdd}
          >
            <span>{isOutOfStock ? '✕ Hết hàng' : '🛒 Thêm giỏ'}</span>
          </button>

          <button
            type="button"
            className="sf-btn sf-btn-primary sf-btn-sm"
            disabled={isOutOfStock}
            onClick={handleBuyNow}
          >
            <span>⚡ Mua ngay</span>
          </button>
        </div>
      </div>
    </article>
  );
}
