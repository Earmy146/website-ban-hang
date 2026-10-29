import React from 'react';

export default function CustomerSummaryCards({ customers }) {
  const totalCount = customers.length;
  const returningCount = customers.filter(c => c.segment === 'Khách quen' || c.ordersCount > 1).length;
  const newCount = customers.filter(c => c.segment === 'Khách mới' || c.ordersCount <= 1).length;
  const vipCount = customers.filter(c => c.segment === 'Khách VIP').length;

  return (
    <section className="customer-summary-grid" aria-label="Tổng quan khách hàng">
      <div className="customer-summary-card green">
        <span>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.14,98.7a8,8,0,0,1-11.07-2.33A79.83,79.83,0,0,0,172,168a8,8,0,0,1,0-16,44,44,0,1,0-16.34-84.87,8,8,0,1,1-5.94-14.85,60,60,0,0,1,55.53,105.64,95.83,95.83,0,0,1,47.22,37.71A8,8,0,0,1,250.14,206.7Z"></path>
            </svg>
          </span>
        </span>
        <div>
          <small>Tổng khách hàng</small>
          <strong>{totalCount}</strong>
          <em>{vipCount} khách hàng VIP</em>
        </div>
      </div>

      <div className="customer-summary-card blue">
        <span>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M136,80v43.47l36.12,21.67a8,8,0,0,1-8.24,13.72l-40-24A8,8,0,0,1,120,128V80a8,8,0,0,1,16,0Zm-8-48A95.44,95.44,0,0,0,60.08,60.15C52.81,67.51,46.35,74.59,40,82V64a8,8,0,0,0-16,0v40a8,8,0,0,0,8,8H72a8,8,0,0,0,0-16H49c7.15-8.42,14.27-16.35,22.39-24.47A79.6,79.6,0,1,1,48.32,136a8,8,0,0,0-16,.63,96,96,0,1,0,95.68-104.63Z"></path>
            </svg>
          </span>
        </span>
        <div>
          <small>Khách quen quay lại</small>
          <strong>{returningCount}</strong>
          <em>{Math.round((returningCount / (totalCount || 1)) * 100)}% tỷ lệ giữ chân</em>
        </div>
      </div>

      <div className="customer-summary-card amber">
        <span>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M244.24,60.11l-56-32a8,8,0,0,0-7.82,0l-56,32a8,8,0,0,0-4.09,7v64a8,8,0,0,0,4.09,7l56,32a8,8,0,0,0,7.82,0l56-32a8,8,0,0,0,4.09-7V67.08A8,8,0,0,0,244.24,60.11ZM180.33,42.25l38.25,21.86-38.25,21.85-38.24-21.85ZM136,78.36l36.33,20.76v43.73L136,122.09Zm52,64.49V99.12l36.33-20.76v43.73ZM120,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16h72A8,8,0,0,1,120,128Zm0,32a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16h72A8,8,0,0,1,120,160Zm0,32a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16h72A8,8,0,0,1,120,192Z"></path>
            </svg>
          </span>
        </span>
        <div>
          <small>Khách hàng mới</small>
          <strong>{newCount}</strong>
          <em>Gia nhập trong tháng</em>
        </div>
      </div>

      <div className="customer-summary-card red">
        <span>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"></path>
            </svg>
          </span>
        </span>
        <div>
          <small>Tỷ lệ rời bỏ</small>
          <strong>2.1%</strong>
          <em>Rất thấp & ổn định</em>
        </div>
      </div>
    </section>
  );
}
