import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState('30');
  const [summary, setSummary] = useState({
    totalRevenue: 68420,
    totalOrders: 1248,
    aov: 54.82,
    grossMargin: '42.8%',
    growthText: '+12.4% so với kỳ trước',
  });
  const [channelData, setChannelData] = useState([
    { channel: 'Website trực tuyến', orders: 524, revenue: 28736, aov: 54.84, growth: '+14.2%' },
    { channel: 'Ứng dụng di động (Mobile App)', orders: 349, revenue: 19158, aov: 54.89, growth: '+8.6%' },
    { channel: 'Sàn thương mại điện tử', orders: 250, revenue: 13684, aov: 54.74, growth: '+5.1%' },
    { channel: 'Bán hàng mạng xã hội (Social)', orders: 125, revenue: 6842, aov: 54.74, growth: '+22.4%' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const loadReports = useCallback(async (rangeVal, toastMessage = null) => {
    setIsLoading(true);
    try {
      const data = await api.getReports(rangeVal);
      if (data) {
        if (Array.isArray(data.channelData)) {
          setChannelData(data.channelData);
        }
        if (data.summary) {
          setSummary(prev => ({ ...prev, ...data.summary }));
        }
      }
      if (toastMessage) {
        showToast(toastMessage);
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải báo cáo phân tích', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadReports(timeRange);
  }, [timeRange, loadReports]);

  const handleRangeSelect = (nextRange, labelToast) => {
    if (nextRange === timeRange) {
      loadReports(nextRange, labelToast);
      return;
    }
    setTimeRange(nextRange);
    showToast(labelToast);
  };

  const handleExport = () => {
    const headers = ['Kênh bán hàng', 'Số đơn hàng', 'Doanh thu ($)', 'Giá trị TB đơn ($)', 'Tăng trưởng'];
    const rows = channelData.map(c => [
      `"${c.channel}"`,
      c.orders,
      Number(c.revenue || 0).toFixed(2),
      Number(c.aov || 0).toFixed(2),
      `"${c.growth}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao_cao_doanh_thu_${timeRange}d_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất báo cáo doanh số chi tiết thành công!');
  };

  const computedRevenue = channelData.reduce((sum, c) => sum + Number(c.revenue || 0), 0);
  const computedOrders = channelData.reduce((sum, c) => sum + Number(c.orders || 0), 0);
  const totalRevenue = summary?.totalRevenue !== undefined ? Number(summary.totalRevenue) : computedRevenue;
  const totalOrders = summary?.totalOrders !== undefined ? Number(summary.totalOrders) : computedOrders;
  const aovDisplay = summary?.aov !== undefined
    ? (typeof summary.aov === 'number' ? `$${summary.aov.toFixed(2)}` : String(summary.aov).startsWith('$') ? summary.aov : `$${summary.aov}`)
    : `$${(totalOrders > 0 ? totalRevenue / totalOrders : 0).toFixed(2)}`;
  const marginDisplay = summary?.grossMargin !== undefined
    ? (typeof summary.grossMargin === 'number' ? `${summary.grossMargin}%` : summary.grossMargin)
    : '42.8%';

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
              disabled={isLoading}
              className={`pill ${timeRange === '7' ? 'active' : ''}`}
              onClick={() => handleRangeSelect('7', 'Đã chuyển xem dữ liệu 7 ngày qua')}
            >
              7 ngày
            </button>
            <button 
              type="button" 
              disabled={isLoading}
              className={`pill ${timeRange === '30' ? 'active' : ''}`}
              onClick={() => handleRangeSelect('30', 'Đã chuyển xem dữ liệu 30 ngày qua')}
            >
              30 ngày
            </button>
            <button 
              type="button" 
              disabled={isLoading}
              className={`pill ${timeRange === '90' ? 'active' : ''}`}
              onClick={() => handleRangeSelect('90', 'Đã chuyển xem dữ liệu quý này')}
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
      <section className="order-summary-grid" style={{ marginBottom: '16px' }}>
        <div className="order-summary-card green">
          <div>
            <small>Tổng doanh số GMV</small>
            <strong>${Number(totalRevenue || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
            <em>{summary?.growthText || '+12.4% so với kỳ trước'}</em>
          </div>
        </div>
        <div className="order-summary-card blue">
          <div>
            <small>Tổng số đơn hàng</small>
            <strong>{Number(totalOrders || 0).toLocaleString()}</strong>
            <em>Kỳ báo cáo {timeRange === '90' ? 'quý này' : `${timeRange} ngày qua`}</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Giá trị đơn trung bình (AOV)</small>
            <strong>{aovDisplay}</strong>
            <em>Trung bình trên mỗi đơn</em>
          </div>
        </div>
        <div className="order-summary-card green">
          <div>
            <small>Biên lợi nhuận gộp</small>
            <strong>{marginDisplay}</strong>
            <em>Rất an toàn & vượt kế hoạch</em>
          </div>
        </div>
      </section>

      {/* Lối tắt chuyển nhanh sang các Báo cáo Chuyên sâu */}
      <section className="glass-card" style={{ padding: '14px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <strong style={{ fontSize: '13px', color: '#2b2316' }}>📊 Chuyển nhanh báo cáo chuyên sâu:</strong>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link to="/commerce/report-orders" className="secondary-button" style={{ textDecoration: 'none', padding: '5px 11px', fontSize: '12px' }}>Đơn hàng</Link>
          <Link to="/commerce/report-products" className="secondary-button" style={{ textDecoration: 'none', padding: '5px 11px', fontSize: '12px' }}>Sản phẩm</Link>
          <Link to="/commerce/report-inventory" className="secondary-button" style={{ textDecoration: 'none', padding: '5px 11px', fontSize: '12px' }}>Tồn kho</Link>
          <Link to="/commerce/report-customers" className="secondary-button" style={{ textDecoration: 'none', padding: '5px 11px', fontSize: '12px' }}>Khách hàng</Link>
          <Link to="/commerce/report-channels" className="secondary-button" style={{ textDecoration: 'none', padding: '5px 11px', fontSize: '12px' }}>Kênh phân phối</Link>
          <Link to="/commerce/report-payments" className="secondary-button" style={{ textDecoration: 'none', padding: '5px 11px', fontSize: '12px' }}>Thanh toán</Link>
          <Link to="/commerce/report-marketing" className="secondary-button" style={{ textDecoration: 'none', padding: '5px 11px', fontSize: '12px' }}>Tiếp thị</Link>
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
                const denom = computedRevenue || totalRevenue || 1;
                const ratio = denom > 0 ? Math.min(100, Math.round((Number(c.revenue || 0) / denom) * 100)) : 0;
                return (
                  <tr key={i}>
                    <td>
                      <strong style={{ fontSize: '14px', color: '#2b2316' }}>{c.channel}</strong>
                    </td>
                    <td>
                      <strong>{c.orders}</strong> đơn
                    </td>
                    <td>
                      <strong style={{ color: '#10b981', fontSize: '14px' }}>${Number(c.revenue || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
                    </td>
                    <td>
                      ${Number(c.aov || 0).toFixed(2)}
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
          <div key={t.id} style={{ background: t.type === 'error' ? '#8a2323' : '#27342b', color: '#fff', padding: '10px 18px', borderRadius: '10px', fontSize: '13px' }}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
