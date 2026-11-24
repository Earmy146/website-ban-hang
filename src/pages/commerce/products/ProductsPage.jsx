import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { initialProducts } from '../../../data/mockProducts';
import ProductHeading from '../../../components/commerce/products/ProductHeading';
import ProductSummaryCards from '../../../components/commerce/products/ProductSummaryCards';
import ProductToolbar from '../../../components/commerce/products/ProductToolbar';
import ProductTable from '../../../components/commerce/products/ProductTable';
import DialogModal from '../../../components/ui/DialogModal';
import api from '../../../services/api';

export default function ProductsPage() {
  const location = useLocation();
  const fileInputRef = useRef(null);

  // 1. Quản lý State Dữ liệu từ Backend
  const [products, setProducts] = useState(initialProducts);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2. Quản lý Bộ lọc & Tìm kiếm
  const [searchQuery, setSearchQuery] = useState(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get('sku') || sp.get('search') || '';
  });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get('category') || '';
  });
  const [selectedBrand, setSelectedBrand] = useState(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get('brand') || '';
  });
  const [selectedStatus, setSelectedStatus] = useState(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get('status') || '';
  });
  const [showDeleted, setShowDeleted] = useState(false);

  // 3. Quản lý Checkbox chọn hàng loạt
  const [selectedIds, setSelectedIds] = useState([]);

  // 4. Quản lý Dialog Modals
  const [activeModal, setActiveModal] = useState(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get('action') === 'new' ? { type: 'add' } : null;
  }); // { type, data } | null

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    if (sp.has('category')) setSelectedCategory(sp.get('category') || '');
    if (sp.has('brand')) setSelectedBrand(sp.get('brand') || '');
    if (sp.has('sku') || sp.has('search')) setSearchQuery(sp.get('sku') || sp.get('search') || '');
    if (sp.has('status')) setSelectedStatus(sp.get('status') || '');
    if (sp.get('action') === 'new') setActiveModal({ type: 'add' });
  }, [location.search]);

  // 5. Quản lý Toasts thông báo
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const loadProducts = useCallback(async (includeDeletedFlag = showDeleted) => {
    try {
      const data = await api.getProducts({ includeDeleted: includeDeletedFlag });
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách sản phẩm', 'error');
    }
  }, [showDeleted, showToast]);

  useEffect(() => {
    loadProducts(showDeleted);
    setSelectedIds([]);
  }, [showDeleted, loadProducts]);

  // 6. Lọc sản phẩm theo realtime state (kết hợp bộ lọc Sản phẩm đã xóa isDeleted)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (showDeleted) {
        if (!p.isDeleted) return false;
      } else {
        if (p.isDeleted) return false;
      }

      // Tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (p.name || '').toLowerCase().includes(q);
        const matchesSku = (p.sku || '').toLowerCase().includes(q);
        const matchesBrand = (p.brand || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesBrand) return false;
      }
      // Lọc danh mục
      if (selectedCategory && p.category !== selectedCategory) {
        return false;
      }
      // Lọc thương hiệu
      if (selectedBrand && p.brand !== selectedBrand) {
        return false;
      }
      // Lọc trạng thái
      if (selectedStatus && p.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, selectedStatus, showDeleted]);

  const distinctCategories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  }, [products]);

  const activeCatalogProducts = useMemo(() => {
    return showDeleted ? filteredProducts : products.filter(p => !p.isDeleted);
  }, [products, filteredProducts, showDeleted]);

  // 7. Xử lý Checkbox
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (isChecked) => {
    if (isChecked) {
      setSelectedIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const count = selectedIds.length;
      await api.bulkArchiveProducts(selectedIds);
      await loadProducts(showDeleted);
      setSelectedIds([]);
      showToast(`✓ Đã lưu trữ ${count} sản phẩm thành công!`);
    } catch (err) {
      showToast(err.message || 'Không thể lưu trữ sản phẩm đã chọn', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // 8. Thao tác CRUD Sản phẩm qua API
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const form = e.target;
    const payload = {
      name: form.name.value.trim(),
      sku: form.sku.value.trim() || `VX-${Math.floor(1000 + Math.random() * 9000)}`,
      category: form.category.value,
      brand: 'Veylix Studio',
      price: parseFloat(form.price.value),
      inventory: parseInt(form.inventory.value, 10) || 0,
      desc: form.desc.value.trim() || 'Mô tả sản phẩm chuẩn Veylix.',
      image: '/assets/images/products/everyday-tee.png',
    };

    setIsSubmitting(true);
    try {
      const created = await api.createProduct(payload);
      if (created && created.id) {
        setProducts(prev => [created, ...prev]);
      } else {
        await loadProducts(showDeleted);
      }
      showToast(`✓ Đã thêm sản phẩm "${payload.name}" vào danh mục!`);
      setActiveModal(null);
    } catch (err) {
      showToast(err.message || 'Lỗi khi thêm sản phẩm', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProductSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || !activeModal?.data) return;
    const form = e.target;
    const payload = {
      name: form.name.value.trim(),
      price: parseFloat(form.price.value),
      inventory: parseInt(form.inventory.value, 10) || 0,
      status: form.status.value,
      category: activeModal.data.category,
      brand: activeModal.data.brand,
      desc: activeModal.data.desc,
    };

    setIsSubmitting(true);
    try {
      const updated = await api.updateProduct(activeModal.data.id, payload);
      if (updated && updated.id) {
        setProducts(prev => prev.map(p => (p.id === activeModal.data.id ? updated : p)));
      } else {
        await loadProducts(showDeleted);
      }
      showToast(`✓ Đã cập nhật sản phẩm "${payload.name}" thành công!`);
      setActiveModal(null);
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật sản phẩm', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicateProduct = async (p) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const clone = await api.duplicateProduct(p.id);
      if (clone && clone.id) {
        setProducts(prev => [clone, ...prev]);
      } else {
        await loadProducts(showDeleted);
      }
      showToast(`✓ Đã nhân bản sản phẩm "${p.name}"!`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi nhân bản sản phẩm', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (p) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.deleteProduct(p.id);
      await loadProducts(showDeleted);
      setSelectedIds(prev => prev.filter(x => x !== p.id));
      showToast(`✓ Đã lưu trữ/xóa sản phẩm "${p.name}" khỏi danh mục!`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa sản phẩm', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImportSampleCSV = async () => {
    if (isSubmitting) return;
    const suffix = String(Date.now()).slice(-4);
    const sampleProducts = [
      {
        name: 'Mũ lưỡi trai Classic Cap',
        sku: `VX-CAP-${suffix}`,
        category: 'Phụ kiện thời trang',
        brand: 'Veylix Studio',
        inventory: 65,
        price: 25.00,
        image: '/assets/images/products/everyday-tee.png',
        desc: 'Mũ lưỡi trai cotton thêu logo Veylix tinh tế.',
      },
      {
        name: 'Sổ tay bìa da Leather Journal',
        sku: `VX-JRN-${suffix}`,
        category: 'Văn phòng phẩm',
        brand: 'Forma Living',
        inventory: 40,
        price: 30.00,
        image: '/assets/images/products/notebook-set.png',
        desc: 'Sổ tay da thật ruột giấy kraft cổ điển.',
      },
    ];

    setIsSubmitting(true);
    try {
      const imported = await api.importProducts(sampleProducts);
      await loadProducts(showDeleted);
      const count = Array.isArray(imported) ? imported.length : sampleProducts.length;
      showToast(`✓ Đã nhập thành công ${count} sản phẩm mới từ tệp CSV!`);
      setActiveModal(null);
    } catch (err) {
      showToast(err.message || 'Lỗi khi nhập danh sách sản phẩm', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUploadCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        throw new Error('Tệp CSV không có dữ liệu sản phẩm hợp lệ');
      }
      const suffix = String(Date.now()).slice(-4);
      const parsed = lines.slice(1).map((line, idx) => {
        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
        return {
          name: cols[1] || cols[0] || `Sản phẩm CSV #${idx + 1}`,
          sku: cols[2] || `VX-CSV-${suffix}-${idx + 1}`,
          category: cols[3] || 'Thời trang & May mặc',
          brand: cols[4] || 'Veylix Studio',
          inventory: parseInt(cols[6], 10) || 30,
          price: parseFloat(cols[8]) || 29.00,
          image: '/assets/images/products/everyday-tee.png',
          desc: 'Sản phẩm nhập từ tệp CSV.',
        };
      });
      const imported = await api.importProducts(parsed);
      await loadProducts(showDeleted);
      const count = Array.isArray(imported) ? imported.length : parsed.length;
      showToast(`✓ Đã nhập thành công ${count} sản phẩm từ tệp "${file.name}"!`);
      setActiveModal(null);
    } catch (err) {
      showToast(err.message || 'Không thể đọc tệp CSV', 'error');
    } finally {
      setIsSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleShareProduct = (p) => {
    const url = `${window.location.origin}/commerce/products?sku=${p.sku}`;
    try { navigator.clipboard.writeText(url); } catch {}
    showToast(`✓ Đã sao chép liên kết chia sẻ của "${p.name}"!`);
  };

  const handleExportCSV = () => {
    const headers = ['ID,Tên sản phẩm,Mã SKU,Danh mục,Thương hiệu,Trạng thái,Tồn kho,Đã bán,Doanh số ($)'];
    const rows = filteredProducts.map(p => 
      `"${p.id}","${p.name}","${p.sku}","${p.category}","${p.brand}","${p.status}",${p.inventory},${p.sales || 0},${p.revenue || 0}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Veylix_Products_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✓ Đã xuất tệp CSV sản phẩm thành công!');
  };

  return (
    <>
      {/* 1. Header & Actions */}
      <ProductHeading 
        onImport={() => setActiveModal({ type: 'import' })}
        onExport={handleExportCSV}
        onAddProduct={() => setActiveModal({ type: 'add' })}
      />

      {/* 2. KPI Summary Cards (Tính toán tự động theo State) */}
      <ProductSummaryCards products={activeCatalogProducts} />

      {/* 3. Toolbar Lọc & Tìm kiếm */}
      <ProductToolbar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        showDeleted={showDeleted}
        onToggleDeleted={setShowDeleted}
        categories={distinctCategories}
      />

      {(selectedCategory || selectedBrand || selectedStatus || searchQuery) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '10px',
            padding: '8px 14px',
            background: '#faf5ea',
            border: '1px solid #e5d8c3',
            borderRadius: '10px',
            fontSize: '13px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <strong>Đang lọc:</strong>
            {selectedCategory && <span className="badge badge-amber">Danh mục: {selectedCategory}</span>}
            {selectedBrand && <span className="badge badge-indigo">Thương hiệu: {selectedBrand}</span>}
            {selectedStatus && <span className="badge badge-green">Trạng thái: {selectedStatus}</span>}
            {searchQuery && <span className="badge badge-blue">Từ khóa: "{searchQuery}"</span>}
          </div>
          <button
            type="button"
            className="secondary-button"
            style={{ padding: '3px 10px', fontSize: '12px' }}
            onClick={() => {
              setSelectedCategory('');
              setSelectedBrand('');
              setSelectedStatus('');
              setSearchQuery('');
            }}
          >
            ✕ Xóa tất cả bộ lọc
          </button>
        </div>
      )}

      {/* 4. Bảng Sản phẩm (React Component Table) */}
      <ProductTable 
        products={filteredProducts}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onBulkArchive={handleBulkArchive}
        onClearSelection={handleClearSelection}
        onViewProduct={p => setActiveModal({ type: 'view', data: p })}
        onEditProduct={p => setActiveModal({ type: 'edit', data: p })}
        onDuplicateProduct={handleDuplicateProduct}
        onShareProduct={handleShareProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      {/* 5. Dialog Modals */}
      <DialogModal
        isOpen={Boolean(activeModal)}
        title={
          activeModal?.type === 'add' ? 'Thêm sản phẩm mới vào danh mục' :
          activeModal?.type === 'edit' ? `Chỉnh sửa: ${activeModal?.data?.name}` :
          activeModal?.type === 'view' ? `Chi tiết: ${activeModal?.data?.name}` :
          activeModal?.type === 'import' ? 'Nhập danh sách sản phẩm từ tệp (CSV / Excel)' : ''
        }
        onClose={() => setActiveModal(null)}
      >
        {/* Form Thêm sản phẩm */}
        {activeModal?.type === 'add' && (
          <form onSubmit={handleAddProductSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Tên sản phẩm *</label>
                <input name="name" required placeholder="Ví dụ: Áo sơ mi Oxford, Balo du lịch..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Danh mục</label>
                  <select name="category" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }}>
                    <option value="Thời trang & May mặc">Thời trang & May mặc</option>
                    <option value="Balo & Túi xách">Balo & Túi xách</option>
                    <option value="Đồ gia dụng & Nội thất">Đồ gia dụng & Nội thất</option>
                    <option value="Thiết bị công nghệ">Thiết bị công nghệ</option>
                    <option value="Phụ kiện thời trang">Phụ kiện thời trang</option>
                    <option value="Văn phòng phẩm">Văn phòng phẩm</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Mã sản phẩm (SKU)</label>
                  <input name="sku" placeholder="VD: VX-2009 (để trống tự sinh)" defaultValue="" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Giá bán ($) *</label>
                  <input name="price" type="number" step="0.01" min="0" required defaultValue="49.00" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Số lượng tồn kho ban đầu</label>
                  <input name="inventory" type="number" min="0" required defaultValue="100" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Mô tả ngắn</label>
                <textarea name="desc" rows={3} placeholder="Mô tả tính năng, chất liệu nổi bật của sản phẩm..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', resize: 'vertical', background: '#fff' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '12px', borderTop: '1px solid #e8decb' }}>
                <button type="button" onClick={() => setActiveModal(null)} style={{ padding: '9px 18px', background: '#fff', border: '1px solid #d4c7b2', borderRadius: '9px', cursor: 'pointer', fontSize: '13px' }}>Hủy</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '9px 20px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', opacity: isSubmitting ? 0.65 : 1 }}>
                  {isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Form Chỉnh sửa sản phẩm */}
        {activeModal?.type === 'edit' && activeModal.data && (
          <form onSubmit={handleEditProductSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Tên sản phẩm</label>
                <input name="name" defaultValue={activeModal.data.name} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Giá bán ($)</label>
                  <input name="price" type="number" step="0.01" min="0" defaultValue={activeModal.data.price} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Số lượng tồn kho</label>
                  <input name="inventory" type="number" min="0" defaultValue={activeModal.data.inventory} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Trạng thái kinh doanh</label>
                <select name="status" defaultValue={activeModal.data.status} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }}>
                  <option value="Active">Đang bán (Active)</option>
                  <option value="Low stock">Sắp hết hàng (Low stock)</option>
                  <option value="Out of stock">Hết hàng (Out of stock)</option>
                  <option value="Draft">Bản nháp (Draft)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '12px', borderTop: '1px solid #e8decb' }}>
                <button type="button" onClick={() => setActiveModal(null)} style={{ padding: '9px 18px', background: '#fff', border: '1px solid #d4c7b2', borderRadius: '9px', cursor: 'pointer', fontSize: '13px' }}>Đóng</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '9px 20px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', opacity: isSubmitting ? 0.65 : 1 }}>
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Xem chi tiết sản phẩm */}
        {activeModal?.type === 'view' && activeModal.data && (
          <div>
            <div style={{ padding: '16px', background: '#f9f5ed', borderRadius: '12px', marginBottom: '14px', fontSize: '13px' }}>
              <strong style={{ display: 'block', fontSize: '16px', marginBottom: '10px' }}>{activeModal.data.name}</strong>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div><span style={{ color: '#685947' }}>Mã SKU:</span> <strong>{activeModal.data.sku}</strong></div>
                <div><span style={{ color: '#685947' }}>Giá niêm yết:</span> <strong>${Number(activeModal.data.price || 0).toFixed(2)}</strong></div>
                <div><span style={{ color: '#685947' }}>Tồn kho:</span> <strong style={{ color: '#25975d' }}>{activeModal.data.inventory} chiếc</strong></div>
                <div><span style={{ color: '#685947' }}>Đã bán:</span> <strong>{activeModal.data.sales || 0} sản phẩm</strong></div>
                <div><span style={{ color: '#685947' }}>Doanh số:</span> <strong style={{ color: '#b45309' }}>${((activeModal.data.revenue || 0) / 1000).toFixed(1)}K</strong></div>
                <div><span style={{ color: '#685947' }}>Trạng thái:</span> <strong style={{ color: '#25975d' }}>{activeModal.data.isDeleted ? 'Đã lưu trữ' : activeModal.data.status}</strong></div>
              </div>
              <p style={{ margin: 0, color: '#685947', fontSize: '12px', lineHeight: 1.6 }}>{activeModal.data.desc}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setActiveModal({ type: 'edit', data: activeModal.data })} style={{ padding: '9px 18px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                Chỉnh sửa sản phẩm
              </button>
            </div>
          </div>
        )}

        {/* Nhập file CSV */}
        {activeModal?.type === 'import' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileUploadCSV}
              />
              <div 
                style={{ border: '2px dashed #c9baa1', borderRadius: '14px', padding: '30px 20px', textAlign: 'center', backgroundColor: '#fffdfa', cursor: isSubmitting ? 'wait' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                onClick={handleImportSampleCSV}
              >
                <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                  {isSubmitting ? 'Đang nhập dữ liệu lên máy chủ...' : 'Nhấp vào đây để chọn tệp CSV mẫu nhập thử nghiệm'}
                </strong>
                <span style={{ fontSize: '12px', color: '#7c7162' }}>Hỗ trợ định dạng .csv, .xlsx</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={isSubmitting}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Tải tệp CSV từ máy
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogModal>

      {/* 6. Toasts thông báo */}
      <div id="toast-region" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className="toast" style={{ marginBottom: '8px', borderColor: t.type === 'error' ? '#c53030' : undefined }}>
            <span className="icon" aria-hidden="true" style={{ color: t.type === 'error' ? '#c53030' : '#25975d', fontWeight: 'bold' }}>
              {t.type === 'error' ? '✕' : '✓'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </>
  );
}
