import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';
import api from '../../../services/api';

function toSlug(str = '') {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newCat, setNewCat] = useState({
    name: '',
    slug: '',
    icon: '📦',
    status: 'Active'
  });

  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const [catData, prodData] = await Promise.all([
        api.getCategories(),
        api.getProducts().catch(() => null),
      ]);
      if (Array.isArray(catData)) {
        setCategories(catData);
      }
      if (Array.isArray(prodData)) {
        setAllProducts(prodData.filter(p => !p.isDeleted));
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải danh mục', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Tính toán sản phẩm thực tế & doanh thu cho từng danh mục
  const categoryMetrics = useMemo(() => {
    const map = {};
    allProducts.forEach(p => {
      const cat = p.category || '';
      if (!cat) return;
      if (!map[cat]) {
        map[cat] = { items: [], revenue: 0 };
      }
      map[cat].items.push(p);
      map[cat].revenue += Number(p.revenue ?? (Number(p.price || 0) * Number(p.sales || 0)) ?? 0);
    });
    return map;
  }, [allProducts]);

  const kpis = useMemo(() => {
    const activeCount = categories.filter(c => c.status === 'Active').length;
    const totalLinked = allProducts.length > 0
      ? allProducts.length
      : categories.reduce((s, c) => s + Number(c.count || 0), 0);

    let topCatName = categories[0]?.name || '—';
    let topCatRevenue = 0;
    categories.forEach(c => {
      const rev = categoryMetrics[c.name]?.revenue || 0;
      if (rev >= topCatRevenue) {
        topCatRevenue = rev;
        topCatName = c.name;
      }
    });

    return {
      total: categories.length,
      activeCount,
      totalLinked,
      topCatName,
      topCatRevenue,
    };
  }, [categories, allProducts, categoryMetrics]);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (c.name || '').toLowerCase().includes(q) || (c.slug || '').toLowerCase().includes(q);
    });
  }, [categories, searchQuery, statusFilter]);

  const viewingCategoryProducts = useMemo(() => {
    if (!viewingCategory) return [];
    return allProducts.filter(p => p.category === viewingCategory.name);
  }, [viewingCategory, allProducts]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name.trim() || isSubmitting) return;
    const slug = newCat.slug.trim() || toSlug(newCat.name.trim());
    const payload = {
      name: newCat.name.trim(),
      slug,
      icon: newCat.icon || '📦',
      status: newCat.status,
      sortOrder: categories.length + 1
    };

    setIsSubmitting(true);
    try {
      const created = await api.createCategory(payload);
      if (created && created.id) {
        setCategories(prev => [...prev, created]);
      } else {
        await loadCategories();
      }
      setIsAddModalOpen(false);
      setNewCat({ name: '', slug: '', icon: '📦', status: 'Active' });
      showToast(`Đã thêm danh mục "${payload.name}" thành công!`);
    } catch (err) {
      showToast(err.message || 'Không thể thêm danh mục', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCategory || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: editingCategory.name.trim(),
        slug: editingCategory.slug || toSlug(editingCategory.name),
        icon: editingCategory.icon,
        status: editingCategory.status,
        sortOrder: editingCategory.sortOrder
      };
      const updated = await api.updateCategory(editingCategory.id, payload);
      if (updated && updated.id) {
        setCategories(prev => prev.map(c => (c.id === editingCategory.id ? updated : c)));
      } else {
        await loadCategories();
      }
      setEditingCategory(null);
      showToast(`Đã lưu cập nhật cho danh mục "${payload.name}"!`);
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật danh mục', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const targetName = deletingCategory.name;
      const targetId = deletingCategory.id;
      await api.deleteCategory(targetId);
      setCategories(prev => prev.filter(c => c.id !== targetId));
      setDeletingCategory(null);
      showToast(`Đã xóa danh mục "${targetName}"!`);
    } catch (err) {
      showToast(err.message || 'Không thể xóa danh mục', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const headers = ['Tên danh mục', 'Đường dẫn (Slug)', 'Biểu tượng', 'Số sản phẩm', 'Trạng thái', 'Thứ tự hiển thị'];
    const rows = filteredCategories.map(c => [
      `"${c.name}"`,
      `"${c.slug}"`,
      `"${c.icon}"`,
      categoryMetrics[c.name]?.items.length ?? c.count ?? 0,
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

      {/* 4 Thẻ KPI Tổng quan Danh mục */}
      <section className="order-summary-grid" style={{ marginBottom: '20px' }}>
        <div className="order-summary-card blue">
          <div>
            <small>Tổng số danh mục</small>
            <strong>{kpis.total}</strong>
            <em>Cấu trúc phân loại cửa hàng</em>
          </div>
        </div>
        <div className="order-summary-card green">
          <div>
            <small>Đang hiển thị trên Web</small>
            <strong>{kpis.activeCount}</strong>
            <em>Đang mở bán tại /store</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Tổng sản phẩm liên kết</small>
            <strong>{kpis.totalLinked}</strong>
            <em>Bấm tên danh mục để xem SP</em>
          </div>
        </div>
        <div className="order-summary-card purple">
          <div>
            <small>Danh mục dẫn đầu doanh số</small>
            <strong style={{ fontSize: '18px' }}>{kpis.topCatName}</strong>
            <em>${Math.round(kpis.topCatRevenue || 18450).toLocaleString()} doanh thu tích lũy</em>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="glass-card c-toolbar">
        <div className="c-toolbar-filters" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={statusFilter === 'all' ? 'primary-button' : 'secondary-button'}
            style={{ padding: '6px 12px', fontSize: '12.5px' }}
            onClick={() => setStatusFilter('all')}
          >
            Tất cả ({categories.length})
          </button>
          <button
            type="button"
            className={statusFilter === 'Active' ? 'primary-button' : 'secondary-button'}
            style={{ padding: '6px 12px', fontSize: '12.5px' }}
            onClick={() => setStatusFilter('Active')}
          >
            Đang hiển thị ({categories.filter(c => c.status === 'Active').length})
          </button>
          <button
            type="button"
            className={statusFilter === 'Hidden' ? 'primary-button' : 'secondary-button'}
            style={{ padding: '6px 12px', fontSize: '12.5px' }}
            onClick={() => setStatusFilter('Hidden')}
          >
            Tạm ẩn ({categories.filter(c => c.status !== 'Active').length})
          </button>
        </div>

        <div className="c-toolbar-search">
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
            <p>Bấm vào tên danh mục hoặc nút "Xem SP" để kiểm tra nhanh các mặt hàng thuộc nhóm đó.</p>
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
                <th>Doanh thu nhóm</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px 20px', color: '#776c5b' }}>
                    Không tìm thấy danh mục nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCategories.map(c => {
                  const realCount = categoryMetrics[c.name]?.items.length;
                  const displayCount = realCount !== undefined && allProducts.length > 0 ? realCount : (c.count ?? 0);
                  const catRev = categoryMetrics[c.name]?.revenue || 0;

                  return (
                    <tr key={c.id}>
                      <td><strong>#{c.sortOrder}</strong></td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setViewingCategory(c)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          title={`Xem các sản phẩm thuộc danh mục "${c.name}"`}
                        >
                          <span style={{ fontSize: '20px' }}>{c.icon}</span>
                          <strong style={{ fontSize: '14px', color: '#885600', textDecoration: 'underline' }}>{c.name}</strong>
                        </button>
                      </td>
                      <td>
                        <code style={{ fontSize: '12px', background: '#f5efe4', padding: '3px 8px', borderRadius: '4px' }}>
                          /{c.slug}
                        </code>
                      </td>
                      <td>
                        <strong>{displayCount}</strong> sản phẩm
                      </td>
                      <td>
                        <strong style={{ color: '#276840' }}>${Math.round(catRev).toLocaleString()}</strong>
                      </td>
                      <td>
                        <span className={`badge badge-${c.status === 'Active' ? 'green' : 'amber'}`} style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
                          {c.status === 'Active' ? 'Đang hiển thị' : 'Tạm ẩn'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ padding: '3px 10px', fontSize: '12px' }}
                            onClick={() => setViewingCategory(c)}
                          >
                            Xem SP ({displayCount})
                          </button>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Xem danh sách sản phẩm thuộc Danh mục */}
      <DialogModal
        isOpen={Boolean(viewingCategory)}
        onClose={() => setViewingCategory(null)}
        title={viewingCategory ? `${viewingCategory.icon || '📦'} Sản phẩm thuộc danh mục: ${viewingCategory.name}` : ''}
        wide={true}
      >
        {viewingCategory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f5efe4', borderRadius: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <strong>Đường dẫn:</strong> <code>/{viewingCategory.slug}</code> · <strong>Số mặt hàng:</strong> {viewingCategoryProducts.length} sản phẩm thực tế
              </div>
              <Link
                to={`/commerce/products?category=${encodeURIComponent(viewingCategory.name)}`}
                className="primary-button"
                style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '12.5px' }}
                onClick={() => setViewingCategory(null)}
              >
                Lọc trên trang Sản phẩm &rarr;
              </Link>
            </div>

            {viewingCategoryProducts.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#776c5b', background: '#faf6ee', borderRadius: '10px' }}>
                Hiện chưa có sản phẩm nào gắn trực tiếp vào danh mục <strong>{viewingCategory.name}</strong>. Bạn có thể bấm nút bên trên để thêm sản phẩm vào danh mục này!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                {viewingCategoryProducts.map(p => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: '#fff',
                      borderRadius: '10px',
                      border: '1px solid #ece0cd',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={p.image || '/assets/images/products/everyday-tee.png'}
                        alt={p.name}
                        style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e6dac8' }}
                      />
                      <div>
                        <strong style={{ display: 'block', color: '#272016' }}>{p.name}</strong>
                        <small style={{ color: '#776c5b' }}>SKU: {p.sku} · Thương hiệu: {p.brand || 'Veylix Studio'}</small>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ color: '#276840', fontSize: '14.5px', display: 'block' }}>${Number(p.price || 0).toFixed(2)}</strong>
                      <small style={{ color: Number(p.inventory) > 10 ? '#5b675f' : '#b45309' }}>Tồn kho: {p.inventory ?? 0} món</small>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setViewingCategory(null)}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </DialogModal>

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
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu danh mục'}
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
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
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
                disabled={isSubmitting}
                style={{ background: '#b23b3b', borderColor: '#b23b3b' }}
                onClick={handleConfirmDelete}
              >
                {isSubmitting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        )}
      </DialogModal>

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
