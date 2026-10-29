import React, { useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import DialogModal from '../../components/ui/DialogModal';
import navData from '../../data/navigation.json';

// Trình kết xuất chuẩn mực React JSX thuần túy cho tất cả các trang nghiệp vụ
export default function GeneralCommercePage() {
  const location = useLocation();
  const currentPath = location.pathname;

  // Tìm tiêu đề và nhóm cha tương ứng từ navigation.json
  const navInfo = useMemo(() => {
    let title = 'Nghiệp vụ thương mại';
    let parent = 'Không gian làm việc';

    for (const section of navData) {
      for (const item of section.items) {
        if (item.path === currentPath) {
          title = item.title;
          parent = section.groupTitle;
          return { title, parent };
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.path === currentPath) {
              title = child.title;
              parent = item.title;
              return { title, parent };
            }
          }
        }
      }
    }
    return { title, parent };
  }, [currentPath]);

  // Dữ liệu mẫu động quản lý bằng React State
  const initialRecords = useMemo(() => {
    const slug = currentPath.split('/').pop() || 'item';
    return [
      { id: `${slug}-101`, name: `${navInfo.title} #01`, code: `VX-${slug.toUpperCase()}-01`, date: 'Hôm nay', status: 'Hoạt động', statusClass: 'green', count: 124, value: '$1,250' },
      { id: `${slug}-102`, name: `${navInfo.title} #02`, code: `VX-${slug.toUpperCase()}-02`, date: 'Hôm qua', status: 'Hoạt động', statusClass: 'green', count: 86, value: '$920' },
      { id: `${slug}-103`, name: `${navInfo.title} #03`, code: `VX-${slug.toUpperCase()}-03`, date: '28 Thg 4', status: 'Đang xử lý', statusClass: 'amber', count: 45, value: '$450' },
      { id: `${slug}-104`, name: `${navInfo.title} #04`, code: `VX-${slug.toUpperCase()}-04`, date: '25 Thg 4', status: 'Đã hoàn tất', statusClass: 'blue', count: 32, value: '$310' },
      { id: `${slug}-105`, name: `${navInfo.title} #05`, code: `VX-${slug.toUpperCase()}-05`, date: '22 Thg 4', status: 'Lưu trữ', statusClass: 'purple', count: 18, value: '$180' }
    ];
  }, [currentPath, navInfo]);

  const [records, setRecords] = useState(initialRecords);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [newItemName, setNewItemName] = useState('');

  const [toasts, setToasts] = useState([]);
  const showToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(r => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
  }, [records, searchQuery]);

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? filteredRecords.map(r => r.id) : []);
  };

  const handleCreateRecord = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const slug = currentPath.split('/').pop() || 'item';
    const created = {
      id: `${slug}-${Date.now()}`,
      name: newItemName.trim(),
      code: `VX-${slug.toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      date: 'Vừa xong',
      status: 'Hoạt động',
      statusClass: 'green',
      count: 0,
      value: '$0'
    };
    setRecords([created, ...records]);
    setIsAddModalOpen(false);
    setNewItemName('');
    showToast(`Đã thêm mới "${created.name}" thành công!`);
  };

  const handleExport = () => {
    const headers = ['Mã định danh', 'Tên bản ghi', 'Mã tham chiếu', 'Thời gian', 'Trạng thái', 'Số lượng', 'Giá trị'];
    const rows = filteredRecords.map(r => [
      `"${r.id}"`,
      `"${r.name}"`,
      `"${r.code}"`,
      `"${r.date}"`,
      `"${r.status}"`,
      r.count,
      `"${r.value}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `du_lieu_${currentPath.replace(/\//g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file dữ liệu thành công!');
  };

  const isAllSelected = filteredRecords.length > 0 && selectedIds.length === filteredRecords.length;

  return (
    <div className="general-commerce-page" style={{ paddingBottom: '36px' }}>
      <header className="commerce-heading">
        <div>
          <div className="commerce-breadcrumb">
            <Link to="/overview">Tổng quan</Link>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </span>
            <span>{navInfo.parent}</span>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </span>
            <span>{navInfo.title}</span>
          </div>
          <h1>{navInfo.title}<span>.</span></h1>
        </div>

        <div className="commerce-heading-actions">
          <button type="button" className="secondary-button" onClick={handleExport}>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z"></path>
              </svg>
            </span>
            Xuất file
          </button>

          <button type="button" className="primary-button" onClick={() => setIsAddModalOpen(true)}>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
              </svg>
            </span>
            + Thêm mới
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="order-summary-grid" style={{ marginBottom: '20px' }}>
        <div className="order-summary-card green">
          <div>
            <small>Tổng số lượng</small>
            <strong>{records.length}</strong>
            <em>Đang vận hành hệ thống</em>
          </div>
        </div>
        <div className="order-summary-card blue">
          <div>
            <small>Đang hoạt động</small>
            <strong>{records.filter(r => r.status === 'Hoạt động').length}</strong>
            <em>Trạng thái khả dụng 100%</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Cần xử lý</small>
            <strong>{records.filter(r => r.status === 'Đang xử lý').length}</strong>
            <em>Đang trong hàng đợi</em>
          </div>
        </div>
        <div className="order-summary-card purple">
          <div>
            <small>Độ tin cậy hệ thống</small>
            <strong>99.9%</strong>
            <em>Đồng bộ dữ liệu thời gian thực</em>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="glass-card c-toolbar">
        <div className="c-toolbar-search" style={{ width: '100%' }}>
          <label className="c-search" style={{ maxWidth: '420px' }}>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </span>
            <input 
              type="search" 
              placeholder="Tìm kiếm theo tên, mã tham chiếu..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm"
            />
          </label>
        </div>
      </section>

      {/* Bảng dữ liệu */}
      <section className="glass-card c-resource" style={{ marginTop: '16px' }}>
        <div className="product-list-heading">
          <div>
            <span>DỮ LIỆU NGHIỆP VỤ</span>
            <h2>Danh sách {navInfo.title.toLowerCase()}</h2>
          </div>
          <small>{filteredRecords.length} mục dữ liệu</small>
        </div>

        <div className="table-scroll c-table-scroll" tabIndex="0" role="region" aria-label="Bảng dữ liệu">
          <table className="c-table">
            <thead>
              <tr>
                <th scope="col" className="c-check">
                  <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    onChange={e => handleSelectAll(e.target.checked)}
                    aria-label="Chọn tất cả"
                  />
                </th>
                <th>Tên định danh</th>
                <th>Mã tham chiếu</th>
                <th>Cập nhật gần nhất</th>
                <th>Số lượng</th>
                <th>Giá trị</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(r => {
                const isChecked = selectedIds.includes(r.id);
                return (
                  <tr key={r.id} className={isChecked ? 'selected' : ''}>
                    <td className="c-check">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleToggleSelect(r.id)}
                        aria-label={`Chọn ${r.name}`}
                      />
                    </td>
                    <td>
                      <strong style={{ fontSize: '14px', color: '#272016' }}>{r.name}</strong>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', background: '#f5efe4', padding: '2px 6px', borderRadius: '4px' }}>
                        {r.code}
                      </code>
                    </td>
                    <td><small>{r.date}</small></td>
                    <td><strong>{r.count}</strong> mục</td>
                    <td><strong style={{ color: '#10b981' }}>{r.value}</strong></td>
                    <td>
                      <span className={`badge badge-${r.statusClass}`} style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '6px' }}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          type="button" 
                          className="secondary-button" 
                          style={{ padding: '3px 8px', fontSize: '12px' }}
                          onClick={() => setViewingRecord(r)}
                        >
                          Chi tiết
                        </button>
                        <button 
                          type="button" 
                          className="secondary-button" 
                          style={{ padding: '3px 8px', fontSize: '12px', color: '#b23b3b' }}
                          onClick={() => {
                            setRecords(prev => prev.filter(item => item.id !== r.id));
                            showToast(`Đã xóa mục "${r.name}"!`);
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Thêm mới */}
      <DialogModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Thêm ${navInfo.title} mới`}
      >
        <form onSubmit={handleCreateRecord} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Tên định danh *
            </label>
            <input 
              type="text" 
              required
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              placeholder={`Nhập tên ${navInfo.title.toLowerCase()}...`}
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="secondary-button" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="primary-button">
              Lưu bản ghi
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Chi tiết */}
      <DialogModal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title={viewingRecord ? `Chi tiết: ${viewingRecord.name}` : ''}
      >
        {viewingRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
            <div style={{ padding: '12px 16px', background: '#f6f0e4', borderRadius: '10px' }}>
              <p style={{ margin: '0 0 6px 0' }}><strong>Mã hệ thống:</strong> {viewingRecord.id}</p>
              <p style={{ margin: '0 0 6px 0' }}><strong>Mã tham chiếu:</strong> {viewingRecord.code}</p>
              <p style={{ margin: 0 }}><strong>Phân hệ:</strong> {navInfo.title} ({navInfo.parent})</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" className="primary-button" onClick={() => setViewingRecord(null)}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </DialogModal>

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

