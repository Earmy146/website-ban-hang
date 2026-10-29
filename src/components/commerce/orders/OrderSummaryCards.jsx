import React from 'react';

export default function OrderSummaryCards({ orders }) {
  const totalOrders = orders.length;
  const totalValue = orders.reduce((sum, o) => sum + o.total, 0);
  const toFulfillCount = orders.filter(o => o.fulfillmentStatus === 'Processing' || o.fulfillmentStatus === 'Packed').length;
  const needsAttentionCount = orders.filter(o => o.paymentStatus === 'Pending').length;

  return (
    <section className="order-summary-grid" aria-label="Tổng quan đơn hàng">
      <div className="order-summary-card green">
        <span>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200Z"></path>
            </svg>
          </span>
        </span>
        <div>
          <small>Tổng đơn hàng</small>
          <strong>{totalOrders}</strong>
          <em>{totalOrders} đơn đang xử lý</em>
        </div>
      </div>

      <div className="order-summary-card blue">
        <span>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M224,88H32a8,8,0,0,0-8,8v96a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V96A8,8,0,0,0,224,88Z"></path>
            </svg>
          </span>
        </span>
        <div>
          <small>Giá trị đơn hàng</small>
          <strong>${totalValue.toFixed(2)}</strong>
          <em>Đã trừ đơn hủy</em>
        </div>
      </div>

      <div className="order-summary-card amber">
        <span>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15Z"></path>
            </svg>
          </span>
        </span>
        <div>
          <small>Cần giao hàng</small>
          <strong>{toFulfillCount}</strong>
          <em>Cần thao tác vận hành</em>
        </div>
      </div>

      <div className="order-summary-card red">
        <span>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"></path>
            </svg>
          </span>
        </span>
        <div>
          <small>Cần xử lý ngay</small>
          <strong>{needsAttentionCount}</strong>
          <em>{needsAttentionCount} đơn soát thanh toán</em>
        </div>
      </div>
    </section>
  );
}
