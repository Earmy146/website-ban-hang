import React from 'react';
import { Link } from 'react-router-dom';

function resolveFulfillmentKey(step) {
  if (step?.fulfillment || step?.fulfillmentStatus) {
    return step.fulfillment || step.fulfillmentStatus;
  }
  const lbl = String(step?.label || '').toLowerCase();
  if (lbl.includes('xử lý')) return 'Processing';
  if (lbl.includes('đóng gói')) return 'Packed';
  if (lbl.includes('đang giao')) return 'Shipped';
  if (lbl.includes('thành công') || lbl.includes('đã giao')) return 'Delivered';
  return 'all';
}

export default function OverviewOperationsCard({ data }) {
  const defaultSteps = [
    { label: 'Đang xử lý', count: 892, color: '#10b981', total: 1248, fulfillmentStatus: 'Processing' },
    { label: 'Đã đóng gói', count: 721, color: '#06b6d4', total: 1248, fulfillmentStatus: 'Packed' },
    { label: 'Đang giao hàng', count: 654, color: '#f59e0b', total: 1248, fulfillmentStatus: 'Shipped' },
    { label: 'Đã giao thành công', count: 602, color: '#8b5cf6', total: 1248, fulfillmentStatus: 'Delivered' },
  ];

  const totalOrders = data?.totalOrders ?? 1248;
  const steps = Array.isArray(data?.steps) && data.steps.length > 0 ? data.steps : defaultSteps;

  return (
    <section className="glass-card operations-summary" aria-label="Tiến độ vận hành">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span className="icon-tile tile-amber" style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '20px' }}>⚡</span>
        </span>
        <div>
          <h2 style={{ fontSize: '17px', margin: 0, fontWeight: '700' }}>Cửa hàng đang vận hành</h2>
          <small style={{ color: '#7a7061' }}>
            <strong>{Number(totalOrders).toLocaleString()}</strong> đơn trong kỳ · bấm từng bước để lọc ngay
          </small>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {steps.map((st, i) => {
          const denom = st.total || totalOrders || 1;
          const ratio = Math.min(100, Math.round(((Number(st.count) || 0) / denom) * 100));
          const fulKey = resolveFulfillmentKey(st);
          const targetHref = fulKey === 'all' ? '/commerce/orders' : `/commerce/orders?fulfillment=${encodeURIComponent(fulKey)}`;

          return (
            <Link
              key={i}
              to={targetHref}
              style={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.58)',
                borderRadius: '10px',
                border: '1px solid rgba(226, 211, 183, 0.7)',
                transition: 'background 0.15s, border-color 0.15s'
              }}
              title={`Xem danh sách đơn hàng ở trạng thái "${st.label}"`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#2b2316' }}>{st.label}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '14px', color: '#2a2216' }}>{Number(st.count || 0).toLocaleString()}</strong>
                  <small style={{ color: '#885600', fontWeight: '700' }}>&rarr;</small>
                </span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#e8dcce', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${ratio}%`, height: '100%', background: st.color || '#10b981', borderRadius: '3px' }} />
              </div>
            </Link>
          );
        })}
      </div>

      <div style={{ marginTop: '14px', textAlign: 'right' }}>
        <Link to="/commerce/orders" className="text-link" style={{ fontSize: '13px', fontWeight: '600' }}>
          Đến trung tâm xử lý đơn &rarr;
        </Link>
      </div>
    </section>
  );
}
