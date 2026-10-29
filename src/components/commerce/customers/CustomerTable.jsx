import React, { useState } from 'react';
import CustomerRowMenu from './CustomerRowMenu';

export default function CustomerTable({
  customers,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onBulkEmail,
  onBulkDelete,
  onClearSelection,
  onViewCustomer,
  onEditCustomer,
  onDeleteCustomer
}) {
  const [sortField, setSortField] = useState('spend');
  const [sortAsc, setSortAsc] = useState(false);

  const isAllSelected = customers.length > 0 && selectedIds.length === customers.length;

  const sortedCustomers = [...customers].sort((a, b) => {
    if (sortField === 'spend') {
      return sortAsc ? a.totalSpent - b.totalSpent : b.totalSpent - a.totalSpent;
    }
    if (sortField === 'orders') {
      return sortAsc ? a.ordersCount - b.ordersCount : b.ordersCount - a.ordersCount;
    }
    if (sortField === 'name') {
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
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

  const getSegmentBadge = (segment) => {
    switch (segment) {
      case 'Khách VIP':
        return <span className="customer-segment vip">Khách VIP</span>;
      case 'Khách quen':
        return <span className="customer-segment regular" style={{ background: '#dceee2', color: '#2b6e41', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Khách quen</span>;
      default:
        return <span className="customer-segment new" style={{ background: '#f5ebd7', color: '#8b6419', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Khách mới</span>;
    }
  };

  return (
    <section className="glass-card c-resource customer-resource">
      <div className="customer-list-heading">
        <div>
          <span>QUAN HỆ KHÁCH HÀNG</span>
          <h2>Danh sách khách hàng</h2>
          <p>Đơn hàng, giá trị, địa chỉ và tương tác trên cùng một màn hình.</p>
        </div>
        <small>{customers.length} khách hàng phù hợp</small>
      </div>

      <div id="resource-results">
        {selectedIds.length > 0 && (
          <div className="c-selection">
            <strong>{selectedIds.length} đã chọn</strong>
            <button 
              type="button" 
              className="secondary-button" 
              onClick={onBulkEmail}
            >
              Gửi email hàng loạt
            </button>
            <button 
              type="button" 
              className="secondary-button" 
              onClick={onBulkDelete}
            >
              Xóa khách hàng đã chọn
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

        <div className="table-scroll c-table-scroll customer-table-scroll" tabIndex="0" role="region" aria-label="Bảng danh sách khách hàng">
          <table className="c-table customer-table">
            <thead>
              <tr>
                <th scope="col" className="c-check">
                  <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    onChange={e => onSelectAll(e.target.checked)}
                    aria-label="Chọn tất cả khách hàng"
                  />
                </th>
                <th scope="col">
                  <button type="button" onClick={() => handleSort('name')} className="sort-trigger">
                    Khách hàng
                  </button>
                </th>
                <th scope="col">Phân khúc</th>
                <th scope="col">
                  <button type="button" onClick={() => handleSort('orders')} className="sort-trigger">
                    Đơn hàng
                  </button>
                </th>
                <th scope="col">
                  <button type="button" onClick={() => handleSort('spend')} className="sort-trigger">
                    Tổng chi tiêu
                  </button>
                </th>
                <th scope="col">Đơn TB (AOV)</th>
                <th scope="col">Đơn gần nhất</th>
                <th scope="col">Vị trí</th>
                <th scope="col">Tiếp thị</th>
                <th scope="col">Trạng thái</th>
                <th scope="col"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>

            <tbody>
              {sortedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px 20px', color: '#776c5b' }}>
                    Không tìm thấy khách hàng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                sortedCustomers.map((c) => {
                  const isChecked = selectedIds.includes(c.id);
                  return (
                    <tr key={c.id} className={isChecked ? 'selected' : ''}>
                      <td className="c-check">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => onToggleSelect(c.id)}
                          aria-label={`Chọn khách hàng ${c.name}`}
                        />
                      </td>

                      <td>
                        <button 
                          type="button" 
                          className="customer-record" 
                          onClick={() => onViewCustomer(c)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                        >
                          <span className="customer-avatar">{c.avatar}</span>
                          <span>
                            <strong>{c.name}</strong>
                            <small>{c.email}</small>
                          </span>
                        </button>
                      </td>

                      <td>
                        {getSegmentBadge(c.segment)}
                      </td>

                      <td>
                        <strong>{c.ordersCount}</strong>
                      </td>

                      <td>
                        <strong style={{ color: '#205835' }}>${c.totalSpent.toFixed(2)}</strong>
                      </td>

                      <td>
                        ${c.aov.toFixed(2)}
                      </td>

                      <td>
                        <span className="customer-last-order">{c.lastOrder}</span>
                      </td>

                      <td>
                        <span className="customer-location">{c.location}</span>
                      </td>

                      <td>
                        <span className={`customer-marketing ${c.marketing === 'Đã đăng ký' ? 'subscribed' : 'unsubscribed'}`}>
                          <span className="icon" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                              <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
                            </svg>
                          </span>
                          {c.marketing}
                        </span>
                      </td>

                      <td>
                        <span className="c-status green">Đang hoạt động</span>
                      </td>

                      <td className="product-actions-cell customer-actions-cell">
                        <CustomerRowMenu 
                          customer={c}
                          onViewCustomer={onViewCustomer}
                          onEditCustomer={onEditCustomer}
                          onDeleteCustomer={onDeleteCustomer}
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
