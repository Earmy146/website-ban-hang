import React from 'react';

export default function CouponToolbar({
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  searchQuery,
  onSearchChange
}) {
  return (
    <section className="glass-card c-toolbar">
      <div className="c-toolbar-filters">
        <label className="c-field">
          <span className="sr-only">Lọc theo loại giảm giá</span>
          <select 
            value={typeFilter} 
            onChange={e => onTypeChange(e.target.value)}
            aria-label="Lọc theo loại ưu đãi"
          >
            <option value="all">Tất cả loại ưu đãi</option>
            <option value="Phần trăm (%)">Phần trăm (%)</option>
            <option value="Số tiền cố định ($)">Số tiền cố định ($)</option>
            <option value="Miễn phí vận chuyển">Miễn phí vận chuyển</option>
          </select>
        </label>

        <label className="c-field">
          <span className="sr-only">Lọc theo trạng thái</span>
          <select 
            value={statusFilter} 
            onChange={e => onStatusChange(e.target.value)}
            aria-label="Lọc theo trạng thái"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Active">Đang hoạt động</option>
            <option value="Scheduled">Đã lên lịch</option>
            <option value="Expired">Đã hết hạn</option>
          </select>
        </label>
      </div>

      <div className="c-toolbar-search">
        <label className="c-search">
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
            </svg>
          </span>
          <input 
            type="search" 
            placeholder="Tìm theo mã ưu đãi, đối tượng..." 
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            aria-label="Tìm kiếm mã giảm giá"
          />
        </label>
      </div>
    </section>
  );
}
