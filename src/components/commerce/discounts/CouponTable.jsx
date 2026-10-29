import React, { useState } from 'react';
import CouponRowMenu from './CouponRowMenu';

export default function CouponTable({
  coupons,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onBulkDelete,
  onClearSelection,
  onViewCoupon,
  onEditCoupon,
  onDeleteCoupon
}) {
  const [sortField, setSortField] = useState('code');
  const [sortAsc, setSortAsc] = useState(true);

  const isAllSelected = coupons.length > 0 && selectedIds.length === coupons.length;

  const sortedCoupons = [...coupons].sort((a, b) => {
    if (sortField === 'value') {
      return sortAsc ? a.value - b.value : b.value - a.value;
    }
    if (sortField === 'code') {
      return sortAsc ? a.code.localeCompare(b.code) : b.code.localeCompare(a.code);
    }
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span className="c-status green">Đang áp dụng</span>;
      case 'Scheduled':
        return <span className="c-status blue" style={{ background: '#e1eefc', color: '#1a5ea6', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Đã lên lịch</span>;
      case 'Expired':
        return <span className="c-status red" style={{ background: '#fcebe8', color: '#b23b3b', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Hết hạn</span>;
      default:
        return <span className="c-status">{status}</span>;
    }
  };

  return (
    <section className="glass-card c-resource">
      <div className="product-list-heading">
        <div>
          <span>CHƯƠNG TRÌNH KHUYẾN MÃI</span>
          <h2>Danh sách mã giảm giá</h2>
          <p>Mã khuyến mãi, chiết khấu phần trăm và voucher miễn phí vận chuyển.</p>
        </div>
        <small>{coupons.length} mã ưu đãi</small>
      </div>

      <div id="resource-results">
        {selectedIds.length > 0 && (
          <div className="c-selection">
            <strong>{selectedIds.length} đã chọn</strong>
            <button 
              type="button" 
              className="secondary-button" 
              onClick={onBulkDelete}
            >
              Xóa các mã đã chọn
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

        <div className="table-scroll c-table-scroll" tabIndex="0" role="region" aria-label="Bảng mã giảm giá">
          <table className="c-table">
            <thead>
              <tr>
                <th scope="col" className="c-check">
                  <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    onChange={e => onSelectAll(e.target.checked)}
                    aria-label="Chọn tất cả mã"
                  />
                </th>
                <th scope="col">
                  <button type="button" onClick={() => handleSort('code')} className="sort-trigger">
                    Mã ưu đãi
                  </button>
                </th>
                <th scope="col">Loại giảm giá</th>
                <th scope="col">
                  <button type="button" onClick={() => handleSort('value')} className="sort-trigger">
                    Giá trị
                  </button>
                </th>
                <th scope="col">Đơn tối thiểu</th>
                <th scope="col">Đối tượng</th>
                <th scope="col">Lượt dùng</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Thời hạn</th>
                <th scope="col"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>

            <tbody>
              {sortedCoupons.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px 20px', color: '#776c5b' }}>
                    Không tìm thấy mã giảm giá nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                sortedCoupons.map((c) => {
                  const isChecked = selectedIds.includes(c.id);
                  return (
                    <tr key={c.id} className={isChecked ? 'selected' : ''}>
                      <td className="c-check">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => onToggleSelect(c.id)}
                          aria-label={`Chọn mã ${c.code}`}
                        />
                      </td>

                      <td>
                        <button 
                          type="button" 
                          className="c-record-name"
                          onClick={() => onViewCoupon(c)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                        >
                          <strong style={{ letterSpacing: '0.5px', color: '#885600', fontFamily: 'monospace', fontSize: '15px' }}>
                            {c.code}
                          </strong>
                        </button>
                      </td>

                      <td>{c.discountType}</td>

                      <td>
                        <strong style={{ color: '#276840' }}>
                          {c.discountType === 'Phần trăm (%)' ? `${c.value}%` : c.discountType === 'Số tiền cố định ($)' ? `$${c.value}` : 'Miễn phí'}
                        </strong>
                      </td>

                      <td>${c.minSpend.toFixed(2)}</td>

                      <td>{c.eligibility}</td>

                      <td>
                        <strong>{c.usageCount}</strong> / {c.usageLimit}
                      </td>

                      <td>
                        {getStatusBadge(c.status)}
                      </td>

                      <td>
                        <small>{c.startDate} - {c.endDate}</small>
                      </td>

                      <td className="product-actions-cell">
                        <CouponRowMenu 
                          coupon={c}
                          onViewCoupon={onViewCoupon}
                          onEditCoupon={onEditCoupon}
                          onDeleteCoupon={onDeleteCoupon}
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

