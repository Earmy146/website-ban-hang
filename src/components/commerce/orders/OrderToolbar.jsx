import React from 'react';

export default function OrderToolbar({
  channelFilter,
  onChannelChange,
  paymentFilter,
  onPaymentChange,
  fulfillmentFilter,
  onFulfillmentChange,
  searchQuery,
  onSearchChange
}) {
  return (
    <section className="glass-card c-toolbar order-toolbar">
      <div className="c-toolbar-filters">
        <label className="c-field">
          <span className="sr-only">Lọc theo kênh bán</span>
          <select 
            value={channelFilter} 
            onChange={e => onChannelChange(e.target.value)}
            aria-label="Lọc theo kênh bán"
          >
            <option value="all">Tất cả kênh bán</option>
            <option value="Cửa hàng trực tuyến">Cửa hàng trực tuyến</option>
            <option value="Ứng dụng di động">Ứng dụng di động</option>
            <option value="Sàn thương mại">Sàn thương mại</option>
          </select>
        </label>

        <label className="c-field">
          <span className="sr-only">Lọc theo trạng thái thanh toán</span>
          <select 
            value={paymentFilter} 
            onChange={e => onPaymentChange(e.target.value)}
            aria-label="Lọc theo thanh toán"
          >
            <option value="all">Tất cả thanh toán</option>
            <option value="Paid">Đã thanh toán</option>
            <option value="Pending">Chờ thanh toán</option>
            <option value="Refunded">Đã hoàn tiền</option>
          </select>
        </label>

        <label className="c-field">
          <span className="sr-only">Lọc theo trạng thái giao hàng</span>
          <select 
            value={fulfillmentFilter} 
            onChange={e => onFulfillmentChange(e.target.value)}
            aria-label="Lọc theo giao hàng"
          >
            <option value="all">Tất cả giao hàng</option>
            <option value="Processing">Đang xử lý</option>
            <option value="Packed">Đã đóng gói</option>
            <option value="Shipped">Đang giao hàng</option>
            <option value="Delivered">Đã giao thành công</option>
          </select>
        </label>
      </div>

      <div className="c-toolbar-search">
        <label className="c-search order-search">
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
            </svg>
          </span>
          <input 
            type="search" 
            placeholder="Tìm kiếm mã đơn, khách hàng..." 
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            aria-label="Tìm kiếm đơn hàng"
          />
        </label>
      </div>
    </section>
  );
}
