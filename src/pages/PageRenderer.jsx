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

  // Bộ lắng nghe và điều phối tương tác toàn diện trên trang
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Lắng nghe ô tìm kiếm trong bảng để lọc dòng tức thì
    function handleInput(e) {
      const input = e.target;
      if (input.type === 'search' || input.placeholder?.toLowerCase().includes('tìm') || input.placeholder?.toLowerCase().includes('search')) {
        const query = input.value.trim().toLowerCase();
        const table = container.querySelector('tbody');
        if (table) {
          table.querySelectorAll('tr').forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
          });
        }
      }
    }

    // 2. Lắng nghe thay đổi dropdown select để lọc bảng
    function handleChange(e) {
      const select = e.target;
      if (select.tagName === 'SELECT') {
        const val = select.value.toLowerCase();
        showToast(`Đã lọc theo: ${select.options[select.selectedIndex]?.text || val}`);
        const table = container.querySelector('tbody');
        if (table && val && !val.includes('all') && !val.includes('tất cả')) {
          table.querySelectorAll('tr').forEach((row, idx) => {
            row.style.display = idx % 2 === 0 ? '' : 'none';
          });
        } else if (table) {
          table.querySelectorAll('tr').forEach(row => row.style.display = '');
        }
      }
    }

    // 3. Lắng nghe tất cả các Click sự kiện
    function handleClick(e) {
      // A. Điều hướng link nội bộ SPA
      const link = e.target.closest('a');
      if (link) {
        const href = link.getAttribute('href');
        if (href && (href.startsWith('/') || href.startsWith(window.location.origin))) {
          e.preventDefault();
          const targetPath = href.replace(window.location.origin, '').split('?')[0].split('#')[0];
          navigate(targetPath);
          return;
        }
      }

      // B. Xử lý các Button có data-action
      const actionBtn = e.target.closest('[data-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.action;
        const id = actionBtn.dataset.id;
        const text = actionBtn.textContent.trim();

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

          case 'fulfillment':
            setActiveModal({
              type: 'fulfillment',
              title: 'Tổng quan quy trình vận chuyển & đóng gói',
              wide: true
            });
            break;

          case 'shipments':
          case 'deliveries':
            setActiveModal({
              type: 'shipments',
              title: 'Hoạt động vận chuyển & Giao hàng gần đây',
              wide: true
            });
            break;

          case 'shipment':
            setActiveModal({
              type: 'shipment',
              title: `Chi tiết vận đơn #${id || 'TRK-9821'}`,
              data: { id: id || 'TRK-9821' }
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
              title: 'Thị phần theo khu vực mua sắm'
            });
            break;

          case 'orders':
            navigate('/commerce/orders');
            break;

          case 'order':
            setActiveModal({
              type: 'order',
              title: `Chi tiết đơn hàng #${id || 'VX83291'}`,
              data: { id: id || 'VX83291' }
            });
            break;

          case 'products':
            navigate('/commerce/products');
            break;

          case 'product':
            setActiveModal({
              type: 'product',
              title: `Chi tiết sản phẩm: ${id || text || 'Sản phẩm'}`,
              data: { id: id || text }
            });
            break;

          case 'inventory':
          case 'low-stock':
            setActiveModal({
              type: 'low-stock',
              title: 'Danh sách sản phẩm tồn kho thấp cần nhập thêm',
              wide: true
            });
            break;

          case 'restock':
            showToast(`✓ Đã tạo lệnh nhập thêm hàng cho: ${id || 'sản phẩm'}`);
            break;

          case 'payments':
            setActiveModal({
              type: 'payments',
              title: 'Cơ cấu các phương thức thanh toán'
            });
            break;

          case 'add-product':
          case 'new-product':
            setActiveModal({
              type: 'add-product',
              title: 'Thêm sản phẩm mới vào danh mục'
            });
            break;

          case 'create-discount':
            setActiveModal({
              type: 'create-discount',
              title: 'Tạo mã giảm giá mới'
            });
            break;

          case 'campaign':
            setActiveModal({
              type: 'campaign',
              title: 'Tạo chiến dịch tiếp thị mới'
            });
            break;

          case 'export':
          case 'export-sales':
            showToast('✓ Đang xuất tệp dữ liệu CSV thành công!');
            break;

          case 'filter':
            const filterBar = container.querySelector('.table-filters, .filter-bar, .c-filter-bar, .catalog-toolbar');
            if (filterBar) {
              filterBar.classList.toggle('open');
              showToast('Đã bật/tắt thanh công cụ bộ lọc');
            }
            break;

          default:
            if (action.includes('delete') || action.includes('remove')) {
              showToast('✓ Đã xóa mục thành công!', 'info');
            } else if (action.includes('save') || action.includes('submit')) {
              showToast('✓ Đã lưu thay đổi thành công!');
            } else {
              showToast(`Thao tác: ${actionBtn.textContent.trim() || action}`);
            }
            break;
        }
        return;
      }

      // C. Xử lý Click vào các cell dữ liệu trong Table (Mã đơn hàng, Tên sản phẩm, Tên khách hàng...)
      const orderCell = e.target.closest('.order-number, .shipment-order-cell');
      if (orderCell) {
        const orderId = orderCell.textContent.trim().replace('#', '');
        setActiveModal({
          type: 'order',
          title: `Chi tiết đơn hàng #${orderId}`,
          data: { id: orderId }
        });
        return;
      }

      const productCell = e.target.closest('.product-record-name, .product-row, .inventory-product-name, .c-record-name');
      if (productCell && !productCell.closest('a')) {
        const prodName = productCell.textContent.trim();
        setActiveModal({
          type: 'product',
          title: `Chi tiết sản phẩm: ${prodName}`,
          data: { id: prodName }
        });
        return;
      }

      const customerCell = e.target.closest('.customer-record');
      if (customerCell) {
        const custName = customerCell.textContent.trim();
        setActiveModal({
          type: 'customer',
          title: `Hồ sơ khách hàng: ${custName}`,
          data: { name: custName }
        });
        return;
      }

      // D. Nút Primary / Secondary Buttons
      const primaryBtn = e.target.closest('.primary-button, .quick-action');
      if (primaryBtn && !primaryBtn.dataset.action) {
        const btnText = primaryBtn.textContent.trim();
        if (btnText.toLowerCase().includes('thêm') || btnText.toLowerCase().includes('add') || btnText.toLowerCase().includes('new')) {
          setActiveModal({
            type: 'add-product',
            title: btnText
          });
        } else {
          showToast(`✓ Đã thực hiện: ${btnText}`);
        }
        return;
      }

      const secondaryBtn = e.target.closest('.secondary-button');
      if (secondaryBtn && !secondaryBtn.dataset.action) {
        const btnText = secondaryBtn.textContent.trim();
        if (btnText.toLowerCase().includes('xuất') || btnText.toLowerCase().includes('export')) {
          showToast('✓ Đang xuất tệp dữ liệu CSV...');
        } else {
          showToast(`✓ Đã áp dụng: ${btnText}`);
        }
        return;
      }

      // E. Xử lý Chuyển Tab (Role="tab", tab-item, filter buttons)
      const tabBtn = e.target.closest('[role="tab"], .tab-item, .category-select-arrow');
      if (tabBtn) {
        const tabList = tabBtn.closest('[role="tablist"], .tabs-nav, .tab-group, .c-filter-group');
        if (tabList) {
          tabList.querySelectorAll('[role="tab"], .tab-item').forEach(t => {
            t.setAttribute('aria-selected', 'false');
            t.classList.remove('active');
          });
          tabBtn.setAttribute('aria-selected', 'true');
          tabBtn.classList.add('active');

          const tabText = tabBtn.textContent.trim().toLowerCase();
          const rows = container.querySelectorAll('tbody tr, .data-row');
          if (rows.length > 0 && !tabText.includes('tất cả') && !tabText.includes('all')) {
            rows.forEach((row, idx) => {
              row.style.display = idx % 2 === 0 ? '' : 'none';
            });
          } else {
            rows.forEach(row => row.style.display = '');
          }
          showToast(`Đã lọc danh sách: ${tabBtn.textContent.trim()}`);
        }
        return;
      }

      // F. Xử lý Phân trang (Pagination buttons)
      const pageBtn = e.target.closest('[data-page-kind], .dashboard-pagination button, .pagination button');
      if (pageBtn && !pageBtn.disabled) {
        const parentNav = pageBtn.closest('nav, .pagination');
        if (parentNav) {
          parentNav.querySelectorAll('button').forEach(b => b.removeAttribute('aria-current'));
          pageBtn.setAttribute('aria-current', 'page');
          showToast(`Đã chuyển sang trang ${pageBtn.textContent.trim() || 'kế tiếp'}`);
        }
        return;
      }
    }

    container.addEventListener('click', handleClick);
    container.addEventListener('input', handleInput);
    container.addEventListener('change', handleChange);

    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('input', handleInput);
      container.removeEventListener('change', handleChange);
    };
  }, [navigate]);

  // Khởi tạo Canvas Charts trên trang Overview
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

      {/* Dialog Modal Tương tác Chi tiết */}
      <DialogModal
        isOpen={Boolean(activeModal)}
        title={activeModal?.title || ''}
        wide={activeModal?.wide}
        onClose={() => setActiveModal(null)}
      >
        {activeModal?.type === 'assistant' && (
          <div>
            <p style={{ color: '#685947', fontSize: '13px', marginBottom: '14px' }}>
              Trợ lý AI thông minh phân tích toàn diện dữ liệu bán hàng, tỷ lệ chuyển đổi và kho vận.
            </p>
            <div style={{ backgroundColor: '#f9f5ed', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
              <strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>💡 Đề xuất hành động tức thì:</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => showToast('Đang phân tích 8 mặt hàng có nguy cơ đứt hàng tuần tới...')}
                  style={{ textAlign: 'left', padding: '9px 12px', background: '#fff', border: '1px solid #e8decb', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                >
                  → Phân tích các mặt hàng sắp hết hàng cần đặt thêm tại Kho Tây
                </button>
                <button 
                  type="button" 
                  onClick={() => showToast('Đang tạo biểu đồ phân tích chuyển đổi các kênh bán hàng...')}
                  style={{ textAlign: 'left', padding: '9px 12px', background: '#fff', border: '1px solid #e8decb', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                >
                  → Tối ưu kênh Website (hiện chiếm 42% doanh số, tăng 8.4%)
                </button>
                <button 
                  type="button" 
                  onClick={() => showToast('Đang soạn thảo chiến dịch tri ân khách hàng thân thiết...')}
                  style={{ textAlign: 'left', padding: '9px 12px', background: '#fff', border: '1px solid #e8decb', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}
                >
                  → Gợi ý mã giảm giá tự động cho khách hàng quay lại mua sắm
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                placeholder="Nhập câu hỏi hoặc yêu cầu phân tích cho Trợ lý AI..." 
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #d4c7b2', outline: 'none', fontSize: '13px' }}
              />
              <button 
                type="button"
                onClick={() => showToast('✓ Trợ lý AI đã ghi nhận yêu cầu và đang xử lý!')}
                style={{ padding: '10px 18px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                Gửi lệnh
              </button>
            </div>
          </div>
        )}

        {activeModal?.type === 'reports' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '18px' }}>
              <div style={{ padding: '14px', background: '#f7f2ea', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: '#685947' }}>Tổng doanh số GMV</span>
                <strong style={{ display: 'block', fontSize: '18px', marginTop: '4px' }}>$124,592.00</strong>
              </div>
              <div style={{ padding: '14px', background: '#f7f2ea', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: '#685947' }}>Tổng đơn hàng</span>
                <strong style={{ display: 'block', fontSize: '18px', marginTop: '4px' }}>1,248 đơn</strong>
              </div>
              <div style={{ padding: '14px', background: '#f7f2ea', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: '#685947' }}>Tăng trưởng so với kỳ trước</span>
                <strong style={{ display: 'block', fontSize: '18px', color: '#25975d', marginTop: '4px' }}>+12.6%</strong>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button"
                onClick={() => {
                  showToast('✓ Đã xuất tệp CSV báo cáo kinh doanh thành công!');
                  setActiveModal(null);
                }}
                style={{ padding: '9px 18px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
              >
                Tải xuống file CSV báo cáo
              </button>
            </div>
          </div>
        )}

        {activeModal?.type === 'revenue' && (
          <div>
            <p style={{ color: '#685947', fontSize: '13px', marginBottom: '12px' }}>
              Số liệu đối chiếu doanh thu theo chu kỳ 4 tuần gần nhất (Đơn vị: nghìn USD):
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e8decb', textAlign: 'left', background: '#f9f5ed' }}>
                  <th style={{ padding: '10px 12px' }}>Giai đoạn</th>
                  <th style={{ padding: '10px 12px' }}>Kỳ hiện tại ($K)</th>
                  <th style={{ padding: '10px 12px' }}>Kỳ trước ($K)</th>
                  <th style={{ padding: '10px 12px' }}>Biến động</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f2ece1' }}><td style={{ padding: '9px 12px' }}>Tuần 1</td><td style={{ padding: '9px 12px' }}>$24.5</td><td style={{ padding: '9px 12px' }}>$20.1</td><td style={{ padding: '9px 12px', color: '#25975d' }}>+21.8%</td></tr>
                <tr style={{ borderBottom: '1px solid #f2ece1' }}><td style={{ padding: '9px 12px' }}>Tuần 2</td><td style={{ padding: '9px 12px' }}>$35.2</td><td style={{ padding: '9px 12px' }}>$28.4</td><td style={{ padding: '9px 12px', color: '#25975d' }}>+23.9%</td></tr>
                <tr style={{ borderBottom: '1px solid #f2ece1' }}><td style={{ padding: '9px 12px' }}>Tuần 3</td><td style={{ padding: '9px 12px' }}>$55.0</td><td style={{ padding: '9px 12px' }}>$40.0</td><td style={{ padding: '9px 12px', color: '#25975d' }}>+37.5%</td></tr>
                <tr><td style={{ padding: '9px 12px' }}>Tuần 4</td><td style={{ padding: '9px 12px' }}>$95.0</td><td style={{ padding: '9px 12px' }}>$68.0</td><td style={{ padding: '9px 12px', color: '#25975d' }}>+39.7%</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {activeModal?.type === 'fulfillment' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
              <div style={{ padding: '12px', background: '#f7f2ea', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#685947' }}>Đang xử lý</span>
                <strong style={{ display: 'block', fontSize: '16px', marginTop: '2px' }}>892 đơn</strong>
              </div>
              <div style={{ padding: '12px', background: '#f7f2ea', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#685947' }}>Đã đóng gói</span>
                <strong style={{ display: 'block', fontSize: '16px', marginTop: '2px' }}>721 đơn</strong>
              </div>
              <div style={{ padding: '12px', background: '#f7f2ea', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#685947' }}>Đã gửi hãng</span>
                <strong style={{ display: 'block', fontSize: '16px', marginTop: '2px' }}>654 đơn</strong>
              </div>
              <div style={{ padding: '12px', background: '#f7f2ea', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: '#25975d' }}>Đã giao thành công</span>
                <strong style={{ display: 'block', fontSize: '16px', marginTop: '2px', color: '#25975d' }}>602 đơn</strong>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => {
                navigate('/commerce/fulfillment');
                setActiveModal(null);
              }}
              style={{ width: '100%', padding: '10px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
            >
              Đi tới trang Quản lý Vận đơn & Đóng gói →
            </button>
          </div>
        )}

        {activeModal?.type === 'channels' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { name: 'Website bán lẻ', share: '42%', revenue: '$28,736', color: '#25975d' },
                { name: 'Ứng dụng di động (Mobile App)', share: '28%', revenue: '$19,158', color: '#3b82f6' },
                { name: 'Sàn thương mại điện tử', share: '20%', revenue: '$13,684', color: '#f59e0b' },
                { name: 'Mạng xã hội (Social Commerce)', share: '10%', revenue: '$6,842', color: '#8b5cf6' }
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f7f2ea', borderRadius: '8px', fontSize: '13px' }}>
                  <strong>{c.name}</strong>
                  <span style={{ fontWeight: '600', color: c.color }}>{c.share}</span>
                  <span style={{ color: '#25211d', fontWeight: 'bold' }}>{c.revenue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeModal?.type === 'regions' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Bắc Mỹ (Hoa Kỳ, Canada)', share: '38%' },
                { name: 'Tây Âu (Anh, Pháp, Đức)', share: '24%' },
                { name: 'Đông Nam Á (Việt Nam, Singapore)', share: '18%' },
                { name: 'Đông Á (Nhật Bản, Hàn Quốc)', share: '12%' },
                { name: 'Khu vực khác', share: '8%' }
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', background: '#f7f2ea', borderRadius: '8px', fontSize: '13px' }}>
                  <span>{r.name}</span>
                  <strong style={{ color: '#b45309' }}>{r.share}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeModal?.type === 'low-stock' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {[
                { name: 'Chuột không dây (Wireless Mouse)', stock: 8, sku: 'WM-008', wh: 'Kho Tây' },
                { name: 'Túi vải Canvas (Tote Bag)', stock: 12, sku: 'TB-012', wh: 'Kho Đông' },
                { name: 'Ly sứ tối giản (Ceramic Mug)', stock: 15, sku: 'CM-015', wh: 'Kho Trung tâm' }
              ].map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fff8eb', border: '1px solid #f3deb5', borderRadius: '8px', fontSize: '13px' }}>
                  <div>
                    <strong>{p.name}</strong>
                    <small style={{ display: 'block', color: '#685947' }}>SKU: {p.sku} · {p.wh}</small>
                  </div>
                  <span style={{ color: '#b45309', fontWeight: 'bold' }}>Còn {p.stock} chiếc</span>
                  <button 
                    type="button" 
                    onClick={() => showToast(`✓ Đã tạo lệnh nhập thêm 100 chiếc cho ${p.name}`)}
                    style={{ padding: '6px 12px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Nhập thêm
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeModal?.type === 'payments' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { name: 'Thẻ tín dụng / Ghi nợ (Stripe, Visa/Mastercard)', share: '62%' },
                { name: 'Ví điện tử Apple Pay & Google Pay', share: '24%' },
                { name: 'Chuyển khoản trực tiếp (Bank Transfer)', share: '10%' },
                { name: 'Thanh toán khi nhận hàng (COD)', share: '4%' }
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f7f2ea', borderRadius: '8px', fontSize: '13px' }}>
                  <span>{m.name}</span>
                  <strong>{m.share}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeModal?.type === 'order' && (
          <div>
            <div style={{ padding: '16px', background: '#f9f5ed', borderRadius: '12px', marginBottom: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#685947' }}>Mã đơn hàng:</span>
                <strong style={{ fontSize: '14px' }}>#{activeModal.data?.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#685947' }}>Khách hàng:</span>
                <strong>Sarah Kim</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#685947' }}>Địa chỉ giao hàng:</span>
                <span>Quận 1, TP. Hồ Chí Minh</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#685947' }}>Sản phẩm:</span>
                <span>Áo thun Everyday Tee (x1), Balo Minimal (x1)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#685947' }}>Tổng thanh toán:</span>
                <strong style={{ color: '#25211d', fontSize: '14px' }}>$79.00 (Đã thanh toán)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#685947' }}>Trạng thái vận chuyển:</span>
                <span style={{ color: '#25975d', fontWeight: '600' }}>Đang đi giao hàng</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => {
                  showToast('✓ Đang tạo và tải xuống nhãn in vận đơn...');
                  setActiveModal(null);
                }}
                style={{ padding: '9px 16px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                In nhãn vận đơn (Print Label)
              </button>
            </div>
          </div>
        )}

        {activeModal?.type === 'product' && (
          <div>
            <div style={{ padding: '16px', background: '#f9f5ed', borderRadius: '12px', marginBottom: '14px', fontSize: '13px' }}>
              <strong style={{ display: 'block', fontSize: '16px', marginBottom: '10px' }}>{activeModal.data?.id}</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div><span style={{ color: '#685947' }}>Giá niêm yết:</span> <strong>$24.00</strong></div>
                <div><span style={{ color: '#685947' }}>Tồn kho:</span> <strong style={{ color: '#25975d' }}>148 chiếc</strong></div>
                <div><span style={{ color: '#685947' }}>Đã bán:</span> <strong>342 chiếc</strong></div>
                <div><span style={{ color: '#685947' }}>Trạng thái:</span> <strong style={{ color: '#25975d' }}>Đang bán (Active)</strong></div>
              </div>
              <p style={{ margin: 0, color: '#685947', fontSize: '12px' }}>
                Chất liệu cao cấp, thoáng mát, gia công tỉ mỉ theo tiêu chuẩn xuất khẩu.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => {
                  showToast('✓ Đã cập nhật thông tin sản phẩm thành công!');
                  setActiveModal(null);
                }}
                style={{ padding: '9px 16px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                Cập nhật thông tin
              </button>
            </div>
          </div>
        )}

        {activeModal?.type === 'customer' && (
          <div>
            <div style={{ padding: '16px', background: '#f9f5ed', borderRadius: '12px', marginBottom: '14px', fontSize: '13px' }}>
              <strong style={{ display: 'block', fontSize: '16px', marginBottom: '8px' }}>{activeModal.data?.name}</strong>
              <p style={{ margin: '0 0 10px', color: '#685947' }}>Khách hàng thân thiết · Thành viên từ Tháng 1, 2026</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><span style={{ color: '#685947' }}>Tổng đơn đã mua:</span> <strong>12 đơn</strong></div>
                <div><span style={{ color: '#685947' }}>Tổng chi tiêu:</span> <strong style={{ color: '#25975d' }}>$1,420.00</strong></div>
                <div><span style={{ color: '#685947' }}>Hạng thành viên:</span> <strong style={{ color: '#b45309' }}>Gold VIP</strong></div>
                <div><span style={{ color: '#685947' }}>Đơn gần nhất:</span> <strong>Hôm qua (#VX83291)</strong></div>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => {
                showToast('✓ Đang chuyển đến hòm thư chăm sóc khách hàng...');
                navigate('/commerce/chat');
                setActiveModal(null);
              }}
              style={{ width: '100%', padding: '10px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
            >
              Nhắn tin trực tiếp với khách hàng →
            </button>
          </div>
        )}

        {activeModal?.type === 'add-product' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Tên sản phẩm</label>
                <input placeholder="VD: Balo chống nước cao cấp..." style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Giá bán ($)</label>
                  <input type="number" placeholder="49.00" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Số lượng tồn kho</label>
                  <input type="number" placeholder="100" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none' }} />
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
                    showToast('✓ Đã tạo sản phẩm mới thành công!');
                    setActiveModal(null);
                  }}
                  style={{ padding: '8px 16px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Lưu sản phẩm
                </button>
              </div>
            </div>
          </div>
        )}

        {activeModal?.type === 'create-discount' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Mã giảm giá (Code)</label>
                <input placeholder="VD: SUMMER2026" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Mức giảm (%)</label>
                  <input type="number" placeholder="20" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Số lần sử dụng</label>
                  <input type="number" placeholder="500" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    showToast('✓ Đã kích hoạt mã giảm giá mới!');
                    setActiveModal(null);
                  }}
                  style={{ padding: '8px 16px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Kích hoạt mã
                </button>
              </div>
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
