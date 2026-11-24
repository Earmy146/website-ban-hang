import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';
import api from '../../../services/api';

export default function BrandsPage() {
  const initialBrands = [
    { id: 'brand-1', name: 'Veylix Studio', origin: 'Việt Nam', productsCount: 48, revenue: 38400, status: 'Active' },
    { id: 'brand-2', name: 'Northline Goods', origin: 'Nhật Bản', productsCount: 32, revenue: 29500, status: 'Active' },
    { id: 'brand-3', name: 'Forma Living', origin: 'Đan Mạch', productsCount: 26, revenue: 18200, status: 'Active' },
    { id: 'brand-4', name: 'Kanso Design', origin: 'Hàn Quốc', productsCount: 18, revenue: 14600, status: 'Active' },
    { id: 'brand-5', name: 'Nomad Gear', origin: 'Mỹ', productsCount: 14, revenue: 9800, status: 'Active' }
  ];

  const [brands, setBrands] = useState(initialBrands);
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingBrand, setViewingBrand] = useState(null);
  const [editingBrand, setEditingBrand] = useState(null);
  const [deletingBrand, setDeletingBrand] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newBrand, setNewBrand] = useState({
    name: '',
    origin: 'Việt Nam',
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

  const loadBrands = useCallback(async () => {
    try {
      const [brandData, prodData] = await Promise.all([
        api.getBrands(),
        api.getProducts().catch(() => null),
      ]);
      if (Array.isArray(brandData)) {
        setBrands(brandData);
      }
      if (Array.isArray(prodData)) {
        setAllProducts(prodData.filter(p => !p.isDeleted));
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách thương hiệu', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const brandProductsMap = useMemo(() => {
    const map = {};
    allProducts.forEach(p => {
      const b = p.brand || '';
      if (!b) return;
      if (!map[b]) map[b] = [];
      map[b].push(p);
    });
    return map;
  }, [allProducts]);

  const kpis = useMemo(() => {
    const activeCount = brands.filter(b => b.status !== 'Inactive').length;
    const totalLinked = allProducts.length > 0
      ? allProducts.length
      : brands.reduce((s, b) => s + Number(b.productsCount || 0), 0);

    const sortedByRev = [...brands].sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0));
    const topBrand = sortedByRev[0] || { name: 'Veylix Studio', revenue: 38400 };
    const totalRevenue = brands.reduce((s, b) => s + Number(b.revenue || 0), 0);

    return {
      total: brands.length,
      activeCount,
      totalLinked,
      topBrandName: topBrand.name,
      topBrandRevenue: Number(topBrand.revenue || 0),
      totalRevenue,
    };
  }, [brands, allProducts]);

  const filteredBrands = useMemo(() => {
    return brands.filter(b => {
      if (statusFilter !== 'all') {
        const normalized = b.status === 'Inactive' ? 'Inactive' : 'Active';
        if (normalized !== statusFilter) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (b.name || '').toLowerCase().includes(q) || (b.origin || '').toLowerCase().includes(q);
    });
  }, [brands, searchQuery, statusFilter]);

  const viewingBrandProducts = useMemo(() => {
    if (!viewingBrand) return [];
    return allProducts.filter(p => p.brand === viewingBrand.name);
  }, [viewingBrand, allProducts]);

  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!newBrand.name.trim() || isSubmitting) return;
    const payload = {
      name: newBrand.name.trim(),
      origin: newBrand.origin.trim() || 'Việt Nam',
      status: newBrand.status
    };

    setIsSubmitting(true);
    try {
      const created = await api.createBrand(payload);
      if (created && created.id) {
        setBrands(prev => [...prev, created]);
      } else {
        await loadBrands();
      }
      setIsAddModalOpen(false);
      setNewBrand({ name: '', origin: 'Việt Nam', status: 'Active' });
      showToast(`Đã thêm thương hiệu "${payload.name}" thành công!`);
    } catch (err) {
      showToast(err.message || 'Không thể thêm thương hiệu', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingBrand || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: editingBrand.name.trim(),
        origin: editingBrand.origin.trim(),
        status: editingBrand.status || 'Active'
      };
      const updated = await api.updateBrand(editingBrand.id, payload);
      if (updated && updated.id) {
        setBrands(prev => prev.map(b => (b.id === editingBrand.id ? updated : b)));
      } else {
        await loadBrands();
      }
      setEditingBrand(null);
      showToast(`Đã lưu cập nhật cho thương hiệu "${payload.name}"!`);
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật thương hiệu', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBrand || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const targetName = deletingBrand.name;
      const targetId = deletingBrand.id;
      await api.deleteBrand(targetId);
      setBrands(prev => prev.filter(b => b.id !== targetId));
      setDeletingBrand(null);
      showToast(`Đã xóa thương hiệu "${targetName}"!`);
    } catch (err) {
      showToast(err.message || 'Không thể xóa thương hiệu', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const headers = ['Thương hiệu', 'Xuất xứ', 'Số sản phẩm', 'Doanh thu ($)', 'Trạng thái'];
    const rows = filteredBrands.map(b => [
      `"${b.name}"`,
      `"${b.origin}"`,
      brandProductsMap[b.name]?.length ?? b.productsCount ?? 0,
      Number(b.revenue || 0),
      `"${b.status || 'Active'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `thuong_hieu_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất danh sách thương hiệu thành công!');
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
          <button type="button" className="secondary-button" onClick={handleExport}>
            Xuất file
          </button>
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

      {/* 4 Thẻ KPI Tổng quan Thương hiệu */}
      <section className="order-summary-grid" style={{ marginBottom: '20px' }}>
        <div className="order-summary-card blue">
          <div>
            <small>Tổng thương hiệu phân phối</small>
            <strong>{kpis.total}</strong>
            <em>Đối tác chính hãng trên sàn</em>
          </div>
        </div>
        <div className="order-summary-card green">
          <div>
            <small>Thương hiệu đang hoạt động</small>
            <strong>{kpis.activeCount}</strong>
            <em>Đang mở bán cho khách</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Tổng sản phẩm liên kết</small>
            <strong>{kpis.totalLinked}</strong>
            <em>Bấm tên thương hiệu để xem SP</em>
          </div>
        </div>
        <div className="order-summary-card purple">
          <div>
            <small>Thương hiệu doanh thu dẫn đầu</small>
            <strong style={{ fontSize: '18px' }}>{kpis.topBrandName}</strong>
            <em>${kpis.topBrandRevenue.toLocaleString()} (Tổng: ${kpis.totalRevenue.toLocaleString()})</em>
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
            Tất cả ({brands.length})
          </button>
          <button
            type="button"
            className={statusFilter === 'Active' ? 'primary-button' : 'secondary-button'}
            style={{ padding: '6px 12px', fontSize: '12.5px' }}
            onClick={() => setStatusFilter('Active')}
          >
            Đang hoạt động ({brands.filter(b => b.status !== 'Inactive').length})
          </button>
          <button
            type="button"
            className={statusFilter === 'Inactive' ? 'primary-button' : 'secondary-button'}
            style={{ padding: '6px 12px', fontSize: '12.5px' }}
            onClick={() => setStatusFilter('Inactive')}
          >
            Ngừng hoạt động ({brands.filter(b => b.status === 'Inactive').length})
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
            <p>Bấm vào tên thương hiệu hoặc nút "Xem SP" để tra cứu các mặt hàng thuộc thương hiệu đó.</p>
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
              {filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px 20px', color: '#776c5b' }}>
                    Không tìm thấy thương hiệu nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredBrands.map(b => {
                  const realList = brandProductsMap[b.name];
                  const displayCount = realList && allProducts.length > 0 ? realList.length : (b.productsCount ?? 0);

                  return (
                    <tr key={b.id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => setViewingBrand(b)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                          title={`Xem sản phẩm thuộc thương hiệu "${b.name}"`}
                        >
                          <strong style={{ fontSize: '14px', color: '#885600', textDecoration: 'underline' }}>{b.name}</strong>
                        </button>
                      </td>
                      <td>{b.origin}</td>
                      <td><strong>{displayCount}</strong> món</td>
                      <td><strong style={{ color: '#10b981' }}>${Number(b.revenue || 0).toLocaleString()}</strong></td>
                      <td>
                        <span className={`badge badge-${b.status === 'Inactive' ? 'amber' : 'green'}`} style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
                          {b.status === 'Inactive' ? 'Ngừng hoạt động' : 'Đang hoạt động'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ padding: '3px 10px', fontSize: '12px' }}
                            onClick={() => setViewingBrand(b)}
                          >
                            Xem SP ({displayCount})
                          </button>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Xem sản phẩm thuộc Thương hiệu */}
      <DialogModal
        isOpen={Boolean(viewingBrand)}
        onClose={() => setViewingBrand(null)}
        title={viewingBrand ? `🏷️ Sản phẩm thuộc thương hiệu: ${viewingBrand.name}` : ''}
        wide={true}
      >
        {viewingBrand && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f5efe4', borderRadius: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <strong>Xuất xứ:</strong> {viewingBrand.origin} · <strong>Doanh thu:</strong> ${Number(viewingBrand.revenue || 0).toLocaleString()} · <strong>Số mặt hàng:</strong> {viewingBrandProducts.length} SP
              </div>
              <Link
                to={`/commerce/products?brand=${encodeURIComponent(viewingBrand.name)}`}
                className="primary-button"
                style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '12.5px' }}
                onClick={() => setViewingBrand(null)}
              >
                Lọc trên trang Sản phẩm &rarr;
              </Link>
            </div>

            {viewingBrandProducts.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#776c5b', background: '#faf6ee', borderRadius: '10px' }}>
                Hiện chưa có sản phẩm nào thuộc thương hiệu <strong>{viewingBrand.name}</strong> trong kho.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                {viewingBrandProducts.map(p => (
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
                        <small style={{ color: '#776c5b' }}>SKU: {p.sku} · Danh mục: {p.category}</small>
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
              <button type="button" className="secondary-button" onClick={() => setViewingBrand(null)}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </DialogModal>

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
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu thương hiệu'}
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
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Trạng thái
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingBrand.status || 'Active'}
                onChange={e => setEditingBrand({ ...editingBrand, status: e.target.value })}
              >
                <option value="Active">Đang hoạt động</option>
                <option value="Inactive">Ngừng hoạt động</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setEditingBrand(null)}>
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
