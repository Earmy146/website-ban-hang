import React, { useState } from 'react';

export default function OverviewRevenueChart() {
  const [activeRange, setActiveRange] = useState('30');

  // Mẫu dữ liệu đường cong doanh thu
  const points = [
    { label: '01 Th4', val1: 42, val2: 30 },
    { label: '05 Th4', val1: 58, val2: 45 },
    { label: '10 Th4', val1: 52, val2: 50 },
    { label: '15 Th4', val1: 75, val2: 60 },
    { label: '20 Th4', val1: 68, val2: 65 },
    { label: '25 Th4', val1: 92, val2: 70 },
    { label: '30 Th4', val1: 110, val2: 85 },
  ];

  const maxVal = 120;
  const width = 360;
  const height = 160;

  // Tính tọa độ SVG polyline
  const makePoints = (key) => {
    return points.map((p, i) => {
      const x = (i / (points.length - 1)) * (width - 40) + 20;
      const y = height - (p[key] / maxVal) * (height - 30) - 15;
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <section className="glass-card revenue-card" aria-label="Biểu đồ doanh thu">
      <div className="card-heading">
        <div>
          <h2>Xu hướng doanh thu</h2>
          <div className="chart-legend">
            <span className="legend-dot current"></span>
            <small>Kỳ này</small>
            <span className="legend-dot previous" style={{ background: '#bda688', marginLeft: '12px' }}></span>
            <small>Kỳ trước</small>
          </div>
        </div>

        <div className="range-picker">
          <button 
            type="button" 
            className={`pill ${activeRange === '7' ? 'active' : ''}`}
            onClick={() => setActiveRange('7')}
          >
            7 ngày
          </button>
          <button 
            type="button" 
            className={`pill ${activeRange === '30' ? 'active' : ''}`}
            onClick={() => setActiveRange('30')}
          >
            30 ngày
          </button>
        </div>
      </div>

      <div style={{ marginTop: '16px', position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          {/* Lưới ngang mờ */}
          <line x1="20" y1="20" x2={width - 20} y2="20" stroke="#000" strokeOpacity="0.05" strokeDasharray="3 3" />
          <line x1="20" y1="75" x2={width - 20} y2="75" stroke="#000" strokeOpacity="0.05" strokeDasharray="3 3" />
          <line x1="20" y1="130" x2={width - 20} y2="130" stroke="#000" strokeOpacity="0.05" strokeDasharray="3 3" />

          {/* Đường kỳ trước */}
          <polyline
            fill="none"
            stroke="#c8b598"
            strokeWidth="2.5"
            strokeDasharray="4 4"
            points={makePoints('val2')}
          />

          {/* Đường kỳ này */}
          <polyline
            fill="none"
            stroke="#d49c28"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={makePoints('val1')}
          />

          {/* Các chấm mốc */}
          {points.map((p, i) => {
            const x = (i / (points.length - 1)) * (width - 40) + 20;
            const y = height - (p.val1 / maxVal) * (height - 30) - 15;
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="4.5"
                fill="#ffffff"
                stroke="#d49c28"
                strokeWidth="2.5"
              />
            );
          })}
        </svg>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginTop: '8px' }}>
          {points.map((p, i) => (
            <small key={i} style={{ fontSize: '11px', color: '#887d6d' }}>
              {p.label}
            </small>
          ))}
        </div>
      </div>
    </section>
  );
}

