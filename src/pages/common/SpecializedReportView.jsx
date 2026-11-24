import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../../services/api';
import { REPORT_METADATA } from './moduleCatalog';
import { PageHeader, QuickGuideBanner, ToastStack, useToast, exportCsvFile } from './commonWidgets';

const REPORT_NAV_LINKS = [
  { slug: 'report-sales', label: '💰 Doanh số' },
  { slug: 'report-orders', label: '📦 Đơn hàng' },
  { slug: 'report-products', label: '👕 Sản phẩm' },
  { slug: 'report-inventory', label: '🏭 Tồn kho' },
  { slug: 'report-customers', label: '👥 Khách hàng' },
  { slug: 'report-channels', label: '🌐 Kênh bán' },
  { slug: 'report-payments', label: '💳 Thanh toán' },
  { slug: 'report-vendors', label: '🏬 Người bán' },
  { slug: 'report-marketing', label: '🎟️ Tiếp thị' },
  { slug: 'report-returns', label: '↩️ Trả hàng' },
];

const BAR_PALETTE = ['#27342b', '#b87d14', '#1d4ed8', '#059669', '#7c3aed', '#b45309'];

export default function SpecializedReportView({ slug, navInfo }) {
  const meta = useMemo(() => {
    return (
      REPORT_METADATA[slug] || {
        reportType: slug.replace(/^report-/, '') || 'sales',
        subtitle: `Phân tích số liệu chuyên sâu cho ${navInfo.title.toLowerCase()}.`,
        chartTitle: `Biểu đồ phân bổ ${navInfo.title.toLowerCase()}`,
        tableTitle: `Bảng dữ liệu chi tiết ${navInfo.title.toLowerCase()}`,
        colHeaders: ['Hạng mục', 'Chỉ số chính', 'Giá trị quy đổi', 'Chi tiết phụ', 'Đánh giá', 'Tỷ trọng'],
        kpiLabels: ['Tổng doanh thu', 'Tổng khối lượng', 'Giá trị trung bình', 'Hiệu suất'],
      }
    );
  }, [slug, navInfo.title]);

  const [timeRange, setTimeRange] = useState('30');
  const [reportData, setReportData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { toasts, showToast } = useToast();

  const loadReport = useCallback(
    async (rangeVal, toastMsg = null) => {
      setIsLoading(true);
      try {
        const data = await request(
          `/reports?range=${encodeURIComponent(rangeVal)}&type=${encodeURIComponent(meta.reportType)}`
        );
        if (data && typeof data === 'object') {
          setReportData(data);
        }
        if (toastMsg) showToast(toastMsg);
      } catch (err) {
        showToast(err.message || 'Không thể tải dữ liệu báo cáo phân tích', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [meta.reportType, showToast]
  );

  useEffect(() => {
    setSearchTerm('');
    loadReport(timeRange);
  }, [slug, timeRange, loadReport]);

  const handleRangeChange = (nextRange, label) => {
    if (nextRange === timeRange) {
      loadReport(nextRange, `Đã làm mới báo cáo (${label})`);
      return;
    }
    setTimeRange(nextRange);
    showToast(`Đã chuyển kỳ phân tích sang ${label}`);
  };

  const kpiCards = useMemo(() => {
    const serverKpis = reportData?.summary?.kpis;
    if (Array.isArray(serverKpis) && serverKpis.length >= 4) {
      return serverKpis.slice(0, 4);
    }
    const sum = reportData?.summary || {};
    return [
      {
        label: meta.kpiLabels[0],
        value: `$${Number(sum.totalRevenue || 68420).toLocaleString('en-US')}`,
        subtext: sum.growthText || '+12.4% so với kỳ trước',
        tone: 'green',
      },
      {
        label: meta.kpiLabels[1],
        value: Number(sum.totalOrders || 1248).toLocaleString('en-US'),
        subtext: `Kỳ ${timeRange} ngày gần nhất`,
        tone: 'blue',
      },
      {
        label: meta.kpiLabels[2],
        value: `$${Number(sum.aov || 54.82).toFixed(2)}`,
        subtext: 'Trung bình toàn hệ thống',
        tone: 'amber',
      },
      {
        label: meta.kpiLabels[3],
        value: String(sum.grossMargin || '43.2%'),
        subtext: 'Đạt chuẩn hiệu quả vận hành',
        tone: 'purple',
      },
    ];
  }, [reportData, meta.kpiLabels, timeRange]);

  const rows = useMemo(() => {
    const rawRows = Array.isArray(reportData?.breakdownRows) ? reportData.breakdownRows : [];
    if (!searchTerm.trim()) return rawRows;
    const q = searchTerm.toLowerCase();
    return rawRows.filter((r) =>
      `${r.name || ''} ${r.metric1 || ''} ${r.metric2 || ''} ${r.metric3 || ''} ${r.badge || ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [reportData, searchTerm]);

  const columns = useMemo(() => {
    if (Array.isArray(reportData?.columns) && reportData.columns.length >= 5) {
      return [...reportData.columns.slice(0, 5), 'Tỷ trọng / Hiệu suất'];
    }
    return meta.colHeaders;
  }, [reportData, meta.colHeaders]);

  const handleExportCsv = () => {
    const csvRows = rows.map((r) => [
      r.name || '',
      r.metric1 || '',
      r.metric2 || '',
      r.metric3 || '',
      r.badge || '',
      `${r.ratio ?? 0}%`,
    ]);
    exportCsvFile(
      `bao_cao_${meta.reportType}_${timeRange}ngay_${new Date().toISOString().slice(0, 10)}.csv`,
      columns,
      csvRows
    );
    showToast(`Đã xuất file CSV "${navInfo.title}" (${timeRange} ngày) thành công!`);
  };

  return (
    <div className="general-commerce-page" style={{ paddingBottom: '40px' }}>
      <PageHeader navInfo={navInfo} subtitle={meta.subtitle}>
        <div className="range-picker" style={{ display: 'inline-flex', gap: '4px' }}>
          <button
            type="button"
            disabled={isLoading}
            className={`pill ${timeRange === '7' ? 'active' : ''}`}
            onClick={() => handleRangeChange('7', '7 ngày qua')}
          >
            7 ngày
          </button>
          <button
            type="button"
            disabled={isLoading}
            className={`pill ${timeRange === '30' ? 'active' : ''}`}
            onClick={() => handleRangeChange('30', '30 ngày qua')}
          >
            30 ngày
          </button>
          <button
            type="button"
            disabled={isLoading}
            className={`pill ${timeRange === '90' ? 'active' : ''}`}
            onClick={() => handleRangeChange('90', '90 ngày qua')}
          >
            90 ngày
          </button>
        </div>

        <button type="button" className="primary-button" onClick={handleExportCsv}>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z"></path>
            </svg>
          </span>
          Xuất báo cáo CSV
        </button>
      </PageHeader>

      <QuickGuideBanner
        icon="📊"
        title="Cách đọc & trích xuất Báo cáo phân tích:"
        steps={[
          'Chọn kỳ 7 ngày / 30 ngày / 90 ngày ở góc phải trên để so sánh biến động',
          'Chuyển nhanh giữa 10 góc nhìn báo cáo bằng dải nút bên dưới',
          'Bấm "Xuất báo cáo CSV" để tải bảng số liệu về mở trên Excel / Google Sheets',
        ]}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
        {REPORT_NAV_LINKS.map((item) => {
          const active = slug === item.slug;
          return (
            <Link
              key={item.slug}
              to={`/commerce/${item.slug}`}
              className={`pill ${active ? 'active' : ''}`}
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '12.5px',
                fontWeight: active ? 750 : 600,
                background: active ? '#27342b' : '#fffdf9',
                color: active ? '#ffffff' : '#4a3f30',
                border: active ? '1px solid #27342b' : '1px solid #d8ccb8',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* 4 THẺ KPI TỔNG HỢP */}
      <section className="order-summary-grid" style={{ marginBottom: '20px' }}>
        {kpiCards.map((kpi, idx) => (
          <div
            key={idx}
            className={`order-summary-card ${kpi.tone || (idx === 0 ? 'green' : idx === 1 ? 'blue' : idx === 2 ? 'amber' : 'purple')}`}
          >
            <div>
              <small>{kpi.label}</small>
              <strong>{kpi.value}</strong>
              <em>{kpi.subtext}</em>
            </div>
          </div>
        ))}
      </section>

      {/* BIỂU ĐỒ THANH NGANG TRỰC QUAN */}
      <section className="glass-card" style={{ padding: '22px 24px', marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#8a5a00', letterSpacing: '0.7px' }}>
              TRỰC QUAN HÓA DỮ LIỆU ({timeRange} NGÀY QUA)
            </span>
            <h2 style={{ margin: '2px 0 0 0', fontSize: '17.5px', fontWeight: 750, color: '#272016' }}>
              {meta.chartTitle}
            </h2>
          </div>
          <small style={{ color: '#6e6353' }}>
            {isLoading ? 'Đang cập nhật số liệu thực...' : `Tổng hợp từ ${rows.length} nhóm chỉ số`}
          </small>
        </div>

        {rows.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#776c5b', fontSize: '13.5px' }}>
            Chưa có dữ liệu biểu đồ cho bộ lọc hiện tại.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
            {rows.slice(0, 7).map((row, idx) => {
              const barWidth = Math.max(6, Math.min(100, Number(row.ratio) || 25));
              const barColor = BAR_PALETTE[idx % BAR_PALETTE.length];
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', gap: '12px' }}>
                    <strong style={{ color: '#272016', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.name}
                    </strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <span style={{ color: '#6b6050' }}>{row.metric1}</span>
                      <strong style={{ color: '#059669' }}>{row.metric2}</strong>
                      <span style={{ fontWeight: 700, minWidth: '38px', textAlign: 'right' }}>{barWidth}%</span>
                    </div>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '10px',
                      background: '#ebe1cf',
                      borderRadius: '999px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${barWidth}%`,
                        height: '100%',
                        background: barColor,
                        borderRadius: '999px',
                        transition: 'width 0.35s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* BẢNG PHÂN TÍCH CHI TIẾT */}
      <section className="glass-card c-resource">
        <div
          className="product-list-heading"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}
        >
          <div>
            <span>PHÂN TÍCH CHI TIẾT</span>
            <h2>{meta.tableTitle}</h2>
          </div>

          <label className="c-search" style={{ maxWidth: '300px' }}>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </span>
            <input
              type="search"
              placeholder="Lọc nhanh dòng phân tích..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Lọc bảng báo cáo"
            />
          </label>
        </div>

        <div className="table-scroll c-table-scroll" tabIndex="0" role="region" aria-label={meta.tableTitle}>
          <table className="c-table">
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={i}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px 20px', color: '#776c5b' }}>
                    Không có dòng số liệu nào phù hợp.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => {
                  const pct = Math.max(4, Math.min(100, Number(r.ratio) || 20));
                  return (
                    <tr key={i}>
                      <td>
                        <strong style={{ fontSize: '13.5px', color: '#272016' }}>{r.name}</strong>
                      </td>
                      <td>
                        <strong>{r.metric1}</strong>
                      </td>
                      <td>
                        <strong style={{ color: '#059669' }}>{r.metric2}</strong>
                      </td>
                      <td>
                        <span style={{ color: '#5c5243', fontSize: '13px' }}>{r.metric3}</span>
                      </td>
                      <td>
                        <span
                          className={`badge badge-${r.badgeClass || 'green'}`}
                          style={{ fontSize: '12px', padding: '3px 9px', borderRadius: '6px' }}
                        >
                          {r.badge || 'Ổn định'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '76px',
                              height: '6px',
                              background: '#e5dac6',
                              borderRadius: '999px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: '#b87d14',
                                borderRadius: '999px',
                              }}
                            />
                          </div>
                          <small style={{ fontWeight: 700 }}>{pct}%</small>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ToastStack toasts={toasts} />
    </div>
  );
}
