import React from 'react';

export default function OverviewSalesChannels() {
  const channels = [
    { name: 'Website trực tuyến', percent: 42, revenue: '$28,736', color: '#10b981', icon: '🌐' },
    { name: 'Ứng dụng di động', percent: 28, revenue: '$19,158', color: '#3b82f6', icon: '📱' },
    { name: 'Sàn thương mại', percent: 20, revenue: '$13,684', color: '#f59e0b', icon: '🏬' },
    { name: 'Mạng xã hội (Social)', percent: 10, revenue: '$6,842', color: '#8b5cf6', icon: '💬' }
  ];

  return (
    <section className="glass-card channels-card" aria-label="Kênh phân phối">
      <div className="card-heading">
        <div>
          <h2>Kênh phân phối</h2>
          <small>Tỷ trọng doanh số theo nền tảng bán</small>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
        {channels.map((ch, idx) => (
          <div key={idx}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '13px' }}>
              <span style={{ fontWeight: '600', color: '#352e22', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{ch.icon}</span> {ch.name}
              </span>
              <span>
                <strong style={{ color: '#276840', marginRight: '8px' }}>{ch.revenue}</strong>
                <small style={{ color: '#7a7061' }}>({ch.percent}%)</small>
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#ece1ce', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{
                  width: `${ch.percent}%`,
                  height: '100%',
                  background: ch.color,
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

