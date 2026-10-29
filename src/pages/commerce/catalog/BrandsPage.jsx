import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';

export default function BrandsPage() {
  const initialBrands = [
    { id: 'brand-1', name: 'Veylix Studio', origin: 'Việt Nam', productsCount: 48, revenue: 38400, status: 'Active' },
    { id: 'brand-2', name: 'Northline Goods', origin: 'Nhật Bản', productsCount: 32, revenue: 29500, status: 'Active' },
    { id: 'brand-3', name: 'Forma Living', origin: 'Đan Mạch', productsCount: 26, revenue: 18200, status: 'Active' },
    { id: 'brand-4', name: 'Kanso Design', origin: 'Hàn Quốc', productsCount: 18, revenue: 14600, status: 'Active' },
    { id: 'brand-5', name: 'Nomad Gear', origin: 'Mỹ', productsCount: 14, revenue: 9800, status: 'Active' }
  ];

  const [brands, setBrands] = useState(initialBrands);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [deletingBrand, setDeletingBrand] = useState(null);

  const [newBrand, setNewBrand] = useState({
    name: '',
    origin: 'Việt Nam',
    status: 'Active'
  });

  const [toasts, setToasts] = useState([]);
  const showToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  const filteredBrands = useMemo(() => {
    return brands.filter(b => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return b.name.toLowerCase().includes(q) || b.origin.toLowerCase().includes(q);
    });
  }, [brands, searchQuery]);

  const handleCreateBrand = (e) => {
    e.preventDefault();
    if (!newBrand.name.trim()) return;
    const created = {
      id: `brand-${Date.now()}`,
      name: newBrand.name.trim(),
      origin: newBrand.origin,
      productsCount: 0,
      revenue: 0,
      status: newBrand.status
    };
    setBrands([...brands, created]);
    setIsAddModalOpen(false);
    setNewBrand({ name: '', origin: 'Việt Nam', status: 'Active' });
    showToast(`Đã thêm thương hiệu "${created.name}" thành công!`);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingBrand) return;
    setBrands(prev => prev.map(b => b.id === editingBrand.id ? editingBrand : b));
    setEditingBrand(null);
    showToast(`Đã lưu cập nhật cho thương hiệu "${editingBrand.name}"!`);
  };

  const handleConfirmDelete = () => {
    if (!deletingBrand) return;
    setBrands(prev => prev.filter(b => b.id !== deletingBrand.id));
    setDeletingBrand(null);
    showToast(`Đã xóa thương hiệu "${deletingBrand.name}"!`);
  };

  return (
    <div className="brands-page" style={{ paddingBottom: '36px' }}>
      <header className="commerce-heading">
        <div>
          <div className="commerce-breadcrumb">
            <Link to="/overview">Tổng quan</Link>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </span>
            <Link to="/commerce/products">Sản phẩm</Link>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </span>
            <span>Thương hiệu</span>
          </div>
          <h1>Thương hiệu sản phẩm<span>.</span></h1>
        </div>

        <div className="commerce-heading-actions">
          <button type="button" className="primary-button" onClick={() => setIsAddModalOpen(true)}>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
              </svg>
            </span>
            + Thêm thương hiệu
          </button>
        </div>
      </header>

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
              placeholder="Tìm theo tên thương hiệu, xuất xứ..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm thương hiệu"
            />
          </label>
        </div>
      </section>

      {/* Bảng thương hiệu */}
      <section className="glass-card c-resource" style={{ marginTop: '16px' }}>
        <div className="product-list-heading">
          <div>
            <span>ĐỐI TÁC THƯƠNG HIỆU</span>
            <h2>Danh sách thương hiệu phân phối</h2>
          </div>
          <small>{filteredBrands.length} thương hiệu</small>
        </div>

        <div className="table-scroll c-table-scroll" tabIndex="0" role="region" aria-label="Bảng thương hiệu">
          <table className="c-table">
            <thead>
              <tr>
                <th>Thương hiệu</th>
                <th>Xuất xứ</th>
                <th>Sản phẩm</th>
                <th>Doanh thu mang lại</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBrands.map(b => (
                <tr key={b.id}>
                  <td>
                    <strong style={{ fontSize: '14px', color: '#272016' }}>{b.name}</strong>
                  </td>
                  <td>{b.origin}</td>
                  <td><strong>{b.productsCount}</strong> món</td>
                  <td><strong style={{ color: '#10b981' }}>${b.revenue.toLocaleString()}</strong></td>
                  <td>
                    <span className="badge badge-green" style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
                      Đang hoạt động
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        type="button" 
                        className="secondary-button" 
                        style={{ padding: '3px 10px', fontSize: '12px' }}
                        onClick={() => setEditingBrand(b)}
                      >
                        Sửa
                      </button>
                      <button 
                        type="button" 
                        className="secondary-button" 
                        style={{ padding: '3px 10px', fontSize: '12px', color: '#b23b3b' }}
                        onClick={() => setDeletingBrand(b)}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Thêm thương hiệu */}
      <DialogModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm thương hiệu mới"
      >
        <form onSubmit={handleCreateBrand} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Tên thương hiệu *
            </label>
            <input 
              type="text" 
              required
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              placeholder="VD: Veylix Studio"
              value={newBrand.name}
              onChange={e => setNewBrand({ ...newBrand, name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Quốc gia xuất xứ
            </label>
            <input 
              type="text" 
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newBrand.origin}
              onChange={e => setNewBrand({ ...newBrand, origin: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="secondary-button" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="primary-button">
              Lưu thương hiệu
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Sửa thương hiệu */}
      <DialogModal
        isOpen={Boolean(editingBrand)}
        onClose={() => setEditingBrand(null)}
        title={editingBrand ? `Chỉnh sửa: ${editingBrand.name}` : ''}
      >
        {editingBrand && (
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Tên thương hiệu
              </label>
              <input 
                type="text" 
                required
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingBrand.name}
                onChange={e => setEditingBrand({ ...editingBrand, name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Quốc gia xuất xứ
              </label>
              <input 
                type="text" 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingBrand.origin}
                onChange={e => setEditingBrand({ ...editingBrand, origin: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setEditingBrand(null)}>
                Hủy
              </button>
              <button type="submit" className="primary-button">
                Lưu thay đổi
              </button>
            </div>
          </form>
        )}
      </DialogModal>

      {/* Modal: Xác nhận xóa */}
      <DialogModal
        isOpen={Boolean(deletingBrand)}
        onClose={() => setDeletingBrand(null)}
        title="Xác nhận xóa thương hiệu"
      >
        {deletingBrand && (
          <div>
            <p style={{ lineHeight: '1.6', marginBottom: '16px' }}>
              Bạn có chắc chắn muốn xóa thương hiệu <strong>{deletingBrand.name}</strong> không?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setDeletingBrand(null)}>
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="primary-button" 
                style={{ background: '#b23b3b', borderColor: '#b23b3b' }}
                onClick={handleConfirmDelete}
              >
                Xác nhận xóa
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
