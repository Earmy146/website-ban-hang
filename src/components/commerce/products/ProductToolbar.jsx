import React from 'react';

const DEFAULT_CATEGORIES = [
  'Thời trang & May mặc',
  'Balo & Túi xách',
  'Đồ gia dụng & Nội thất',
  'Thiết bị công nghệ',
  'Phụ kiện thời trang',
  'Phụ kiện đời sống',
  'Văn phòng phẩm',
];

export default function ProductToolbar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  showDeleted,
  onToggleDeleted,
  categories = []
}) {
  const categoryOptions = Array.from(
    new Set([
      ...DEFAULT_CATEGORIES,
      ...(Array.isArray(categories) ? categories.filter(Boolean) : []),
      ...(selectedCategory ? [selectedCategory] : []),
    ])
  );

  return (
    <section className="glass-card product-filter-card">
      <div className="c-toolbar product-toolbar">
        {/* Lọc theo Danh mục */}
        <label className="c-filter">
          <span className="sr-only">Lọc theo danh mục</span>
          <select 
            value={selectedCategory} 
            onChange={e => onCategoryChange(e.target.value)}
            aria-label="Lọc theo danh mục"
          >
            <option value="">Tất cả danh mục</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>

        {/* Lọc theo Trạng thái */}
        <label className="c-filter">
          <span className="sr-only">Lọc theo trạng thái</span>
          <select 
            value={selectedStatus} 
            onChange={e => onStatusChange(e.target.value)}
            aria-label="Lọc theo trạng thái"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Đang bán</option>
            <option value="Low stock">Sắp hết</option>
            <option value="Out of stock">Hết hàng</option>
            <option value="Draft">Bản nháp</option>
          </select>
        </label>

        {/* Toggle Xem đã xóa */}
        <label className="c-archive-toggle product-archive-toggle">
          <input 
            type="checkbox" 
            checked={showDeleted} 
            onChange={e => onToggleDeleted(e.target.checked)} 
          /> 
          Sản phẩm đã xóa
        </label>

        {/* Ô Tìm kiếm Realtime */}
        <label className="c-search product-search">
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
            </svg>
          </span>
          <input 
            type="search" 
            placeholder="Tìm kiếm theo tên sản phẩm, thương hiệu hoặc mã SKU..." 
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            aria-label="Tìm kiếm sản phẩm"
          />
        </label>
      </div>
    </section>
  );
}
