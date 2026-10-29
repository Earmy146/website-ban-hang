import React from 'react';
import { Link } from 'react-router-dom';

export default function OverviewOperationsCard() {
  const steps = [
    { label: 'Đang xử lý', count: 892, color: '#10b981', total: 1248 },
    { label: 'Đã đóng gói', count: 721, color: '#06b6d4', total: 1248 },
    { label: 'Đang giao hàng', count: 654, color: '#f59e0b', total: 1248 },
    { label: 'Đã giao thành công', count: 602, color: '#8b5cf6', total: 1248 },
  ];

  return (
    <section className="glass-card operations-summary" aria-label="Tiến độ vận hành">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span className="icon-tile tile-amber" style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '20px' }}>⚡</span>
        </span>
        <div>
          <h2 style={{ fontSize: '17px', margin: 0, fontWeight: '700' }}>Cửa hàng đang vận hành</h2>
          <small style={{ color: '#7a7061' }}><strong>1,248</strong> đơn hàng nhận được trong kỳ</small>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {steps.map((st, i) => {
          const ratio = Math.round((st.count / st.total) * 100);
          return (
            <div key={i} style={{ padding: '10px 14px', background: '#ffffff60', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{st.label}</span>
                <strong style={{ fontSize: '14px', color: '#2a2216' }}>{st.count}</strong>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e8dcce', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${ratio}%`, height: '100%', background: st.color, borderRadius: '3px' }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '16px', textAlign: 'right' }}>
        <Link to="/commerce/orders" className="text-link" style={{ fontSize: '13px', fontWeight: '600' }}>
          Đến trung tâm xử lý đơn &rarr;
        </Link>
      </div>
    </section>
  );
}

