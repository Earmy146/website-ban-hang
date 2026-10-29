import React from 'react';

export default function StockToolbar({
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  searchQuery,
  onSearchChange
}) {
  return (
    <section className="glass-card c-toolbar inventory-toolbar">
      <div className="c-toolbar-filters">
        <label className="c-field">
          <span className="sr-only">Lọc theo trạng thái kho</span>
          <select 
            value={statusFilter} 
            onChange={e => onStatusChange(e.target.value)}
            aria-label="Lọc theo trạng thái kho"
          >
            <option value="all">Tất cả tình trạng kho</option>
            <option value="Healthy">Kho ổn định</option>
            <option value="Low">Cảnh báo sắp hết</option>
            <option value="Out">Hết hàng</option>
          </select>
        </label>

        <label className="c-field">
          <span className="sr-only">Lọc theo danh mục</span>
          <select 
            value={categoryFilter} 
            onChange={e => onCategoryChange(e.target.value)}
            aria-label="Lọc theo danh mục sản phẩm"
          >
            <option value="all">Tất cả danh mục</option>
            <option value="Thời trang & May mặc">Thời trang & May mặc</option>
            <option value="Balo & Túi xách">Balo & Túi xách</option>
            <option value="Đồ gia dụng & Nội thất">Đồ gia dụng & Nội thất</option>
            <option value="Thiết bị công nghệ">Thiết bị công nghệ</option>
          </select>
        </label>
      </div>

      <div className="c-toolbar-search">
        <label className="c-search inventory-search">
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
            </svg>
          </span>
          <input 
            type="search" 
            placeholder="Tìm theo tên sản phẩm hoặc mã SKU..." 
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            aria-label="Tìm kiếm kho hàng"
          />
        </label>
      </div>
    </section>
  );
}

