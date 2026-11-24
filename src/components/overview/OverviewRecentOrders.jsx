import React from 'react';
import { Link } from 'react-router-dom';

function resolveOrderBadge(o) {
  if (o.status && o.statusClass) {
    return { label: o.status, cls: o.statusClass };
  }
  if (o.fulfillmentStatus === 'Cancelled') return { label: 'Đã hủy', cls: 'red' };
  if (o.paymentStatus === 'Refunded') return { label: 'Đã hoàn tiền', cls: 'red' };
  if (o.fulfillmentStatus === 'Delivered') return { label: 'Đã hoàn tất', cls: 'green' };
  if (o.fulfillmentStatus === 'Shipped') return { label: 'Đang giao', cls: 'blue' };
  if (o.paymentStatus === 'Paid' && o.fulfillmentStatus === 'Processing') return { label: 'Đã thanh toán', cls: 'green' };
  return { label: 'Đang xử lý', cls: 'amber' };
}

export default function OverviewRecentOrders({ orders: propOrders, onViewDetail }) {
  const defaultOrders = [
    { id: 'SF83291', customer: 'Sarah Kim', items: 'Áo thun Everyday Tee + 2', amount: '$95.72', status: 'Đã thanh toán', statusClass: 'green' },
    { id: 'SF83290', customer: 'Michael Tân', items: 'Balo tối giản Minimal Backpack', amount: '$85.32', status: 'Đang giao', statusClass: 'blue' },
    { id: 'SF83289', customer: 'Emily Davis', items: 'Ly sứ Ceramic Mug (x2)', amount: '$43.88', status: 'Đã hoàn tất', statusClass: 'green' },
    { id: 'SF83288', customer: 'Daniel Lê', items: 'Túi vải Canvas Tote Bag', amount: '$74.12', status: 'Đang xử lý', statusClass: 'amber' },
  ];

  const orders = Array.isArray(propOrders) && propOrders.length > 0 ? propOrders : defaultOrders;

  return (
    <section className="glass-card recent-orders-card" aria-label="Đơn hàng gần đây">
      <div className="card-heading">
        <div>
          <h2>Đơn hàng mới nhất</h2>
          <small>Giao dịch vừa phát sinh theo thời gian thực</small>
        </div>
        <Link to="/commerce/orders" className="text-link">
          Xem tất cả đơn &rarr;
        </Link>
      </div>

      <div style={{ marginTop: '14px', overflowX: 'auto' }}>
        <table className="c-table" style={{ width: '100%', fontSize: '13px' }}>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Sản phẩm</th>
              <th>Số tiền</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const customerName = typeof o.customer === 'object' ? o.customer?.name : o.customer;
              const itemsText = o.items || o.itemsDesc || `${o.itemsCount || 1} sản phẩm`;
              const amountText = o.amount !== undefined
                ? (typeof o.amount === 'number' ? `$${o.amount.toFixed(2)}` : o.amount)
                : `$${Number(o.total || 0).toFixed(2)}`;
              const badge = resolveOrderBadge(o);

              return (
                <tr key={o.id}>
                  <td>
                    <strong style={{ color: '#885600' }}>#{String(o.id).replace(/^#/, '')}</strong>
                  </td>
                  <td>{customerName}</td>
                  <td><small style={{ color: '#776c5b' }}>{itemsText}</small></td>
                  <td><strong>{amountText}</strong></td>
                  <td>
                    <span className={`badge badge-${badge.cls}`} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
                      {badge.label}
                    </span>
                  </td>
                  <td>
                    <button 
                      type="button" 
                      className="secondary-button" 
                      style={{ padding: '3px 10px', fontSize: '12px' }}
                      onClick={() => onViewDetail(o)}
                    >
                      Xem
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
