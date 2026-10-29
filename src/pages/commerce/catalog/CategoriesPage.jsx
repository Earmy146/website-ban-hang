import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';

export default function CategoriesPage() {
  const initialCategories = [
    { id: 'cat-1', name: 'Thời trang & May mặc', slug: 'thoi-trang-may-mac', count: 42, icon: '👕', status: 'Active', sortOrder: 1 },
    { id: 'cat-2', name: 'Balo & Túi xách', slug: 'balo-tui-xach', count: 28, icon: '🎒', status: 'Active', sortOrder: 2 },
    { id: 'cat-3', name: 'Đồ gia dụng & Nội thất', slug: 'do-gia-dung', count: 35, icon: '☕', status: 'Active', sortOrder: 3 },
    { id: 'cat-4', name: 'Thiết bị công nghệ', slug: 'thiet-bi-cong-nghe', count: 19, icon: '🖱️', status: 'Active', sortOrder: 4 },
    { id: 'cat-5', name: 'Phụ kiện đời sống', slug: 'phu-kien-doi-song', count: 15, icon: '👓', status: 'Active', sortOrder: 5 },
    { id: 'cat-6', name: 'Bộ sưu tập mùa hè', slug: 'bo-suu-tap-mua-he', count: 12, icon: '☀️', status: 'Hidden', sortOrder: 6 }
  ];

  const [categories, setCategories] = useState(initialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);

  const [newCat, setNewCat] = useState({
    name: '',
    slug: '',
    icon: '📦',
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

  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
    });
  }, [categories, searchQuery]);

  const handleCreateCategory = (e) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    const slug = newCat.slug.trim() || newCat.name.toLowerCase().replace(/\s+/g, '-');
    const created = {
      id: `cat-${Date.now()}`,
      name: newCat.name.trim(),
      slug,
      icon: newCat.icon,
      count: 0,
      status: newCat.status,
      sortOrder: categories.length + 1
    };

    setCategories([...categories, created]);
    setIsAddModalOpen(false);
    setNewCat({ name: '', slug: '', icon: '📦', status: 'Active' });
    showToast(`Đã thêm danh mục "${created.name}" thành công!`);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    setCategories(prev => prev.map(c => c.id === editingCategory.id ? editingCategory : c));
    setEditingCategory(null);
    showToast(`Đã lưu cập nhật cho danh mục "${editingCategory.name}"!`);
  };

  const handleConfirmDelete = () => {
    if (!deletingCategory) return;
    setCategories(prev => prev.filter(c => c.id !== deletingCategory.id));
    setDeletingCategory(null);
    showToast(`Đã xóa danh mục "${deletingCategory.name}"!`);
  };

  const handleExport = () => {
    const headers = ['Tên danh mục', 'Đường dẫn (Slug)', 'Biểu tượng', 'Số sản phẩm', 'Trạng thái', 'Thứ tự hiển thị'];
    const rows = filteredCategories.map(c => [
      `"${c.name}"`,
      `"${c.slug}"`,
      `"${c.icon}"`,
      c.count,
      `"${c.status}"`,
      c.sortOrder
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danh_muc_san_pham_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất danh sách danh mục thành công!');
  };

  return (
    <div className="categories-page" style={{ paddingBottom: '36px' }}>
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
            <span>Danh mục sản phẩm</span>
          </div>
          <h1>Danh mục sản phẩm<span>.</span></h1>
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
            + Thêm danh mục
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
              placeholder="Tìm theo tên danh mục, đường dẫn slug..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm danh mục"
            />
          </label>
        </div>
      </section>

      {/* Bảng danh mục */}
      <section className="glass-card c-resource" style={{ marginTop: '16px' }}>
        <div className="product-list-heading">
          <div>
            <span>PHÂN LOẠI HÀNG HÓA</span>
            <h2>Cấu trúc danh mục sản phẩm</h2>
          </div>
          <small>{filteredCategories.length} danh mục</small>
        </div>

        <div className="table-scroll c-table-scroll" tabIndex="0" role="region" aria-label="Bảng danh mục">
          <table className="c-table">
            <thead>
              <tr>
                <th>Thứ tự</th>
                <th>Tên danh mục</th>
                <th>Đường dẫn (Slug)</th>
                <th>Sản phẩm liên kết</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px 20px', color: '#776c5b' }}>
                    Không tìm thấy danh mục nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCategories.map(c => (
                  <tr key={c.id}>
                    <td><strong>#{c.sortOrder}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>{c.icon}</span>
                        <strong style={{ fontSize: '14px', color: '#272016' }}>{c.name}</strong>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', background: '#f5efe4', padding: '3px 8px', borderRadius: '4px' }}>
                        /{c.slug}
                      </code>
                    </td>
                    <td>
                      <strong>{c.count}</strong> sản phẩm
                    </td>
                    <td>
                      <span className={`badge badge-${c.status === 'Active' ? 'green' : 'amber'}`} style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
                        {c.status === 'Active' ? 'Đang hiển thị' : 'Tạm ẩn'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          type="button" 
                          className="secondary-button" 
                          style={{ padding: '3px 10px', fontSize: '12px' }}
                          onClick={() => setEditingCategory(c)}
                        >
                          Sửa
                        </button>
                        <button 
                          type="button" 
                          className="secondary-button" 
                          style={{ padding: '3px 10px', fontSize: '12px', color: '#b23b3b' }}
                          onClick={() => setDeletingCategory(c)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Thêm danh mục */}
      <DialogModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm danh mục sản phẩm mới"
      >
        <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Tên danh mục *
            </label>
            <input 
              type="text" 
              required
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              placeholder="VD: Thời trang & May mặc"
              value={newCat.name}
              onChange={e => setNewCat({ ...newCat, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Biểu tượng (Icon emoji)
              </label>
              <input 
                type="text" 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={newCat.icon}
                onChange={e => setNewCat({ ...newCat, icon: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Trạng thái
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={newCat.status}
                onChange={e => setNewCat({ ...newCat, status: e.target.value })}
              >
                <option value="Active">Hiển thị trên web</option>
                <option value="Hidden">Tạm ẩn</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="secondary-button" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="primary-button">
              Lưu danh mục
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Sửa danh mục */}
      <DialogModal
        isOpen={Boolean(editingCategory)}
        onClose={() => setEditingCategory(null)}
        title={editingCategory ? `Chỉnh sửa danh mục: ${editingCategory.name}` : ''}
      >
        {editingCategory && (
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Tên danh mục
              </label>
              <input 
                type="text" 
                required
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingCategory.name}
                onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                  Biểu tượng
                </label>
                <input 
                  type="text" 
                  className="c-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                  value={editingCategory.icon}
                  onChange={e => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                  Trạng thái
                </label>
                <select 
                  className="c-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                  value={editingCategory.status}
                  onChange={e => setEditingCategory({ ...editingCategory, status: e.target.value })}
                >
                  <option value="Active">Hiển thị trên web</option>
                  <option value="Hidden">Tạm ẩn</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setEditingCategory(null)}>
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
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        title="Xác nhận xóa danh mục"
      >
        {deletingCategory && (
          <div>
            <p style={{ lineHeight: '1.6', marginBottom: '16px' }}>
              Bạn có chắc chắn muốn xóa danh mục <strong>{deletingCategory.name}</strong> không? Các sản phẩm trong danh mục này sẽ được chuyển về nhóm "Chưa phân loại".
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setDeletingCategory(null)}>
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

