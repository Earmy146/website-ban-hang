import React from 'react';

function formatMoney(val, fallback) {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'number') {
    return `$${val.toLocaleString('en-US', {
      minimumFractionDigits: val % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: 2,
    })}`;
  }
  const str = String(val);
  return str.startsWith('$') ? str : `$${str}`;
}

function formatPercent(val, fallback, withSign = false) {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'number') {
    const prefix = withSign && val > 0 ? '+' : '';
    return `${prefix}${val}%`;
  }
  return String(val);
}

export default function OverviewGmvCard({ data }) {
  const defaultBars = [35, 52, 44, 68, 85, 72, 95, 80, 110, 98, 125, 118];
  const bars = Array.isArray(data?.bars) && data.bars.length > 0 ? data.bars : defaultBars;
  const maxVal = Math.max(...bars.map(v => Number(v) || 0), 1);

  const gmvLabel = formatMoney(data?.gmv, '$68,420');
  const deltaLabel = formatPercent(data?.delta, '+12%', true);
  const isNegative = String(deltaLabel).trim().startsWith('-');
  const conversionLabel = formatPercent(data?.conversionRate, '3.4%');
  const aovLabel = formatMoney(data?.aov, '$54.80');

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
        <strong>{gmvLabel}</strong>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '36px', padding: '4px 0' }}>
          {bars.map((v, i) => (
            <div 
              key={i}
              style={{
                flex: 1,
                background: i === bars.length - 1 ? '#d69e2e' : '#e2d3b7',
                height: `${Math.max(8, Math.round(((Number(v) || 0) / maxVal) * 100))}%`,
                borderRadius: '3px'
              }}
              title={`Mốc ${i + 1}: ${v}`}
            />
          ))}
        </div>
      </div>

      <div className={`sales-delta ${isNegative ? 'negative' : 'positive'}`}>
        <span className="icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
            <path d="M213.66,122.34a8,8,0,0,1,0,11.32l-80,80a8,8,0,0,1-11.32,0l-80-80a8,8,0,0,1,11.32-11.32L120,188.69V40a8,8,0,0,1,16,0V188.69l66.34-66.35A8,8,0,0,1,213.66,122.34Z" transform={isNegative ? undefined : 'rotate(180 128 128)'}></path>
          </svg>
        </span>
        <strong>{deltaLabel}</strong>
        <span>so với kỳ trước</span>
      </div>

      <div className="sales-substats">
        <div>
          <span>Tỷ lệ chuyển đổi</span>
          <strong>{conversionLabel}</strong>
        </div>
        <div>
          <span>Đơn TB (AOV)</span>
          <strong>{aovLabel}</strong>
        </div>
      </div>
    </section>
  );
}
