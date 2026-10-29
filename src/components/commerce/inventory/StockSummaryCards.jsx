import React from 'react';

export default function StockSummaryCards({ stock }) {
  const totalOnHand = stock.reduce((sum, s) => sum + s.onHand, 0);
  const totalCommitted = stock.reduce((sum, s) => sum + s.committed, 0);
  const totalAvailable = stock.reduce((sum, s) => sum + s.available, 0);
  const lowStockCount = stock.filter(s => s.status === 'Low' || s.available <= s.reorderPoint).length;
  const outOfStockCount = stock.filter(s => s.onHand === 0).length;

  return (
    <section className="inventory-summary-grid" aria-label="Tổng quan tồn kho">
      <div className="inventory-summary-card green">
        <span>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M240,184h-8V57.9l9.67-2.08a8,8,0,1,0-3.35-15.64l-224,48A8,8,0,0,0,16,104a8.16,8.16,0,0,0,1.69-.18L24,102.47V184H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM40,99,216,61.33V184H192V128a8,8,0,0,0-8-8H72a8,8,0,0,0-8,8v56H40Zm136,53H80V136h96ZM80,168h96v16H80Z"></path>
            </svg>
          </span>
        </span>
        <div>
          <small>Hàng sẵn có</small>
          <strong>{totalOnHand}</strong>
          <em>Tất cả vị trí · {totalCommitted} đã giữ đơn</em>
        </div>
      </div>

      <div className="inventory-summary-card blue">
        <span>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
            </svg>
          </span>
        </span>
        <div>
          <small>Có thể bán ngay</small>
          <strong>{totalAvailable}</strong>
          <em>Sau khi trừ các đơn đã đặt</em>
        </div>
      </div>

      <div className="inventory-summary-card amber">
        <span>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15Z"></path>
            </svg>
          </span>
        </span>
        <div>
          <small>Cần nhập thêm</small>
          <strong>{lowStockCount}</strong>
          <em>Đạt ngưỡng báo động tồn kho</em>
        </div>
      </div>

      <div className="inventory-summary-card red">
        <span>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"></path>
            </svg>
          </span>
        </span>
        <div>
          <small>Hết hàng tạm thời</small>
          <strong>{outOfStockCount}</strong>
          <em>Cần bổ sung khẩn cấp</em>
        </div>
      </div>
    </section>
  );
}

