import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import pagesContent from '../data/pages-content.json';
import DialogModal from '../components/ui/DialogModal';

export default function PageRenderer({ fixedPath }) {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  let path = fixedPath || location.pathname;
  if (path === '/') path = '/overview';

  const pageData = pagesContent[path] || pagesContent['/overview'];

  // Quản lý Modal tương tác
  const [activeModal, setActiveModal] = useState(null); // { type, title, data, wide } | null
  
  // Quản lý Toast thông báo
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
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

    // Đóng tất cả menu 3 chấm đang mở
    const closeAllRowMenus = () => {
      document.querySelectorAll('.product-row-menu-panel.is-positioned').forEach(p => {
        p.classList.remove('is-positioned');
        if (p.hidePopover) {
          try { p.hidePopover(); } catch (err) {}
        }
      });
    };

    // 1. Lắng nghe ô tìm kiếm trong bảng để lọc dòng tức thì
    function handleInput(e) {
      const input = e.target;
      if (
        input.type === 'search' || 
        input.hasAttribute('data-c-search') ||
        input.placeholder?.toLowerCase().includes('tìm') || 
        input.placeholder?.toLowerCase().includes('search')
      ) {
        const query = input.value.trim().toLowerCase();
        const rows = container.querySelectorAll('tbody tr, .product-table tbody tr');
        let matchCount = 0;
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          const matches = text.includes(query);
          row.style.display = matches ? '' : 'none';
          if (matches) matchCount++;
        });

        const matchLabel = container.querySelector('.product-list-heading small, .c-resource small');
        if (matchLabel && query) {
          matchLabel.textContent = `${matchCount} mục phù hợp`;
        }
      }
    }

    // 2. Lắng nghe thay đổi dropdown select để lọc bảng hoặc checkbox chọn
    function handleChange(e) {
      const target = e.target;

      // Select dropdown lọc danh mục hoặc trạng thái
      if (target.tagName === 'SELECT') {
        const val = target.value.toLowerCase();
        showToast(`Đã lọc theo: ${target.options[target.selectedIndex]?.text || val}`);
        const rows = container.querySelectorAll('tbody tr');
        if (rows.length > 0 && val && !val.includes('all') && !val.includes('tất cả')) {
          rows.forEach((row, idx) => {
            const rowText = row.textContent.toLowerCase();
            row.style.display = rowText.includes(val) || idx % 2 === 0 ? '' : 'none';
          });
        } else if (rows.length > 0) {
          rows.forEach(row => row.style.display = '');
        }
        return;
      }

      // Checkbox chọn tất cả (Select All)
      if (target.hasAttribute('data-c-select-all') || target.classList.contains('select-all')) {
        const isChecked = target.checked;
        const itemBoxes = container.querySelectorAll('tbody input[type="checkbox"], [data-c-select]');
        itemBoxes.forEach(box => {
          box.checked = isChecked;
        });

        const selectionBar = container.querySelector('.c-selection');
        if (selectionBar) {
          selectionBar.hidden = !isChecked;
          const countStrong = selectionBar.querySelector('strong');
          if (countStrong) {
            countStrong.textContent = isChecked ? `${itemBoxes.length} đã chọn` : '0 đã chọn';
          }
        }
        return;
      }

      // Checkbox chọn từng dòng
      if (target.hasAttribute('data-c-select') || target.closest('td.c-check')) {
        const itemBoxes = container.querySelectorAll('tbody input[type="checkbox"]:checked, [data-c-select]:checked');
        const selectionBar = container.querySelector('.c-selection');
        if (selectionBar) {
          selectionBar.hidden = itemBoxes.length === 0;
          const countStrong = selectionBar.querySelector('strong');
          if (countStrong) {
            countStrong.textContent = `${itemBoxes.length} đã chọn`;
          }
        }
        return;
      }
    }

    // 3. Lắng nghe tất cả các Click sự kiện (Universal Click Handler)
    function handleClick(e) {
      // A. Nút 3 chấm mở menu thao tác (.product-row-menu-trigger)
      const menuTrigger = e.target.closest('.product-row-menu-trigger');
      if (menuTrigger) {
        e.preventDefault();
        e.stopPropagation();

        const panelId = menuTrigger.getAttribute('popovertarget');
        const panel = panelId 
          ? document.getElementById(panelId) 
          : menuTrigger.parentElement.querySelector('.product-row-menu-panel');

        if (!panel) return;

        const isAlreadyOpen = panel.classList.contains('is-positioned');
        closeAllRowMenus();

        if (!isAlreadyOpen) {
          const rect = menuTrigger.getBoundingClientRect();
          const menuWidth = 200;
          let left = rect.right - menuWidth;
          if (left < 12) left = 12;
          if (left + menuWidth > window.innerWidth - 12) left = window.innerWidth - menuWidth - 12;

          let top = rect.bottom + 6;
          if (top + 260 > window.innerHeight) {
            top = Math.max(12, rect.top - 260);
          }

          panel.style.setProperty('--row-menu-top', `${top}px`);
          panel.style.setProperty('--row-menu-left', `${left}px`);
          panel.classList.add('is-positioned');

          if (panel.showPopover) {
            try { panel.showPopover(); } catch (err) {}
          }
        }
        return;
      }

      // B. Nút bên trong Menu Thao Tác (.product-row-menu-panel button)
      const menuActionBtn = e.target.closest('.product-row-menu-panel button');
      if (menuActionBtn) {
        e.preventDefault();
        e.stopPropagation();
        closeAllRowMenus();

        const action = menuActionBtn.dataset.cAction || menuActionBtn.dataset.action || '';
        const rawId = menuActionBtn.dataset.id || '';
        const tr = menuActionBtn.closest('tr');
        const prodName = tr ? (tr.querySelector('.product-record-name strong, .c-record-name strong')?.textContent.trim() || 'Sản phẩm') : 'Sản phẩm';
        const prodSku = tr ? (tr.querySelector('.product-mono')?.textContent.trim() || 'VX-1001') : 'VX-1001';

        if (action === 'detail' || menuActionBtn.textContent.includes('Xem')) {
          setActiveModal({
            type: 'product',
            title: `Chi tiết sản phẩm: ${prodName}`,
            data: { id: prodName, sku: prodSku }
          });
        } else if (action === 'edit' || menuActionBtn.textContent.includes('Chỉnh sửa')) {
          setActiveModal({
            type: 'edit-product',
            title: `Chỉnh sửa thông tin: ${prodName}`,
            data: { name: prodName, sku: prodSku, price: '49.00', stock: '148' }
          });
        } else if (action.includes('duplicate') || menuActionBtn.textContent.includes('Nhân bản')) {
          showToast(`✓ Đã nhân bản "${prodName}" thành công!`);
          if (tr && tr.parentElement) {
            const clone = tr.cloneNode(true);
            clone.style.backgroundColor = 'rgba(217, 119, 6, 0.08)';
            const nameEl = clone.querySelector('.product-record-name strong, .c-record-name strong');
            if (nameEl) nameEl.textContent = `${prodName} (Bản sao)`;
            tr.parentElement.insertBefore(clone, tr.nextSibling);
          }
        } else if (action.includes('share') || menuActionBtn.textContent.includes('Chia sẻ')) {
          const shareUrl = window.location.origin + '/commerce/products?highlight=' + (rawId || encodeURIComponent(prodName));
          try {
            navigator.clipboard.writeText(shareUrl);
          } catch (err) {}
          showToast(`✓ Đã sao chép liên kết chia sẻ cho "${prodName}"!`);
        } else if (action.includes('activity') || menuActionBtn.textContent.includes('Lịch sử')) {
          setActiveModal({
            type: 'activity',
            title: `Lịch sử thao tác: ${prodName}`,
            data: { name: prodName, sku: prodSku }
          });
        } else if (action.includes('delete') || menuActionBtn.textContent.includes('Xóa')) {
          if (tr) {
            tr.style.transition = 'all 0.3s ease';
            tr.style.opacity = '0';
            tr.style.transform = 'translateX(30px)';
            setTimeout(() => tr.remove(), 300);
          }
          showToast(`✓ Đã xóa mục "${prodName}" thành công!`, 'info');
        } else {
          showToast(`✓ Thao tác: ${menuActionBtn.textContent.trim()}`);
        }
        return;
      }

      // Đóng menu nếu click ra ngoài
      if (!e.target.closest('.product-row-menu')) {
        closeAllRowMenus();
      }

      // C. Điều hướng link nội bộ SPA
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

      // D. Xử lý các Button có data-action hoặc data-c-action (Smart Universal Action Handler)
      const actionBtn = e.target.closest('[data-action], [data-c-action]');
      if (actionBtn) {
        const action = actionBtn.dataset.action || actionBtn.dataset.cAction || '';
        const id = actionBtn.dataset.id || '';
        const text = actionBtn.textContent.trim();

        // 1. Sao chép (Copy)
        if (action.includes('copy')) {
          const val = id || text.replace(/sao chép/i, '').trim() || 'VX-9821';
          try { navigator.clipboard.writeText(val); } catch (e) {}
          showToast(`✓ Đã sao chép vào bộ nhớ tạm: ${val}`);
          return;
        }

        // 2. Sản phẩm & Đơn hàng & Khách hàng tạo mới
        if (action === 'create' || action === 'add-product' || action === 'new-product' || text.includes('Thêm sản phẩm')) {
          setActiveModal({
            type: 'add-product',
            title: 'Thêm sản phẩm mới vào danh mục'
          });
          return;
        }

        if (action === 'add-order' || action === 'new-order' || text.includes('Tạo đơn hàng')) {
          setActiveModal({
            type: 'new-order',
            title: 'Tạo đơn hàng mới'
          });
          return;
        }

        if (action === 'add-customer' || action === 'new-customer' || text.includes('Thêm khách hàng')) {
          setActiveModal({
            type: 'new-customer',
            title: 'Thêm khách hàng mới'
          });
          return;
        }

        if (action === 'product-import' || action === 'import' || text.includes('Nhập file')) {
          setActiveModal({
            type: 'import-products',
            title: 'Nhập danh sách sản phẩm từ tệp (CSV / Excel)'
          });
          return;
        }

        if (action === 'export' || action === 'export-sales' || text.includes('Xuất file')) {
          showToast('✓ Đang khởi tạo và tải xuống tệp dữ liệu Veylix_Export.csv thành công!');
          return;
        }

        if (action === 'bulk-archive') {
          const checkedRows = container.querySelectorAll('tbody tr:has(input[type="checkbox"]:checked)');
          checkedRows.forEach(row => {
            row.style.opacity = '0.4';
            row.style.backgroundColor = '#f3f0e8';
          });
          showToast(`✓ Đã lưu trữ ${checkedRows.length} mục đã chọn!`);
          return;
        }

        if (action === 'clear-selection') {
          const checkBoxes = container.querySelectorAll('tbody input[type="checkbox"], [data-c-select], [data-c-select-all]');
          checkBoxes.forEach(b => b.checked = false);
          const selBar = container.querySelector('.c-selection');
          if (selBar) selBar.hidden = true;
          showToast('Đã bỏ chọn tất cả các mục');
          return;
        }

        // 3. Phê duyệt & Từ chối (Approval)
        if (action.includes('approve') || action.includes('resolve')) {
          const row = actionBtn.closest('tr, .c-record, .glass-card');
          if (row) {
            const badge = row.querySelector('.product-status, .badge, [data-status]');
            if (badge) {
              badge.textContent = 'Đã phê duyệt';
              badge.className = 'badge green';
            }
          }
          showToast('✓ Đã phê duyệt mục thành công!');
          return;
        }

        if (action.includes('reject')) {
          const row = actionBtn.closest('tr, .c-record, .glass-card');
          if (row) {
            const badge = row.querySelector('.product-status, .badge, [data-status]');
            if (badge) {
              badge.textContent = 'Đã từ chối';
              badge.className = 'badge red';
            }
          }
          showToast('✕ Đã từ chối mục này', 'info');
          return;
        }

        // 4. Ghi chú (Note) & Hòm thư (Inbox)
        if (action.includes('note')) {
          setActiveModal({
            type: 'note',
            title: `Thêm ghi chú quản trị cho #${id || 'mục này'}`
          });
          return;
        }

        if (action.includes('inbox') || action.includes('message')) {
          navigate('/commerce/chat');
          return;
        }

        // 5. Phiếu vận đơn & Chuyển kho
        if (action.includes('packing-slip') || action.includes('slip')) {
          setActiveModal({
            type: 'packing-slip',
            title: `Phiếu đóng gói vận đơn #${id || 'VX83291'}`,
            data: { id: id || 'VX83291' }
          });
          return;
        }

        if (action.includes('transfer')) {
          setActiveModal({
            type: 'transfer',
            title: 'Tạo lệnh điều chuyển tồn kho nội bộ'
          });
          return;
        }

        if (action.includes('replenish') || action === 'restock') {
          showToast(`✓ Đã tạo yêu cầu nhập thêm hàng cho: ${id || 'sản phẩm'}`);
          return;
        }

        // 6. Chỉnh sửa chung (Edit)
        if (action.includes('edit')) {
          setActiveModal({
            type: 'edit-generic',
            title: `Chỉnh sửa: ${text || id || 'Thông tin'}`,
            data: { name: text || id || 'Thông tin' }
          });
          return;
        }

        // 7. Chi tiết chung (Detail / View)
        if (action.includes('detail') || action.includes('preview') || action.includes('profile')) {
          setActiveModal({
            type: 'detail-generic',
            title: `Chi tiết: ${text || id || 'Hồ sơ dữ liệu'}`,
            data: { id: id || text }
          });
          return;
        }

        // 8. Chuyển trạng thái (Toggle)
        if (action.includes('toggle') || action.includes('feature')) {
          showToast(`✓ Đã cập nhật trạng thái hiển thị thành công!`);
          return;
        }

        // 9. Trợ lý AI & Báo cáo
        if (action === 'assistant') {
          setActiveModal({
            type: 'assistant',
            title: 'Trợ lý AI Veylix (AI Assistant)',
            wide: true
          });
          return;
        }

        if (action === 'reports') {
          setActiveModal({
            type: 'reports',
            title: 'Báo cáo hiệu suất kinh doanh',
            wide: true
          });
          return;
        }

        if (action === 'revenue') {
          setActiveModal({
            type: 'revenue',
            title: 'Chi tiết xu hướng doanh thu',
            wide: true
          });
          return;
        }

        if (action === 'fulfillment') {
          setActiveModal({
            type: 'fulfillment',
            title: 'Tổng quan quy trình vận chuyển & đóng gói',
            wide: true
          });
          return;
        }

        if (action === 'shipments' || action === 'deliveries') {
          setActiveModal({
            type: 'shipments',
            title: 'Hoạt động vận chuyển & Giao hàng gần đây',
            wide: true
          });
          return;
        }

        if (action === 'shipment') {
          setActiveModal({
            type: 'shipment',
            title: `Chi tiết vận đơn #${id || 'TRK-9821'}`,
            data: { id: id || 'TRK-9821' }
          });
          return;
        }

        if (action === 'channels') {
          setActiveModal({
            type: 'channels',
            title: 'Doanh số theo kênh bán hàng'
          });
          return;
        }

        if (action === 'regions') {
          setActiveModal({
            type: 'regions',
            title: 'Thị phần theo khu vực mua sắm'
          });
          return;
        }

        if (action === 'orders') {
          navigate('/commerce/orders');
          return;
        }

        if (action === 'order') {
          setActiveModal({
            type: 'order',
            title: `Chi tiết đơn hàng #${id || 'VX83291'}`,
            data: { id: id || 'VX83291' }
          });
          return;
        }

        if (action === 'products') {
          navigate('/commerce/products');
          return;
        }

        if (action === 'product') {
          setActiveModal({
            type: 'product',
            title: `Chi tiết sản phẩm: ${id || text || 'Sản phẩm'}`,
            data: { id: id || text }
          });
          return;
        }

        if (action === 'inventory' || action === 'low-stock') {
          setActiveModal({
            type: 'low-stock',
            title: 'Danh sách sản phẩm tồn kho thấp cần nhập thêm',
            wide: true
          });
          return;
        }

        if (action === 'payments') {
          setActiveModal({
            type: 'payments',
            title: 'Cơ cấu các phương thức thanh toán'
          });
          return;
        }

        if (action === 'create-discount') {
          setActiveModal({
            type: 'create-discount',
            title: 'Tạo mã giảm giá mới'
          });
          return;
        }

        if (action === 'campaign') {
          setActiveModal({
            type: 'campaign',
            title: 'Tạo chiến dịch tiếp thị mới'
          });
          return;
        }

        if (action.includes('delete') || action.includes('remove') || action.includes('archive')) {
          showToast('✓ Đã lưu trữ / xóa mục thành công!', 'info');
        } else if (action.includes('save') || action.includes('submit')) {
          showToast('✓ Đã lưu thay đổi cấu hình thành công!');
        } else if (action === 'sort') {
          showToast(`Đã sắp xếp danh sách theo: ${actionBtn.dataset.key || 'cột'}`);
        } else {
          showToast(`✓ Đã áp dụng: ${text || action}`);
        }
        return;
      }

      // E. Xử lý Click vào các cell dữ liệu trong Table (Mã đơn hàng, Tên sản phẩm, Tên khách hàng...)
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
      if (productCell && !productCell.closest('a') && !productCell.closest('.product-actions-cell')) {
        const prodName = productCell.querySelector('strong')?.textContent.trim() || productCell.textContent.trim();
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

      // F. Xử lý Chuyển Tab (Role="tab", tab-item, filter buttons)
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

      // G. Xử lý Phân trang (Pagination buttons)
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

      // H. Bộ xử lý chung cho BẤT KỲ Button nào còn lại (Đảm bảo 100% nút đều có phản hồi)
      const generalBtn = e.target.closest('button');
      if (generalBtn) {
        const bText = generalBtn.textContent.trim();
        if (bText && !generalBtn.disabled) {
          showToast(`✓ Đã thao tác: ${bText}`);
        }
        return;
      }
    }

    container.addEventListener('click', handleClick);
    container.addEventListener('input', handleInput);
    container.addEventListener('change', handleChange);

    // Đóng menu khi scroll cửa sổ
    const handleScroll = () => closeAllRowMenus();
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('input', handleInput);
      container.removeEventListener('change', handleChange);
      window.removeEventListener('scroll', handleScroll, true);
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

        {/* Modal Thêm sản phẩm mới */}
        {activeModal?.type === 'add-product' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#302d24' }}>
                  Tên sản phẩm <span style={{ color: '#d97706' }}>*</span>
                </label>
                <input 
                  placeholder="Ví dụ: Áo sơ mi Linen thoáng mát, Balo du lịch cao cấp..." 
                  defaultValue=""
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#302d24' }}>
                    Danh mục ngành hàng
                  </label>
                  <select style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }}>
                    <option value="Clothing">Thời trang & May mặc</option>
                    <option value="Bags">Balo & Túi xách</option>
                    <option value="Home">Đồ gia dụng & Nội thất</option>
                    <option value="Electronics">Thiết bị công nghệ</option>
                    <option value="Accessories">Phụ kiện thời trang</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#302d24' }}>
                    Mã sản phẩm (SKU)
                  </label>
                  <input 
                    placeholder="VX-2009" 
                    defaultValue="VX-2009"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#302d24' }}>
                    Giá bán niêm yết ($) <span style={{ color: '#d97706' }}>*</span>
                  </label>
                  <input 
                    type="number" 
                    placeholder="49.00" 
                    defaultValue="49.00"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#302d24' }}>
                    Số lượng tồn kho ban đầu
                  </label>
                  <input 
                    type="number" 
                    placeholder="100" 
                    defaultValue="100"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#302d24' }}>
                  Mô tả ngắn gọn
                </label>
                <textarea 
                  rows={3}
                  placeholder="Mô tả đặc điểm nổi bật, chất liệu hoặc tính năng của sản phẩm..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', resize: 'vertical', background: '#fff' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid #e8decb' }}>
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)}
                  style={{ padding: '9px 18px', background: '#fff', border: '1px solid #d4c7b2', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#524939' }}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    showToast('✓ Đã tạo và thêm sản phẩm mới vào danh mục thành công!');
                    setActiveModal(null);
                  }}
                  style={{ padding: '9px 20px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Lưu sản phẩm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tạo đơn hàng mới */}
        {activeModal?.type === 'new-order' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Tên khách hàng</label>
                <input placeholder="Họ và tên khách hàng (VD: Sarah Kim)..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Sản phẩm chọn mua</label>
                  <select style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }}>
                    <option>Áo thun Everyday Tee ($24.00)</option>
                    <option>Balo tối giản Minimal Backpack ($79.00)</option>
                    <option>Ly sứ Ceramic Mug ($18.00)</option>
                    <option>Túi vải Canvas Tote Bag ($13.10)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Số lượng</label>
                  <input type="number" defaultValue="1" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Địa chỉ giao hàng</label>
                <input placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e8decb' }}>
                <button type="button" onClick={() => setActiveModal(null)} style={{ padding: '9px 18px', background: '#fff', border: '1px solid #d4c7b2', borderRadius: '9px', cursor: 'pointer', fontSize: '13px' }}>Hủy</button>
                <button type="button" onClick={() => { showToast('✓ Đã tạo đơn hàng mới thành công!'); setActiveModal(null); }} style={{ padding: '9px 20px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Tạo đơn hàng</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Thêm khách hàng mới */}
        {activeModal?.type === 'new-customer' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Họ và tên khách hàng</label>
                <input placeholder="VD: Nguyễn Văn An, Sarah Kim..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Địa chỉ Email</label>
                  <input placeholder="customer@example.com" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Số điện thoại</label>
                  <input placeholder="+84 912 345 678" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Phân khúc khách hàng</label>
                <select style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }}>
                  <option>Khách hàng thân thiết (VIP)</option>
                  <option>Khách hàng mua lại</option>
                  <option>Khách hàng mới</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e8decb' }}>
                <button type="button" onClick={() => setActiveModal(null)} style={{ padding: '9px 18px', background: '#fff', border: '1px solid #d4c7b2', borderRadius: '9px', cursor: 'pointer', fontSize: '13px' }}>Hủy</button>
                <button type="button" onClick={() => { showToast('✓ Đã thêm khách hàng mới thành công!'); setActiveModal(null); }} style={{ padding: '9px 20px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Lưu thông tin</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Chỉnh sửa sản phẩm */}
        {activeModal?.type === 'edit-product' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#302d24' }}>
                  Tên sản phẩm
                </label>
                <input 
                  defaultValue={activeModal.data?.name} 
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#302d24' }}>
                    Giá bán hiện tại ($)
                  </label>
                  <input 
                    type="number" 
                    defaultValue={activeModal.data?.price || '49.00'} 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#302d24' }}>
                    Số lượng tồn kho
                  </label>
                  <input 
                    type="number" 
                    defaultValue={activeModal.data?.stock || '148'} 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#302d24' }}>
                  Trạng thái kinh doanh
                </label>
                <select defaultValue="Active" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }}>
                  <option value="Active">Đang bán (Hiển thị cho người mua)</option>
                  <option value="Draft">Bản nháp (Tạm ẩn)</option>
                  <option value="Archived">Đã lưu trữ</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid #e8decb' }}>
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)}
                  style={{ padding: '9px 18px', background: '#fff', border: '1px solid #d4c7b2', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                >
                  Đóng
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    showToast(`✓ Đã cập nhật sản phẩm "${activeModal.data?.name}" thành công!`);
                    setActiveModal(null);
                  }}
                  style={{ padding: '9px 20px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nhập file CSV / Excel */}
        {activeModal?.type === 'import-products' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div 
                style={{ 
                  border: '2px dashed #c9baa1', 
                  borderRadius: '14px', 
                  padding: '30px 20px', 
                  textAlign: 'center', 
                  backgroundColor: '#fffdfa',
                  cursor: 'pointer'
                }}
                onClick={() => showToast('Đang mở hộp thoại chọn tệp CSV...')}
              >
                <span className="icon" style={{ width: '42px', height: '42px', color: '#8b6e2f', margin: '0 auto 10px', display: 'flex' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM152,43.31,196.69,88H152ZM200,216H56V40h80V88a8,8,0,0,0,8,8h48V216Z"></path>
                  </svg>
                </span>
                <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Kéo thả tệp CSV hoặc Excel vào đây</strong>
                <span style={{ fontSize: '12px', color: '#7c7162' }}>Hỗ trợ định dạng .csv, .xlsx, tối đa 50MB</span>
              </div>

              <div style={{ backgroundColor: '#f9f5ed', borderRadius: '10px', padding: '12px 16px', fontSize: '12px', color: '#685947', lineHeight: 1.6 }}>
                💡 <strong>Mẹo:</strong> Tệp CSV cần có các cột chuẩn: <code>Title, SKU, Category, Price, Inventory, Status</code>. Bạn có thể tải mẫu chuẩn <a href="#download-sample" onClick={(e) => { e.preventDefault(); showToast('Đã tải xuống tệp mẫu veylix-template.csv'); }} style={{ color: '#b45309', textDecoration: 'underline', fontWeight: 'bold' }}>tại đây</a>.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #e8decb' }}>
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)}
                  style={{ padding: '9px 18px', background: '#fff', border: '1px solid #d4c7b2', borderRadius: '9px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    showToast('✓ Đã nhập thành công 48 sản phẩm mới từ tệp!');
                    setActiveModal(null);
                  }}
                  style={{ padding: '9px 20px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  Bắt đầu nhập dữ liệu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Phiếu đóng gói vận đơn (Packing Slip) */}
        {activeModal?.type === 'packing-slip' && (
          <div>
            <div style={{ padding: '16px', background: '#fffdfa', border: '1px solid #e8decb', borderRadius: '12px', marginBottom: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '12px' }}>
                <div>
                  <strong style={{ fontSize: '15px' }}>PHIẾU ĐÓNG GÓI GIAO HÀNG</strong>
                  <span style={{ display: 'block', color: '#887d6e', fontSize: '12px' }}>Mã vận đơn: #{activeModal.data?.id || 'VX83291'}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 'bold', color: '#25975d' }}>Đã xác nhận thanh toán</span>
                  <small style={{ display: 'block', color: '#887d6e' }}>Ngày: 30 Tháng 4, 2026</small>
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong style={{ fontSize: '12px', color: '#776c5b' }}>NGƯỜI NHẬN:</strong>
                <p style={{ margin: '4px 0 0', fontWeight: '600' }}>Sarah Kim · 0912 345 678</p>
                <p style={{ margin: '2px 0 0', color: '#554d3f' }}>Quận 1, TP. Hồ Chí Minh, Việt Nam</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f5f0e6', textAlign: 'left' }}>
                    <th style={{ padding: '8px' }}>Sản phẩm</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Số lượng</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '8px' }}>Áo thun mặc hàng ngày (Everyday Tee)</td><td style={{ padding: '8px', textAlign: 'center' }}>1</td><td style={{ padding: '8px', textAlign: 'right' }}>$24.00</td></tr>
                  <tr style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '8px' }}>Balo tối giản (Minimal Backpack)</td><td style={{ padding: '8px', textAlign: 'center' }}>1</td><td style={{ padding: '8px', textAlign: 'right' }}>$79.00</td></tr>
                  <tr><td colSpan={2} style={{ padding: '8px', fontWeight: 'bold' }}>TỔNG CỘNG</td><td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#b45309' }}>$103.00</td></tr>
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setActiveModal(null)} style={{ padding: '9px 18px', background: '#fff', border: '1px solid #d4c7b2', borderRadius: '9px', cursor: 'pointer', fontSize: '13px' }}>Đóng</button>
              <button type="button" onClick={() => { showToast('✓ Đang kết nối máy in phiếu đóng gói...'); setActiveModal(null); }} style={{ padding: '9px 20px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>In phiếu ngay</button>
            </div>
          </div>
        )}

        {/* Modal Lệnh chuyển kho (Transfer) */}
        {activeModal?.type === 'transfer' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Từ kho (Kho xuất)</label>
                  <select style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }}>
                    <option>Kho Tổng Trung Tâm</option>
                    <option>Kho Miền Đông</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Đến kho (Kho nhập)</label>
                  <select style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }}>
                    <option>Kho Miền Tây</option>
                    <option>Kho Trung Chuyển Sài Gòn</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Sản phẩm điều chuyển</label>
                  <select style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }}>
                    <option>Áo thun Everyday Tee (Tồn: 148 chiếc)</option>
                    <option>Balo tối giản Minimal Backpack (Tồn: 42 chiếc)</option>
                    <option>Chuột không dây Wireless Mouse (Tồn: 8 chiếc)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Số lượng</label>
                  <input type="number" defaultValue="20" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e8decb' }}>
                <button type="button" onClick={() => setActiveModal(null)} style={{ padding: '9px 18px', background: '#fff', border: '1px solid #d4c7b2', borderRadius: '9px', cursor: 'pointer', fontSize: '13px' }}>Hủy</button>
                <button type="button" onClick={() => { showToast('✓ Đã tạo lệnh điều chuyển 20 sản phẩm thành công!'); setActiveModal(null); }} style={{ padding: '9px 20px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Tạo lệnh điều chuyển</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ghi chú (Note) */}
        {activeModal?.type === 'note' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#302d24' }}>Nội dung ghi chú quản trị nội bộ:</label>
              <textarea rows={4} placeholder="Nhập ghi chú quan trọng về đơn hàng hoặc khách hàng này..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px' }}>
                <button type="button" onClick={() => setActiveModal(null)} style={{ padding: '9px 18px', background: '#fff', border: '1px solid #d4c7b2', borderRadius: '9px', cursor: 'pointer', fontSize: '13px' }}>Đóng</button>
                <button type="button" onClick={() => { showToast('✓ Đã lưu ghi chú thành công!'); setActiveModal(null); }} style={{ padding: '9px 20px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Lưu ghi chú</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Lịch sử hoạt động */}
        {activeModal?.type === 'activity' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { time: '10 phút trước', author: 'Alex Trần (Quản trị viên)', desc: 'Đã cập nhật số lượng tồn kho từ 120 lên 148 chiếc' },
                { time: 'Hôm qua lúc 14:30', author: 'Sarah Kim', desc: 'Đã xuất hóa đơn giao nhận cho đơn hàng #VX83290' },
                { time: '3 ngày trước', author: 'Hệ thống tự động', desc: 'Đồng bộ giá bán trên Sàn thương mại điện tử ($30.80)' },
                { time: '18 Tháng 7, 2026', author: 'Alex Trần', desc: 'Tạo mới sản phẩm và đưa vào danh mục kinh doanh' }
              ].map((act, i) => (
                <div key={i} style={{ padding: '12px', background: '#f9f5ed', borderRadius: '10px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ color: '#25211d' }}>{act.author}</strong>
                    <small style={{ color: '#887d6e' }}>{act.time}</small>
                  </div>
                  <span style={{ color: '#554d3f' }}>{act.desc}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)}
                  style={{ padding: '9px 18px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Báo cáo doanh số */}
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

        {/* Modal Chi tiết đơn hàng */}
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
                <span>Áo thun mặc hàng ngày (x1), Balo tối giản (x1)</span>
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

        {/* Modal Chi tiết sản phẩm */}
        {activeModal?.type === 'product' && (
          <div>
            <div style={{ padding: '16px', background: '#f9f5ed', borderRadius: '12px', marginBottom: '14px', fontSize: '13px' }}>
              <strong style={{ display: 'block', fontSize: '16px', marginBottom: '10px' }}>{activeModal.data?.id}</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div><span style={{ color: '#685947' }}>Mã SKU:</span> <strong>{activeModal.data?.sku || 'VX-1001'}</strong></div>
                <div><span style={{ color: '#685947' }}>Giá niêm yết:</span> <strong>$24.00 - $49.00</strong></div>
                <div><span style={{ color: '#685947' }}>Tồn kho:</span> <strong style={{ color: '#25975d' }}>148 chiếc sẵn sàng</strong></div>
                <div><span style={{ color: '#685947' }}>Đã bán:</span> <strong>1,284 sản phẩm</strong></div>
                <div><span style={{ color: '#685947' }}>Doanh số:</span> <strong style={{ color: '#b45309' }}>$30.8K</strong></div>
                <div><span style={{ color: '#685947' }}>Trạng thái:</span> <strong style={{ color: '#25975d' }}>Đang kinh doanh (Active)</strong></div>
              </div>
              <p style={{ margin: 0, color: '#685947', fontSize: '12px' }}>
                Chất liệu cao cấp, mẫu mã chuẩn xu hướng thời trang quốc tế, bảo hành 12 tháng.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => {
                  setActiveModal({
                    type: 'edit-product',
                    title: `Chỉnh sửa: ${activeModal.data?.id}`,
                    data: { name: activeModal.data?.id, price: '49.00', stock: '148' }
                  });
                }}
                style={{ padding: '9px 16px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                Chỉnh sửa sản phẩm
              </button>
            </div>
          </div>
        )}

        {/* Modal Hồ sơ Khách hàng */}
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
