import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SfIcon } from '../../components/storefront/StoreIcons';
import { useStore } from '../../components/storefront/StoreContext';
import ProductCard from '../../components/storefront/ProductCard';
import { storeApi } from '../../components/storefront/storeApi';

const DEFAULT_BRANDS = [
  'Veylix Studio',
  'Northline',
  'Forma Living',
  'Kanso Design',
  'Nomad Gear',
];

export default function StoreProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { homeData } = useStore();

  const resolveCategoryParam = useCallback(
    (rawCat) => {
      if (!rawCat) return '';
      const matched = (homeData.categories || []).find(
        (c) =>
          c.name === rawCat ||
          c.slug === rawCat ||
          String(c.name || '').toLowerCase() === String(rawCat).toLowerCase()
      );
      return matched ? matched.name : rawCat;
    },
    [homeData.categories]
  );

  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [category, setCategory] = useState(() => resolveCategoryParam(searchParams.get('category') || ''));
  const [brand, setBrand] = useState(() => searchParams.get('brand') || '');
  const [minPrice, setMinPrice] = useState(() => searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get('maxPrice') || '');
  const [inStockOnly, setInStockOnly] = useState(() => searchParams.get('inStockOnly') === 'true');
  const [minRating48, setMinRating48] = useState(false);
  const [quickChip, setQuickChip] = useState('all');
  const [sort, setSort] = useState(() => searchParams.get('sort') || 'popular');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qSearch = searchParams.get('search') || '';
    const qCat = resolveCategoryParam(searchParams.get('category') || '');
    setSearch(qSearch);
    setCategory(qCat);
  }, [searchParams, resolveCategoryParam]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const list = await storeApi.getProducts({
          search: search.trim(),
          category,
          brand,
          minPrice,
          maxPrice,
          inStockOnly: inStockOnly ? 'true' : '',
          sort,
        });
        if (active) {
          setProducts(list);
        }
      } catch {
        if (active) {
          setProducts([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 120);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, category, brand, minPrice, maxPrice, inStockOnly, sort]);

  const finalProducts = useMemo(() => {
    if (!minRating48) return products;
    return products.filter((p) => Number(p.rating || 0) >= 4.8);
  }, [products, minRating48]);

  const categoriesList = useMemo(() => {
    if (homeData.categories?.length) return homeData.categories;
    const names = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return names.map((name) => ({ name }));
  }, [homeData.categories, products]);

  const brandsList = useMemo(() => {
    const dynamic = products.map((p) => p.brand).filter(Boolean);
    return Array.from(new Set([...DEFAULT_BRANDS, ...dynamic]));
  }, [products]);

  const hasActiveFilters = Boolean(
    search.trim() ||
      category ||
      brand ||
      minPrice ||
      maxPrice ||
      inStockOnly ||
      minRating48 ||
      sort !== 'popular'
  );

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setMinRating48(false);
    setQuickChip('all');
    setSort('popular');
    setSearchParams({});
  };

  const applyQuickChip = (chipId) => {
    setQuickChip(chipId);
    if (chipId === 'all') {
      setInStockOnly(false);
      setMinRating48(false);
      setMinPrice('');
      setMaxPrice('');
      setSort('popular');
    } else if (chipId === 'instock') {
      setInStockOnly(true);
      setMinRating48(false);
      setMinPrice('');
      setMaxPrice('');
    } else if (chipId === 'toprated') {
      setMinRating48(true);
      setInStockOnly(false);
      setMinPrice('');
      setMaxPrice('');
      setSort('rating');
    } else if (chipId === 'budget30') {
      setMinPrice('');
      setMaxPrice('30');
      setMinRating48(false);
      setSort('price_asc');
    } else if (chipId === 'bestseller') {
      setInStockOnly(true);
      setMinRating48(false);
      setMinPrice('');
      setMaxPrice('');
      setSort('popular');
    }
  };

  const handleSelectCategory = (nextCat) => {
    const val = category === nextCat ? '' : nextCat;
    setCategory(val);
    const nextParams = new URLSearchParams(searchParams);
    if (val) nextParams.set('category', val);
    else nextParams.delete('category');
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="sf-container">
      <div style={{ marginTop: '28px' }}>
        <span className="sf-eyebrow">Kệ hàng trực tuyến</span>
        <h1 className="sf-section-title">
          {category ? `Nhóm hàng: ${category}` : 'Tất cả sản phẩm Veylix Studio'}
        </h1>
        <p className="sf-section-sub">
          Bấm các nút lọc nhanh ngay bên dưới để tìm món còn sẵn hàng, giá tiết kiệm hoặc được đánh giá cao nhất.
        </p>
      </div>

      {/* One-Click Quick Filter Chips Bar */}
      <section className="sf-quick-filters" aria-label="Bộ lọc nhanh 1 chạm">
        <strong style={{ fontSize: '13.5px', fontWeight: 900, marginRight: '4px' }}>
          ⚡ Lọc nhanh 1 chạm:
        </strong>
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'instock', label: '📦 Còn hàng giao ngay' },
          { id: 'toprated', label: '⭐ Đánh giá từ 4.8★' },
          { id: 'budget30', label: '💲 Giá tiết kiệm ≤ $30' },
          { id: 'bestseller', label: '🔥 Bán chạy nhất' },
        ].map((chip) => (
          <button
            key={chip.id}
            type="button"
            data-quick-filter={chip.id}
            className={`sf-chip ${quickChip === chip.id ? 'is-selected' : ''}`}
            onClick={() => applyQuickChip(chip.id)}
          >
            {chip.label}
          </button>
        ))}

        {hasActiveFilters && (
          <button
            type="button"
            className="sf-btn sf-btn-danger sf-btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={handleResetFilters}
          >
            <SfIcon name="refresh" size={14} />
            <span>Xóa bộ lọc</span>
          </button>
        )}
      </section>

      <div className="sf-catalog-layout">
        {/* Sidebar Filters */}
        <aside className="sf-filter-panel" aria-label="Bộ lọc sản phẩm chi tiết">
          <div className="sf-filter-group">
            <h3>Tìm theo tên / mã món</h3>
            <input
              type="search"
              className="sf-input"
              placeholder="Gõ tên món (VD: balo, áo)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="sf-filter-group">
            <h3>Nhóm sản phẩm</h3>
            <div className="sf-filter-list">
              <button
                type="button"
                className={`sf-filter-option ${!category ? 'is-active' : ''}`}
                onClick={() => handleSelectCategory('')}
              >
                <span>Tất cả danh mục</span>
              </button>
              {categoriesList.map((cat) => (
                <button
                  key={cat.id || cat.name}
                  type="button"
                  className={`sf-filter-option ${category === cat.name ? 'is-active' : ''}`}
                  onClick={() => handleSelectCategory(cat.name)}
                >
                  <span>{cat.icon ? `${cat.icon} ` : ''}{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sf-filter-group">
            <h3>Thương hiệu</h3>
            <div className="sf-filter-list">
              <button
                type="button"
                className={`sf-filter-option ${!brand ? 'is-active' : ''}`}
                onClick={() => setBrand('')}
              >
                <span>Mọi thương hiệu</span>
              </button>
              {brandsList.map((b) => (
                <button
                  key={b}
                  type="button"
                  className={`sf-filter-option ${brand === b ? 'is-active' : ''}`}
                  onClick={() => setBrand((prev) => (prev === b ? '' : b))}
                >
                  <span>{b}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sf-filter-group">
            <h3>Khoảng giá ($)</h3>
            <div className="sf-price-inputs">
              <input
                type="number"
                min="0"
                className="sf-input"
                placeholder="Từ $0"
                value={minPrice}
                onChange={(e) => {
                  setQuickChip('custom');
                  setMinPrice(e.target.value);
                }}
              />
              <input
                type="number"
                min="0"
                className="sf-input"
                placeholder="Đến $200"
                value={maxPrice}
                onChange={(e) => {
                  setQuickChip('custom');
                  setMaxPrice(e.target.value);
                }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {[
                { label: 'Dưới $30', min: '', max: '30' },
                { label: '$30 – $60', min: '30', max: '60' },
                { label: 'Trên $60', min: '60', max: '' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="sf-chip"
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                  onClick={() => {
                    setQuickChip('custom');
                    setMinPrice(preset.min);
                    setMaxPrice(preset.max);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sf-filter-group">
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: '13.5px',
              }}
            >
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setQuickChip('custom');
                  setInStockOnly(e.target.checked);
                }}
                style={{ width: '18px', height: '18px', accentColor: 'var(--sf-primary)' }}
              />
              <span>Chỉ hiện hàng còn trong kho</span>
            </label>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="sf-btn sf-btn-outline sf-btn-sm sf-btn-block"
              onClick={handleResetFilters}
            >
              <SfIcon name="refresh" size={14} />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </aside>

        {/* Main Products Grid */}
        <div>
          <div className="sf-catalog-toolbar">
            <div style={{ fontSize: '14.5px', color: 'var(--sf-text-muted)', fontWeight: 700 }}>
              Tìm thấy <strong style={{ color: 'var(--sf-text)' }}>{finalProducts.length}</strong> sản phẩm
              {search ? ` khớp từ khóa "${search}"` : ''}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label htmlFor="sf-sort-select" style={{ fontSize: '13.5px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                Sắp xếp theo:
              </label>
              <select
                id="sf-sort-select"
                className="sf-select"
                style={{ width: 'auto', minWidth: '195px', padding: '8px 12px' }}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="popular">Phổ biến / Bán chạy nhất</option>
                <option value="newest">Mới lên kệ</option>
                <option value="price_asc">Giá thấp đến cao</option>
                <option value="price_desc">Giá cao đến thấp</option>
                <option value="rating">Đánh giá sao cao nhất</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="sf-card" style={{ textAlign: 'center', padding: '56px 20px' }}>
              Đang tìm kiếm sản phẩm cho bạn...
            </div>
          ) : finalProducts.length === 0 ? (
            <div className="sf-card" style={{ textAlign: 'center', padding: '56px 20px' }}>
              <h3 style={{ fontSize: '19px', fontWeight: 900, marginBottom: '8px' }}>
                Chưa có sản phẩm nào khớp điều kiện lọc này
              </h3>
              <p style={{ color: 'var(--sf-text-muted)', marginBottom: '18px' }}>
                Bạn hãy bấm nút dưới đây để xem lại toàn bộ kệ hàng nhé!
              </p>
              <button type="button" className="sf-btn sf-btn-primary" onClick={handleResetFilters}>
                Xem lại tất cả sản phẩm
              </button>
            </div>
          ) : (
            <div className="sf-products-grid">
              {finalProducts.map((product) => (
                <ProductCard key={product.id || product.sku} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
