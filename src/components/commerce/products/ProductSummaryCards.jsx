import React from 'react';

export default function ProductSummaryCards({ products }) {
  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, p) => sum + p.inventory, 0);
  const activeProducts = products.filter(p => p.status === 'Active').length;
  const activeRatio = totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0;
  const lowStockProducts = products.filter(p => p.status === 'Low stock' || (p.inventory > 0 && p.inventory < 20)).length;
  const outOfStockProducts = products.filter(p => p.status === 'Out of stock' || p.inventory === 0).length;

  return (
    <section className="product-summary-grid" aria-label="Tổng quan sản phẩm">
      {/* 1. Tổng sản phẩm */}
      <div className="product-summary-card green">
        <div className="product-summary-top">
          <span className="product-summary-icon">
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.34,44-29.77,16.3-80.35-44ZM128,120,47.66,76l33.9-18.56,80.34,44ZM40,90l80,43.78v85.79L40,175.82Zm176,85.78h0l-80,43.79V133.82l32-17.51V152a8,8,0,0,0,16,0V107.55L216,90v85.77Z"></path>
              </svg>
            </span>
          </span>
          <small>{totalUnits} sản phẩm sẵn có</small>
        </div>
        <strong>{totalProducts}</strong>
        <span>Tổng sản phẩm</span>
      </div>

      {/* 2. Đang kinh doanh */}
      <div className="product-summary-card green">
        <div className="product-summary-top">
          <span className="product-summary-icon">
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
              </svg>
            </span>
          </span>
          <small>{activeRatio}% danh mục</small>
        </div>
        <strong>{activeProducts}</strong>
        <span>Đang kinh doanh</span>
      </div>

      {/* 3. Tồn kho thấp */}
      <div className="product-summary-card amber">
        <div className="product-summary-top">
          <span className="product-summary-icon">
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"></path>
              </svg>
            </span>
          </span>
          <small>Cần duyệt nhập hàng</small>
        </div>
        <strong>{lowStockProducts}</strong>
        <span>Tồn kho thấp</span>
      </div>

      {/* 4. Hết hàng */}
      <div className="product-summary-card red">
        <div className="product-summary-top">
          <span className="product-summary-icon">
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path>
              </svg>
            </span>
          </span>
          <small>Tạm ngừng hiển thị</small>
        </div>
        <strong>{outOfStockProducts}</strong>
        <span>Hết hàng</span>
      </div>
    </section>
  );
}

