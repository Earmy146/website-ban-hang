import React from 'react';
import ProductRowMenu from './ProductRowMenu';

export default function ProductTable({
  products,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onBulkArchive,
  onClearSelection,
  onViewProduct,
  onEditProduct,
  onDuplicateProduct,
  onShareProduct,
  onDeleteProduct
}) {
  const isAllSelected = products.length > 0 && selectedIds.length === products.length;

  return (
    <section className="glass-card c-resource product-resource">
      {/* Header của bảng */}
      <div className="product-list-heading">
        <div>
          <span>DANH MỤC</span>
          <h2>Danh sách sản phẩm</h2>
        </div>
        <small>{products.length} sản phẩm phù hợp</small>
      </div>

      <div id="resource-results">
        {/* Thanh công cụ khi có checkbox được chọn */}
        {selectedIds.length > 0 && (
          <div className="c-selection">
            <strong>{selectedIds.length} đã chọn</strong>
            <button 
              type="button" 
              className="secondary-button" 
              onClick={onBulkArchive}
            >
              Lưu trữ đã chọn
            </button>
            <button 
              type="button" 
              className="secondary-button" 
              onClick={onClearSelection}
            >
              Bỏ chọn
            </button>
          </div>
        )}

        <div className="table-scroll c-table-scroll product-table-scroll" tabIndex="0" role="region" aria-label="Bảng sản phẩm">
          <table className="c-table product-table">
            <thead>
              <tr>
                {/* Checkbox chọn tất cả */}
                <th scope="col" className="c-check">
                  <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    onChange={e => onSelectAll(e.target.checked)}
                    aria-label="Chọn tất cả sản phẩm"
                  />
                </th>
                <th scope="col">Sản phẩm</th>
                <th scope="col">Mã SKU</th>
                <th scope="col">Danh mục</th>
                <th scope="col">Thương hiệu</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Tồn kho</th>
                <th scope="col">Đã bán</th>
                <th scope="col">Doanh số</th>
                <th scope="col">Xu hướng</th>
                <th scope="col">Đánh giá</th>
                <th scope="col">Cập nhật</th>
                <th scope="col"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '40px 20px', color: '#776c5b' }}>
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isChecked = selectedIds.includes(p.id);
                  const maxInv = p.maxInventory || 100;
                  const inventoryRatio = maxInv > 0 ? Math.min(100, Math.round(((p.inventory || 0) / maxInv) * 100)) : 0;
                  const isLow = (p.inventory || 0) > 0 && (p.inventory || 0) < 20;
                  const isOut = (p.inventory || 0) === 0;

                  return (
                    <tr key={p.id} className={isChecked ? 'selected' : ''}>
                      {/* Checkbox dòng */}
                      <td className="c-check">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => onToggleSelect(p.id)}
                          aria-label={`Chọn ${p.name}`}
                        />
                      </td>

                      {/* Tên & Ảnh sản phẩm */}
                      <td>
                        <button 
                          type="button" 
                          className="c-record-name product-record-name"
                          onClick={() => onViewProduct(p)}
                        >
                          <span className="product-thumb product-static-image" aria-hidden="true">
                            <img src={p.image || '/assets/images/products/everyday-tee.png'} alt="" loading="lazy" />
                          </span>
                          <span>
                            <strong>{p.name}</strong>
                            <small>{p.category} · {p.brand}</small>
                          </span>
                        </button>
                      </td>

                      {/* SKU */}
                      <td><span className="product-mono">{p.sku}</span></td>

                      {/* Category */}
                      <td>{p.category}</td>

                      {/* Brand */}
                      <td>{p.brand}</td>

                      {/* Status */}
                      <td>
                        <span className={`product-status ${p.isDeleted || isOut ? 'red' : isLow ? 'amber' : 'green'}`}>
                          <i></i>
                          {p.isDeleted
                            ? 'Đã lưu trữ'
                            : p.status === 'Active'
                              ? 'Đang bán'
                              : p.status === 'Low stock'
                                ? 'Sắp hết'
                                : p.status === 'Out of stock'
                                  ? 'Hết hàng'
                                  : 'Bản nháp'}
                        </span>
                      </td>

                      {/* Inventory Progress */}
                      <td>
                        <div className={`product-inventory ${isOut ? 'red' : isLow ? 'amber' : 'green'}`}>
                          <strong>{p.inventory ?? 0} còn trong kho</strong>
                          <span><i style={{ width: `${inventoryRatio}%` }}></i></span>
                        </div>
                      </td>

                      {/* Sales */}
                      <td>{Number(p.sales || 0).toLocaleString()}</td>

                      {/* Revenue */}
                      <td><strong>${(Number(p.revenue || 0) / 1000).toFixed(1)}K</strong></td>

                      {/* Trend */}
                      <td>
                        <div className={`product-trend ${p.trendUp !== false ? 'up' : 'down'}`}>
                          <svg viewBox="0 0 72 32" role="img" aria-label={`Xu hướng ${p.trend || '+0.0%'}`}>
                            <polyline points={p.trendUp !== false ? "0.0,27.6 10.3,25.4 20.6,29.2 30.9,30.0 41.1,22.5 51.4,11.4 61.7,6.0 72.0,8.4" : "0.0,6.0 10.3,8.4 20.6,11.4 30.9,15.0 41.1,20.5 51.4,24.4 61.7,28.0 72.0,29.4"}></polyline>
                          </svg>
                          <small>{p.trend || '+0.0%'}</small>
                        </div>
                      </td>

                      {/* Rating */}
                      <td>
                        <span className="product-rating">
                          <span className="icon" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                              <path d="M239.18,97.26A16.38,16.38,0,0,0,224.92,86l-59-4.76L143.14,26.15a16.36,16.36,0,0,0-30.27,0L90.11,81.23,31.08,86a16.46,16.46,0,0,0-9.37,28.86l45,38.83L53,211.75a16.38,16.38,0,0,0,24.5,17.82L128,198.49l50.53,31.08A16.4,16.4,0,0,0,203,211.75l-13.76-58.07,45-38.83A16.43,16.43,0,0,0,239.18,97.26Z"></path>
                            </svg>
                          </span>
                          {' '}{p.rating ?? 5.0}
                        </span>
                      </td>

                      {/* Modified Date */}
                      <td><span className="product-date">{p.date || 'Vừa xong'}</span></td>

                      {/* Menu 3 chấm */}
                      <td className="product-actions-cell">
                        <ProductRowMenu 
                          product={p}
                          onView={onViewProduct}
                          onEdit={onEditProduct}
                          onDuplicate={onDuplicateProduct}
                          onShare={onShareProduct}
                          onDelete={onDeleteProduct}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
