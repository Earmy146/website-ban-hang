import React, { useState } from 'react';
import OrderRowMenu from './OrderRowMenu';

export default function OrderTable({
  orders,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onBulkPrint,
  onBulkCancel,
  onClearSelection,
  onViewOrder,
  onUpdateStatus,
  onPrintLabel,
  onCancelOrder
}) {
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(false);

  const isAllSelected = orders.length > 0 && selectedIds.length === orders.length;

  // Xử lý sắp xếp dữ liệu
  const sortedOrders = [...orders].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'total') {
      return sortAsc ? a.total - b.total : b.total - a.total;
    }
    if (typeof aVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
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

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <span className="order-state green"><i></i>Đã thanh toán</span>;
      case 'Pending':
        return <span className="order-state amber"><i></i>Chờ thanh toán</span>;
      case 'Refunded':
        return <span className="order-state red"><i></i>Đã hoàn tiền</span>;
      default:
        return <span className="order-state"><i></i>{status}</span>;
    }
  };

  const getFulfillmentBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return <span className="order-state green"><i></i>Đã giao hàng</span>;
      case 'Shipped':
        return <span className="order-state blue"><i></i>Đang giao hàng</span>;
      case 'Packed':
        return <span className="order-state amber"><i></i>Đã đóng gói</span>;
      case 'Processing':
        return <span className="order-state amber"><i></i>Đang xử lý</span>;
      default:
        return <span className="order-state"><i></i>{status}</span>;
    }
  };

  return (
    <section className="glass-card c-resource order-resource">
      <div className="order-list-heading">
        <div>
          <span>SỔ ĐƠN HÀNG</span>
          <h2>Danh sách đơn hàng</h2>
        </div>
        <small>{orders.length} đơn hàng phù hợp</small>
      </div>

      <div id="resource-results">
        {selectedIds.length > 0 && (
          <div className="c-selection">
            <strong>{selectedIds.length} đã chọn</strong>
            <button 
              type="button" 
              className="secondary-button" 
              onClick={onBulkPrint}
            >
              In vận đơn hàng loạt
            </button>
            <button 
              type="button" 
              className="secondary-button" 
              onClick={onBulkCancel}
            >
              Hủy đơn đã chọn
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

        <div className="table-scroll order-table-scroll" tabIndex="0" role="region" aria-label="Bảng danh sách đơn hàng">
          <table className="c-table order-table">
            <thead>
              <tr>
                <th scope="col" className="c-check">
                  <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    onChange={e => onSelectAll(e.target.checked)}
                    aria-label="Chọn tất cả đơn hàng"
                  />
                </th>
                <th scope="col">
                  <button type="button" onClick={() => handleSort('id')} className="sort-trigger">
                    Mã đơn
                  </button>
                </th>
                <th scope="col">
                  <button type="button" onClick={() => handleSort('date')} className="sort-trigger">
                    Ngày tạo
                  </button>
                </th>
                <th scope="col">Khách hàng</th>
                <th scope="col">Sản phẩm</th>
                <th scope="col">
                  <button type="button" onClick={() => handleSort('total')} className="sort-trigger">
                    Tổng tiền
                  </button>
                </th>
                <th scope="col">Thanh toán</th>
                <th scope="col">Giao hàng</th>
                <th scope="col">Vận chuyển</th>
                <th scope="col"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>

            <tbody>
              {sortedOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px 20px', color: '#776c5b' }}>
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                sortedOrders.map((o) => {
                  const isChecked = selectedIds.includes(o.id);
                  return (
                    <tr key={o.id} className={isChecked ? 'selected' : ''}>
                      <td className="c-check">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => onToggleSelect(o.id)}
                          aria-label={`Chọn đơn hàng ${o.id}`}
                        />
                      </td>

                      <td>
                        <button 
                          type="button" 
                          className="order-number" 
                          onClick={() => onViewOrder(o)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                        >
                          <strong>#{o.id}</strong>
                          <small>{o.channel}</small>
                        </button>
                      </td>

                      <td>
                        <span className="order-date">{o.date}</span>
                      </td>

                      <td>
                        <div className="order-customer">
                          <strong>{o.customer.name}</strong>
                          <small>{o.customer.email}</small>
                        </div>
                      </td>

                      <td>
                        <div className="order-items-cell">
                          <span>
                            <strong>{o.itemsCount} sản phẩm</strong>
                            <small>{o.itemsDesc}</small>
                          </span>
                        </div>
                      </td>

                      <td>
                        <strong className="order-total">${o.total.toFixed(2)}</strong>
                      </td>

                      <td>
                        {getPaymentBadge(o.paymentStatus)}
                      </td>

                      <td>
                        {getFulfillmentBadge(o.fulfillmentStatus)}
                      </td>

                      <td>
                        <div className="order-delivery-cell">
                          <strong>{o.shippingMethod}</strong>
                          <small>{o.address}</small>
                        </div>
                      </td>

                      <td className="order-actions-cell">
                        <OrderRowMenu 
                          order={o}
                          onViewOrder={onViewOrder}
                          onUpdateStatus={onUpdateStatus}
                          onPrintLabel={onPrintLabel}
                          onCancelOrder={onCancelOrder}
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

