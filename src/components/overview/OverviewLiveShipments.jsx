import React from 'react';
import { Link } from 'react-router-dom';

export default function OverviewLiveShipments({ shipments: propShipments, onSelectShipment }) {
  const defaultShipments = [
    { id: 'TRK-98214', orderId: 'SF83291', carrier: 'Giao Hàng Tiết Kiệm (GHTK)', customer: 'Sarah Kim', status: 'Đang giao hàng', statusClass: 'teal', time: '2 giờ trước', dest: 'Hà Nội', eta: 'Hôm nay, 17:00' },
    { id: 'TRK-98213', orderId: 'SF83290', carrier: 'DHL Express', customer: 'Michael Tân', status: 'Đang trung chuyển', statusClass: 'blue', time: '28 Thg 4', dest: 'TP. HCM', eta: '29 Thg 4' },
    { id: 'TRK-98212', orderId: 'SF83288', carrier: 'Viettel Post', customer: 'Daniel Lê', status: 'Đã tạo nhãn', statusClass: 'indigo', time: '27 Thg 4', dest: 'Đà Nẵng', eta: '30 Thg 4' },
    { id: 'TRK-98211', orderId: 'SF83287', carrier: 'VNPost', customer: 'Priya Sharma', status: 'Chờ lấy hàng', statusClass: 'amber', time: '26 Thg 4', dest: 'Cần Thơ', eta: '02 Thg 5' }
  ];

  const shipments = Array.isArray(propShipments) && propShipments.length > 0 ? propShipments : defaultShipments;

  return (
    <section className="glass-card live-shipments-card" aria-label="Vận đơn trực tiếp">
      <div className="card-heading">
        <div>
          <h2>Vận đơn trực tiếp</h2>
          <small>Bấm vào từng kiện hàng để xem chi tiết hành trình</small>
        </div>
        <Link to="/commerce/fulfillment" className="text-link">
          Xem tất cả &rarr;
        </Link>
      </div>

      <div className="shipment-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
        {shipments.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelectShipment && onSelectShipment(s)}
            style={{
              width: '100%',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              background: '#ffffff78',
              borderRadius: '12px',
              border: '1px solid #ece0cd',
              transition: 'background 0.15s, transform 0.12s'
            }}
            title={`Xem chi tiết vận đơn #${String(s.id).replace(/^#/, '')}`}
          >
            <div>
              <strong style={{ fontSize: '14px', color: '#30281b' }}>#{String(s.id).replace(/^#/, '')}</strong>
              <small style={{ display: 'block', color: '#7a7061', fontSize: '11.5px', marginTop: '2px' }}>
                Đến {s.dest || s.destination || 'Khách nhận'} · {s.time || s.createdAt || 'Mới cập nhật'}
              </small>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                className={`badge badge-${s.statusClass || 'teal'}`}
                style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '4px 9px',
                  borderRadius: '6px'
                }}
              >
                {s.statusText || s.status}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#885600' }}>Chi tiết &rarr;</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
