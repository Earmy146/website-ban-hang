import React from 'react';

export default function CustomerToolbar({
  segmentFilter,
  onSegmentChange,
  marketingFilter,
  onMarketingChange,
  searchQuery,
  onSearchChange
}) {
  return (
    <section className="glass-card c-toolbar customer-toolbar">
      <div className="c-toolbar-filters">
        <label className="c-field">
          <span className="sr-only">Lọc theo phân khúc</span>
          <select 
            value={segmentFilter} 
            onChange={e => onSegmentChange(e.target.value)}
            aria-label="Lọc theo phân khúc khách hàng"
          >
            <option value="all">Tất cả phân khúc</option>
            <option value="Khách VIP">Khách VIP</option>
            <option value="Khách quen">Khách quen</option>
            <option value="Khách mới">Khách mới</option>
          </select>
        </label>

        <label className="c-field">
          <span className="sr-only">Lọc theo đăng ký nhận tin</span>
          <select 
            value={marketingFilter} 
            onChange={e => onMarketingChange(e.target.value)}
            aria-label="Lọc theo đăng ký tiếp thị"
          >
            <option value="all">Tất cả trạng thái nhận tin</option>
            <option value="Đã đăng ký">Đã đăng ký nhận tin</option>
            <option value="Chưa đăng ký">Chưa đăng ký nhận tin</option>
          </select>
        </label>
      </div>

      <div className="c-toolbar-search">
        <label className="c-search customer-search">
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
            </svg>
          </span>
          <input 
            type="search" 
            placeholder="Tìm kiếm khách hàng, email, số điện thoại..." 
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            aria-label="Tìm kiếm khách hàng"
          />
        </label>
      </div>
    </section>
  );
}

