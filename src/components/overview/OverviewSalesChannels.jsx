import React from 'react';
import { Link } from 'react-router-dom';

export default function OverviewSalesChannels({ channels: propChannels }) {
  const defaultChannels = [
    { name: 'Website trực tuyến', percent: 42, revenue: '$28,736', color: '#10b981', icon: '🌐' },
    { name: 'Ứng dụng di động', percent: 28, revenue: '$19,158', color: '#3b82f6', icon: '📱' },
    { name: 'Sàn thương mại', percent: 20, revenue: '$13,684', color: '#f59e0b', icon: '🏬' },
    { name: 'Mạng xã hội (Social)', percent: 10, revenue: '$6,842', color: '#8b5cf6', icon: '💬' }
  ];

  const channels = Array.isArray(propChannels) && propChannels.length > 0 ? propChannels : defaultChannels;

  return (
    <section className="glass-card channels-card" aria-label="Kênh phân phối">
      <div className="card-heading">
        <div>
          <h2>Kênh phân phối</h2>
          <small>Bấm vào kênh bán để xem báo cáo phân tích chuyên sâu</small>
        </div>
        <Link to="/commerce/report-channels" className="text-link">
          Báo cáo kênh &rarr;
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
        {channels.map((ch, idx) => {
          const revLabel = typeof ch.revenue === 'number'
            ? `$${ch.revenue.toLocaleString()}`
            : String(ch.revenue || '$0').startsWith('$')
              ? ch.revenue
              : `$${ch.revenue}`;

          return (
            <Link
              key={idx}
              to={`/commerce/report-channels?channel=${encodeURIComponent(ch.name || '')}`}
              style={{
                display: 'block',
                textDecoration: 'none',
                color: 'inherit',
                padding: '9px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.55)',
                border: '1px solid rgba(232, 220, 200, 0.7)'
              }}
              title={`Xem phân tích doanh thu kênh ${ch.name}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '13px' }}>
                <span style={{ fontWeight: '600', color: '#352e22', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{ch.icon || '🏬'}</span> {ch.name}
                </span>
                <span>
                  <strong style={{ color: '#276840', marginRight: '6px' }}>{revLabel}</strong>
                  <small style={{ color: '#7a7061' }}>({ch.percent}%) &rarr;</small>
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#ece1ce', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{
                    width: `${Math.min(100, Number(ch.percent) || 0)}%`,
                    height: '100%',
                    background: ch.color || '#10b981',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
