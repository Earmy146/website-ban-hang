import React from 'react';

export default function OverviewGmvCard() {
  const bars = [35, 52, 44, 68, 85, 72, 95, 80, 110, 98, 125, 118];
  const maxVal = Math.max(...bars);

  return (
    <section className="glass-card sales-summary" aria-label="Tổng doanh số">
      <div className="sales-label">
        <span className="icon-tile tile-amber">
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M230.14,58.87A8,8,0,0,0,224,56H62.68L56.6,22.57A8,8,0,0,0,48.73,16H24a8,8,0,0,0,0,16h18L67.56,172.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,160,204a28,28,0,1,0,28-28H91.17a8,8,0,0,1-7.87-6.57L80.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,230.14,58.87ZM104,204a12,12,0,1,1-12-12A12,12,0,0,1,104,204Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,200,204Zm4-74.57A8,8,0,0,1,196.1,136H77.22L65.59,72H214.41Z"></path>
            </svg>
          </span>
        </span>
        <h2>Tổng doanh số <span>(GMV)</span></h2>
        <span className="sales-live">
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1-8-8V48a8,8,0,0,1,16,0V156.69l50.34-50.35a8,8,0,0,1,11.32,0L128,132.69,180.69,80H160a8,8,0,0,1,0-16h40a8,8,0,0,1,8,8v40a8,8,0,0,1-16,0V91.31l-58.34,58.35a8,8,0,0,1-11.32,0L96,123.31l-56,56V200H224A8,8,0,0,1,232,208Z"></path>
            </svg>
          </span>
        </span>
      </div>

      <div className="sales-total">
        <strong>$68,420</strong>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '36px', padding: '4px 0' }}>
          {bars.map((v, i) => (
            <div 
              key={i}
              style={{
                flex: 1,
                background: i === bars.length - 1 ? '#d69e2e' : '#e2d3b7',
                height: `${Math.round((v / maxVal) * 100)}%`,
                borderRadius: '3px'
              }}
              title={`Tuần ${i + 1}: $${v * 100}`}
            />
          ))}
        </div>
      </div>

      <div className="sales-delta positive">
        <span className="icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
            <path d="M213.66,122.34a8,8,0,0,1,0,11.32l-80,80a8,8,0,0,1-11.32,0l-80-80a8,8,0,0,1,11.32-11.32L120,188.69V40a8,8,0,0,1,16,0V188.69l66.34-66.35A8,8,0,0,1,213.66,122.34Z" transform="rotate(180 128 128)"></path>
          </svg>
        </span>
        <strong>+12%</strong>
        <span>so với kỳ trước</span>
      </div>

      <div className="sales-substats">
        <div>
          <span>Tỷ lệ chuyển đổi</span>
          <strong>3.4%</strong>
        </div>
        <div>
          <span>Đơn TB (AOV)</span>
          <strong>$54.80</strong>
        </div>
      </div>
    </section>
  );
}

