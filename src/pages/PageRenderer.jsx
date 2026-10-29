import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import pagesContent from '../data/pages-content.json';
import DialogModal from '../components/ui/DialogModal';

export default function PageRenderer() {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  let path = location.pathname;
  if (path === '/') path = '/overview';

  const pageData = pagesContent[path] || pagesContent['/overview'];

  // Quản lý Modal tương tác
  const [activeModal, setActiveModal] = useState(null); // { type, title, data, wide } | null
  
  // Quản lý Toast thông báo
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  // Cập nhật Document Title
  useEffect(() => {
    if (pageData?.title) {
      document.title = pageData.title;
    }
  }, [pageData]);

  // Intercept tất cả các sự kiện tương tác Click (Links, Buttons, Tabs, Modals, Pagination)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleClick(e) {
      // 1. Xử lý Thẻ <a> điều hướng nội bộ SPA
      const link = e.target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        if (href && (href.startsWith('/') || href.startsWith(window.location.origin))) {
          e.preventDefault();
          const targetPath = href.replace(window.location.origin, '');
          navigate(targetPath);
          return;
        }
      }

      // 2. Xử lý các Button có data-action
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        const id = actionBtn.dataset.id;

        switch (action) {
          case 'assistant':
            setActiveModal({
              type: 'assistant',
              title: 'Trợ lý AI Veylix (AI Assistant)',
              wide: true
            });
            break;

          case 'reports':
            setActiveModal({
              type: 'reports',
              title: 'Báo cáo hiệu suất kinh doanh',
              wide: true
            });
            break;

          case 'revenue':
            setActiveModal({
              type: 'revenue',
              title: 'Chi tiết xu hướng doanh thu',
              wide: true
            });
            break;

          case 'shipments':
            setActiveModal({
              type: 'shipments',
              title: 'Hoạt động vận chuyển trực tiếp',
              wide: true
            });
            break;

          case 'channels':
            setActiveModal({
              type: 'channels',
              title: 'Doanh số theo kênh bán hàng'
            });
            break;

          case 'regions':
            setActiveModal({
              type: 'regions',
              title: 'Khu vực mua sắm hàng đầu'
            });
            break;

          case 'add-product':
          case 'new-product':
            setActiveModal({
              type: 'add-product',
              title: 'Thêm sản phẩm mới'
            });
            break;

          case 'order':
            setActiveModal({
              type: 'order',
              title: `Chi tiết đơn hàng #${id || 'VX83291'}`,
              data: { id: id || 'VX83291' }
            });
            break;

          case 'product':
            setActiveModal({
              type: 'product',
              title: `Chi tiết sản phẩm: ${id || 'Sản phẩm'}`,
              data: { id }
            });
            break;

          case 'export':
          case 'export-sales':
            showToast('✓ Đang xuất file dữ liệu CSV thành công!');
            break;

          case 'restock':
            showToast('✓ Đã tạo lệnh nhập bổ sung hàng vào kho!');
            break;

          case 'filter':
            const filterBar = container.querySelector('.table-filters, .filter-bar, .c-filter-bar');
            if (filterBar) {
              filterBar.classList.toggle('open');
            }
            break;

          default:
            // Hiển thị toast thông báo phản hồi thao tác
            if (action.includes('delete') || action.includes('remove')) {
              showToast('✓ Đã xóa mục thành công!', 'info');
            } else if (action.includes('save') || action.includes('submit')) {
              showToast('✓ Đã lưu thay đổi thành công!');
            }
            break;
        }
        return;
      }

      // 3. Xử lý Chuyển Tab (Role="tab" hoặc Tab buttons)
      const tabBtn = e.target.closest('[role="tab"], .tab-item');
      if (tabBtn) {
        const tabList = tabBtn.closest('[role="tablist"], .tabs-nav, .tab-group');
        if (tabList) {
          tabList.querySelectorAll('[role="tab"], .tab-item').forEach(t => {
            t.setAttribute('aria-selected', 'false');
            t.classList.remove('active');
          });
          tabBtn.setAttribute('aria-selected', 'true');
          tabBtn.classList.add('active');

          const tabText = tabBtn.textContent.trim().toLowerCase();
          // Lọc các hàng trong bảng nếu có
          const rows = container.querySelectorAll('tbody tr, .data-row');
          if (rows.length > 0 && !tabText.includes('tất cả') && !tabText.includes('all')) {
            rows.forEach((row, idx) => {
              if (idx % 2 === 0) row.style.display = '';
              else row.style.display = 'none';
            });
          } else {
            rows.forEach(row => row.style.display = '');
          }
        }
        return;
      }

      // 4. Xử lý Phân trang (Pagination buttons)
      const pageBtn = e.target.closest('[data-page-kind], .dashboard-pagination button');
      if (pageBtn && !pageBtn.disabled) {
        const parentNav = pageBtn.closest('nav');
        if (parentNav) {
          parentNav.querySelectorAll('button').forEach(b => b.removeAttribute('aria-current'));
          pageBtn.setAttribute('aria-current', 'page');
          showToast(`Chuyển đến trang ${pageBtn.textContent.trim() || 'kế tiếp'}`);
        }
        return;
      }
    }

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [navigate]);

  // Khởi tạo Canvas Charts nếu có trên trang (ví dụ Overview)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Mini Sales Chart
    const salesCanvas = container.querySelector('canvas[data-chart="sales"]');
    if (salesCanvas) {
      const ctx = salesCanvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const width = salesCanvas.clientWidth || 120;
      const height = salesCanvas.clientHeight || 42;
      salesCanvas.width = width * dpr;
      salesCanvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      const data = [35, 45, 30, 65, 50, 85, 95, 75, 90, 100];
      const barWidth = 6;
      const gap = (width - data.length * barWidth) / (data.length - 1);

      data.forEach((val, i) => {
        const barHeight = (val / 100) * (height - 6);
        const x = i * (barWidth + gap);
        const y = height - barHeight;

        ctx.fillStyle = i === data.length - 1 ? '#b45309' : '#d97706aa';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
        ctx.fill();
      });
    }

    // Revenue Trend Chart
    const revenueCanvas = container.querySelector('canvas[data-chart="revenue"]');
    if (revenueCanvas) {
      const ctx = revenueCanvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const width = revenueCanvas.clientWidth || 600;
      const height = revenueCanvas.clientHeight || 220;
      revenueCanvas.width = width * dpr;
      revenueCanvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      const thisPeriod = [24, 28, 35, 42, 38, 55, 62, 58, 72, 80, 88, 95];
      const lastPeriod = [20, 22, 28, 30, 32, 40, 45, 42, 50, 56, 60, 68];

      const drawLine = (data, strokeColor, fillColor) => {
        ctx.beginPath();
        const stepX = width / (data.length - 1);
        data.forEach((val, i) => {
          const x = i * stepX;
          const y = height - 20 - (val / 100) * (height - 40);
          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevX = (i - 1) * stepX;
            const prevY = height - 20 - (data[i - 1] / 100) * (height - 40);
            const cpX = (prevX + x) / 2;
            ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
          }
        });

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        if (fillColor) {
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();
          ctx.fillStyle = fillColor;
          ctx.fill();
        }
      };

      // Draw Last period line (màu xám nhạt)
      drawLine(lastPeriod, '#9ca3af', 'rgba(156, 163, 175, 0.08)');

      // Draw This period line (Amber gradient)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(217, 119, 6, 0.25)');
      gradient.addColorStop(1, 'rgba(217, 119, 6, 0.0)');
      drawLine(thisPeriod, '#d97706', gradient);
    }
  }, [path, pageData]);

  return (
    <>
      <div 
        ref={containerRef}
        style={{ display: 'contents' }}
        dangerouslySetInnerHTML={{ __html: pageData.mainHtml }} 
      />

      {/* Dialog Modal Phản hồi tương tác */}
      <DialogModal
        isOpen={Boolean(activeModal)}
        title={activeModal?.title || ''}
        wide={activeModal?.wide}
        onClose={() => setActiveModal(null)}
      >
        {activeModal?.type === 'assistant' && (
          <div>
            <p style={{ color: '#685947', fontSize: '13px', marginBottom: '14px' }}>
              Trợ lý thông minh phân tích số liệu bán hàng, tồn kho và đề xuất chiến lược tối ưu doanh số.
            </p>
            <div style={{ backgroundColor: '#f9f5ed', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
              <strong style={{ fontSize: '13px', display: 'block', marginBottom: '6px' }}>💡 Gợi ý thao tác:</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button 
                  type="button" 
                  onClick={() => showToast('Đang phân tích các mặt hàng bán chậm...')}
                  style={{ textAlign: 'left', padding: '8px 12px', background: '#fff', border: '1px solid #e8decb', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                >
                  → Phân tích các sản phẩm có nguy cơ hết hàng tuần tới
                </button>
                <button 
                  type="button" 
                  onClick={() => showToast('Đang tạo báo cáo so sánh doanh thu các kênh...')}
                  style={{ textAlign: 'left', padding: '8px 12px', background: '#fff', border: '1px solid #e8decb', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                >
                  → So sánh tỷ lệ chuyển đổi giữa Website và Sàn TMĐT
                </button>
                <button 
                  type="button" 
                  onClick={() => showToast('Đang soạn thảo email tri ân khách hàng VIP...')}
                  style={{ textAlign: 'left', padding: '8px 12px', background: '#fff', border: '1px solid #e8decb', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                >
                  → Đề xuất chiến dịch ưu đãi cho nhóm khách hàng thân thiết
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                placeholder="Nhập câu hỏi hoặc yêu cầu cho AI..." 
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #d4c7b2', outline: 'none', fontSize: '13px' }}
              />
              <button 
                type="button"
                onClick={() => showToast('✓ Trợ lý AI đang phản hồi...')}
                style={{ padding: '10px 18px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                Gửi
              </button>
            </div>
          </div>
        )}

        {activeModal?.type === 'reports' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '18px' }}>
              <div style={{ padding: '12px', background: '#f7f2ea', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: '#685947' }}>Tổng doanh số GMV</span>
                <strong style={{ display: 'block', fontSize: '18px', marginTop: '4px' }}>$124,592.00</strong>
              </div>
              <div style={{ padding: '12px', background: '#f7f2ea', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: '#685947' }}>Tổng đơn hàng</span>
                <strong style={{ display: 'block', fontSize: '18px', marginTop: '4px' }}>1,248 đơn</strong>
              </div>
              <div style={{ padding: '12px', background: '#f7f2ea', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: '#685947' }}>Tăng trưởng</span>
                <strong style={{ display: 'block', fontSize: '18px', color: '#25975d', marginTop: '4px' }}>+12.6%</strong>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button"
                onClick={() => {
                  showToast('✓ Đã xuất báo cáo chi tiết thành công!');
                  setActiveModal(null);
                }}
                style={{ padding: '9px 16px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                Xuất file CSV báo cáo
              </button>
            </div>
          </div>
        )}

        {activeModal?.type === 'revenue' && (
          <div>
            <p style={{ color: '#685947', fontSize: '13px', marginBottom: '12px' }}>
              Bảng đối chiếu doanh thu theo chu kỳ (Đơn vị: nghìn USD):
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e8decb', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Mẫu thống kê</th>
                  <th style={{ padding: '8px' }}>Kỳ này ($K)</th>
                  <th style={{ padding: '8px' }}>Kỳ trước ($K)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f2ece1' }}><td style={{ padding: '8px' }}>Tuần 1</td><td style={{ padding: '8px' }}>$24.5</td><td style={{ padding: '8px' }}>$20.1</td></tr>
                <tr style={{ borderBottom: '1px solid #f2ece1' }}><td style={{ padding: '8px' }}>Tuần 2</td><td style={{ padding: '8px' }}>$35.2</td><td style={{ padding: '8px' }}>$28.4</td></tr>
                <tr style={{ borderBottom: '1px solid #f2ece1' }}><td style={{ padding: '8px' }}>Tuần 3</td><td style={{ padding: '8px' }}>$55.0</td><td style={{ padding: '8px' }}>$40.0</td></tr>
                <tr><td style={{ padding: '8px' }}>Tuần 4</td><td style={{ padding: '8px' }}>$95.0</td><td style={{ padding: '8px' }}>$68.0</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {activeModal?.type === 'shipments' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'TRK-83291', carrier: 'FedEx', status: 'Đang đi giao', dest: 'Hà Nội' },
                { id: 'TRK-83290', carrier: 'DHL', status: 'Đang trung chuyển', dest: 'TP. Hồ Chí Minh' },
                { id: 'TRK-83289', carrier: 'GHTK', status: 'Đã tạo vận đơn', dest: 'Đà Nẵng' }
              ].map((s, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f7f2ea', borderRadius: '8px', fontSize: '13px' }}>
                  <strong>#{s.id} ({s.carrier})</strong>
                  <span>{s.dest}</span>
                  <span style={{ color: '#25975d', fontWeight: '600' }}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeModal?.type === 'add-product' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Tên sản phẩm</label>
                <input placeholder="VD: Áo khoác mùa đông..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c7b2', fontSize: '13px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Giá bán ($)</label>
                  <input type="number" placeholder="49.00" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c7b2', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Số lượng tồn kho</label>
                  <input type="number" placeholder="100" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c7b2', fontSize: '13px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)}
                  style={{ padding: '8px 14px', background: 'transparent', border: '1px solid #d4c7b2', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    showToast('✓ Đã lưu sản phẩm mới thành công!');
                    setActiveModal(null);
                  }}
                  style={{ padding: '8px 16px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Tạo sản phẩm
                </button>
              </div>
            </div>
          </div>
        )}

        {activeModal?.type === 'order' && (
          <div>
            <div style={{ padding: '14px', background: '#f9f5ed', borderRadius: '10px', marginBottom: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#685947' }}>Mã đơn hàng:</span>
                <strong>#{activeModal.data?.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#685947' }}>Khách hàng:</span>
                <strong>Sarah Kim</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#685947' }}>Tổng giá trị:</span>
                <strong>$79.00 (Đã thanh toán)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#685947' }}>Trạng thái giao hàng:</span>
                <span style={{ color: '#25975d', fontWeight: '600' }}>Đang đi giao</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => {
                  showToast('✓ Đã in phiếu đóng gói vận đơn!');
                  setActiveModal(null);
                }}
                style={{ padding: '8px 14px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                In phiếu đóng gói
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* Toast Notification Container */}
      <div id="toast-region" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{ marginBottom: '8px' }}>
            <span className="icon" aria-hidden="true" style={{ color: '#25975d', fontWeight: 'bold' }}>✓</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}
