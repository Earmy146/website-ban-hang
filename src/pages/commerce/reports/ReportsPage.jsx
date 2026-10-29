import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState('30');
  const [channelData, setChannelData] = useState([
    { channel: 'Website trực tuyến', orders: 524, revenue: 28736, aov: 54.84, growth: '+14.2%' },
    { channel: 'Ứng dụng di động (Mobile App)', orders: 349, revenue: 19158, aov: 54.89, growth: '+8.6%' },
    { channel: 'Sàn thương mại điện tử', orders: 250, revenue: 13684, aov: 54.74, growth: '+5.1%' },
    { channel: 'Bán hàng mạng xã hội (Social)', orders: 125, revenue: 6842, aov: 54.74, growth: '+22.4%' }
  ]);

  const [toasts, setToasts] = useState([]);
  const showToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  const handleExport = () => {
    const headers = ['Kênh bán hàng', 'Số đơn hàng', 'Doanh thu ($)', 'Giá trị TB đơn ($)', 'Tăng trưởng'];
    const rows = channelData.map(c => [
      `"${c.channel}"`,
      c.orders,
      c.revenue.toFixed(2),
      c.aov.toFixed(2),
      `"${c.growth}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao_cao_doanh_thu_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất báo cáo doanh số chi tiết thành công!');
  };

  const totalRevenue = channelData.reduce((sum, c) => sum + c.revenue, 0);
  const totalOrders = channelData.reduce((sum, c) => sum + c.orders, 0);

  return (
    <div className="reports-page" style={{ paddingBottom: '36px' }}>
      <header className="commerce-heading">
        <div>
          <div className="commerce-breadcrumb">
            <Link to="/overview">Tổng quan</Link>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </span>
            <span>Báo cáo thống kê</span>
          </div>
          <h1>Báo cáo & Phân tích<span>.</span></h1>
        </div>

        <div className="commerce-heading-actions">
          <div className="range-picker" style={{ display: 'inline-flex', gap: '4px' }}>
            <button 
              type="button" 
              className={`pill ${timeRange === '7' ? 'active' : ''}`}
              onClick={() => { setTimeRange('7'); showToast('Đã chuyển xem dữ liệu 7 ngày qua'); }}
            >
              7 ngày
            </button>
            <button 
              type="button" 
              className={`pill ${timeRange === '30' ? 'active' : ''}`}
              onClick={() => { setTimeRange('30'); showToast('Đã chuyển xem dữ liệu 30 ngày qua'); }}
            >
              30 ngày
            </button>
            <button 
              type="button" 
              className={`pill ${timeRange === '90' ? 'active' : ''}`}
              onClick={() => { setTimeRange('90'); showToast('Đã chuyển xem dữ liệu quý này'); }}
            >
              Quý này
            </button>
          </div>

          <button type="button" className="secondary-button" onClick={handleExport}>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z"></path>
              </svg>
            </span>
            Xuất file báo cáo
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="order-summary-grid" style={{ marginBottom: '20px' }}>
        <div className="order-summary-card green">
          <div>
            <small>Tổng doanh số GMV</small>
            <strong>${totalRevenue.toLocaleString()}</strong>
            <em>+12.4% so với kỳ trước</em>
          </div>
        </div>
        <div className="order-summary-card blue">
          <div>
            <small>Tổng số đơn hàng</small>
            <strong>{totalOrders.toLocaleString()}</strong>
            <em>Tỷ lệ chuyển đổi đạt 3.42%</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Giá trị đơn trung bình (AOV)</small>
            <strong>$54.82</strong>
            <em>Tăng $3.20 trên mỗi đơn</em>
          </div>
        </div>
        <div className="order-summary-card green">
          <div>
            <small>Biên lợi nhuận gộp</small>
            <strong>42.8%</strong>
            <em>Rất an toàn & vượt kế hoạch</em>
          </div>
        </div>
      </section>

      {/* Bảng báo cáo theo kênh */}
      <section className="glass-card c-resource">
        <div className="product-list-heading">
          <div>
            <span>HIỆU SUẤT KINH DOANH</span>
            <h2>Hiệu quả phân phối theo kênh</h2>
            <p>Doanh thu, số lượng đơn hàng và tăng trưởng đóng góp từ từng nguồn.</p>
          </div>
          <small>{channelData.length} kênh bán hàng</small>
        </div>

        <div className="table-scroll c-table-scroll" tabIndex="0" role="region" aria-label="Bảng báo cáo kênh">
          <table className="c-table">
            <thead>
              <tr>
                <th>Kênh bán hàng</th>
                <th>Số đơn đã chốt</th>
                <th>Tổng doanh thu</th>
                <th>Giá trị TB (AOV)</th>
                <th>Tỷ trọng đóng góp</th>
                <th>Tốc độ tăng trưởng</th>
              </tr>
            </thead>
            <tbody>
              {channelData.map((c, i) => {
                const ratio = Math.round((c.revenue / totalRevenue) * 100);
                return (
                  <tr key={i}>
                    <td>
                      <strong style={{ fontSize: '14px', color: '#2b2316' }}>{c.channel}</strong>
                    </td>
                    <td>
                      <strong>{c.orders}</strong> đơn
                    </td>
                    <td>
                      <strong style={{ color: '#10b981', fontSize: '14px' }}>${c.revenue.toLocaleString()}</strong>
                    </td>
                    <td>
                      ${c.aov.toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '6px', background: '#e2d3be', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${ratio}%`, height: '100%', background: '#d69e2e', borderRadius: '3px' }} />
                        </div>
                        <small style={{ fontWeight: '700' }}>{ratio}%</small>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-green" style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '4px' }}>
                        {c.growth}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Toasts */}
      <div className="toasts-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: '#27342b', color: '#fff', padding: '10px 18px', borderRadius: '10px', fontSize: '13px' }}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
