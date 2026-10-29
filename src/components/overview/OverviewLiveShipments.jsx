import React from 'react';
import { Link } from 'react-router-dom';

export default function OverviewLiveShipments() {
  const shipments = [
    { id: 'VX83291', status: 'Đang giao hàng', statusClass: 'teal', time: '2 giờ trước', dest: 'Hà Nội' },
    { id: 'VX83290', status: 'Đang trung chuyển', statusClass: 'blue', time: '28 Thg 4', dest: 'TP. HCM' },
    { id: 'VX83288', status: 'Đã tạo nhãn', statusClass: 'indigo', time: '27 Thg 4', dest: 'Đà Nẵng' },
    { id: 'VX83287', status: 'Chậm trễ giao', statusClass: 'red', time: '26 Thg 4', dest: 'Cần Thơ' }
  ];

  return (
    <section className="glass-card live-shipments-card" aria-label="Vận đơn trực tiếp">
      <div className="card-heading">
        <div>
          <h2>Vận đơn trực tiếp</h2>
          <small>Theo dõi trạng thái giao hàng tức thời</small>
        </div>
        <Link to="/commerce/orders" className="text-link">
          Xem tất cả &rarr;
        </Link>
      </div>

      <div className="shipment-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
        {shipments.map((s) => (
          <div 
            key={s.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              background: '#ffffff70',
              borderRadius: '12px',
              border: '1px solid #f0e6d6'
            }}
          >
            <div>
              <strong style={{ fontSize: '14px', color: '#30281b' }}>#{s.id}</strong>
              <small style={{ display: 'block', color: '#7a7061', fontSize: '11px', marginTop: '2px' }}>
                Đến {s.dest} · {s.time}
              </small>
            </div>
            <span 
              className={`badge badge-${s.statusClass}`}
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '4px 9px',
                borderRadius: '6px'
              }}
            >
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
