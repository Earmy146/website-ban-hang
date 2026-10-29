import React from 'react';
import { Link } from 'react-router-dom';

export default function OverviewRecentOrders({ onViewDetail }) {
  const orders = [
    { id: 'SF83291', customer: 'Sarah Kim', items: 'Áo thun Everyday Tee + 2', amount: '$95.72', status: 'Đã thanh toán', statusClass: 'green' },
    { id: 'SF83290', customer: 'Michael Tân', items: 'Balo tối giản Minimal Backpack', amount: '$85.32', status: 'Đang giao', statusClass: 'blue' },
    { id: 'SF83289', customer: 'Emily Davis', items: 'Ly sứ Ceramic Mug (x2)', amount: '$43.88', status: 'Đã hoàn tất', statusClass: 'green' },
    { id: 'SF83288', customer: 'Daniel Lê', items: 'Túi vải Canvas Tote Bag', amount: '$74.12', status: 'Đang xử lý', statusClass: 'amber' },
  ];

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
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong style={{ color: '#885600' }}>#{o.id}</strong>
                </td>
                <td>{o.customer}</td>
                <td><small style={{ color: '#776c5b' }}>{o.items}</small></td>
                <td><strong>{o.amount}</strong></td>
                <td>
                  <span className={`badge badge-${o.statusClass}`} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
                    {o.status}
                  </span>
                </td>
                <td>
                  <button 
                    type="button" 
                    className="secondary-button" 
                    style={{ padding: '3px 10px', fontSize: '12px' }}
                    onClick={() => onViewDetail(o.id)}
                  >
                    Xem
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

