import React, { useState, useMemo } from 'react';
import { initialProducts } from '../../../data/mockProducts';
import ProductHeading from '../../../components/commerce/products/ProductHeading';
import ProductSummaryCards from '../../../components/commerce/products/ProductSummaryCards';
import ProductToolbar from '../../../components/commerce/products/ProductToolbar';
import ProductTable from '../../../components/commerce/products/ProductTable';
import DialogModal from '../../../components/ui/DialogModal';

export default function ProductsPage() {
  // 1. Quản lý State Dữ liệu (Sẵn sàng 100% thay bằng fetch('/api/products') từ Backend)
  const [products, setProducts] = useState(initialProducts);

  // 2. Quản lý Bộ lọc & Tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  // 3. Quản lý Checkbox chọn hàng loạt
  const [selectedIds, setSelectedIds] = useState([]);

  // 4. Quản lý Dialog Modals
  const [activeModal, setActiveModal] = useState(null); // { type, data } | null

  // 5. Quản lý Toasts thông báo
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  // 6. Lọc sản phẩm theo realtime state
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesBrand) return false;
      }
      // Lọc danh mục
      if (selectedCategory && p.category !== selectedCategory) {
        return false;
      }
      // Lọc trạng thái
      if (selectedStatus && p.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

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

  const handleBulkArchive = () => {
    setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
    showToast(`✓ Đã lưu trữ ${selectedIds.length} sản phẩm thành công!`);
    setSelectedIds([]);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // 8. Thao tác CRUD Sản phẩm
  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const newProduct = {
      id: `prod-${Date.now()}`,
      name: form.name.value.trim() || 'Sản phẩm mới',
      sku: form.sku.value.trim() || `VX-${Math.floor(1000 + Math.random() * 9000)}`,
      category: form.category.value,
      brand: 'Veylix Studio',
      status: 'Active',
      inventory: parseInt(form.inventory.value, 10) || 50,
      maxInventory: 100,
      sales: 0,
      revenue: 0,
      trend: '+0.0%',
      trendUp: true,
      rating: 5.0,
      date: 'Vừa xong',
      image: '/assets/images/products/everyday-tee.png',
      price: parseFloat(form.price.value) || 29.00,
      desc: form.desc.value.trim() || 'Mô tả sản phẩm chuẩn Veylix.'
    };

    setProducts(prev => [newProduct, ...prev]);
    showToast(`✓ Đã thêm sản phẩm "${newProduct.name}" vào danh mục!`);
    setActiveModal(null);
  };

  const handleEditProductSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const updatedName = form.name.value.trim();
    const updatedPrice = parseFloat(form.price.value) || 0;
    const updatedStock = parseInt(form.inventory.value, 10) || 0;
    const updatedStatus = form.status.value;

    setProducts(prev => prev.map(p => {
      if (p.id === activeModal.data.id) {
        return {
          ...p,
          name: updatedName || p.name,
          price: updatedPrice,
          inventory: updatedStock,
          status: updatedStatus
        };
      }
      return p;
    }));

    showToast(`✓ Đã cập nhật sản phẩm "${updatedName}" thành công!`);
    setActiveModal(null);
  };

  const handleDuplicateProduct = (p) => {
    const clone = {
      ...p,
      id: `prod-${Date.now()}`,
      name: `${p.name} (Bản sao)`,
      sku: `${p.sku}-CP`,
      sales: 0,
      revenue: 0,
      date: 'Vừa xong'
    };
    setProducts(prev => [clone, ...prev]);
    showToast(`✓ Đã nhân bản sản phẩm "${p.name}"!`);
  };

  const handleDeleteProduct = (p) => {
    setProducts(prev => prev.filter(x => x.id !== p.id));
    setSelectedIds(prev => prev.filter(x => x !== p.id));
    showToast(`✓ Đã xóa sản phẩm "${p.name}" khỏi danh mục!`, 'info');
  };

  const handleShareProduct = (p) => {
    const url = `${window.location.origin}/commerce/products?sku=${p.sku}`;
    try { navigator.clipboard.writeText(url); } catch (err) {}
    showToast(`✓ Đã sao chép liên kết chia sẻ của "${p.name}"!`);
  };

  const handleExportCSV = () => {
    const headers = ['ID,Tên sản phẩm,Mã SKU,Danh mục,Thương hiệu,Trạng thái,Tồn kho,Đã bán,Doanh số ($)'];
    const rows = products.map(p => 
      `"${p.id}","${p.name}","${p.sku}","${p.category}","${p.brand}","${p.status}",${p.inventory},${p.sales},${p.revenue}`
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
      <ProductSummaryCards products={products} />

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
      />

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
                  <input name="sku" placeholder="VX-2009" defaultValue="VX-2009" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Giá bán ($) *</label>
                  <input name="price" type="number" step="0.01" required defaultValue="49.00" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Số lượng tồn kho ban đầu</label>
                  <input name="inventory" type="number" required defaultValue="100" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Mô tả ngắn</label>
                <textarea name="desc" rows={3} placeholder="Mô tả tính năng, chất liệu nổi bật của sản phẩm..." style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', resize: 'vertical', background: '#fff' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '12px', borderTop: '1px solid #e8decb' }}>
                <button type="button" onClick={() => setActiveModal(null)} style={{ padding: '9px 18px', background: '#fff', border: '1px solid #d4c7b2', borderRadius: '9px', cursor: 'pointer', fontSize: '13px' }}>Hủy</button>
                <button type="submit" style={{ padding: '9px 20px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Lưu sản phẩm</button>
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
                  <input name="price" type="number" step="0.01" defaultValue={activeModal.data.price} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Số lượng tồn kho</label>
                  <input name="inventory" type="number" defaultValue={activeModal.data.inventory} required style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c7b2', fontSize: '13px', outline: 'none', background: '#fff' }} />
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
                <button type="submit" style={{ padding: '9px 20px', background: '#25211d', color: '#fff', border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Lưu thay đổi</button>
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
                <div><span style={{ color: '#685947' }}>Giá niêm yết:</span> <strong>${activeModal.data.price?.toFixed(2)}</strong></div>
                <div><span style={{ color: '#685947' }}>Tồn kho:</span> <strong style={{ color: '#25975d' }}>{activeModal.data.inventory} chiếc</strong></div>
                <div><span style={{ color: '#685947' }}>Đã bán:</span> <strong>{activeModal.data.sales} sản phẩm</strong></div>
                <div><span style={{ color: '#685947' }}>Doanh số:</span> <strong style={{ color: '#b45309' }}>${(activeModal.data.revenue / 1000).toFixed(1)}K</strong></div>
                <div><span style={{ color: '#685947' }}>Trạng thái:</span> <strong style={{ color: '#25975d' }}>{activeModal.data.status}</strong></div>
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
              <div 
                style={{ border: '2px dashed #c9baa1', borderRadius: '14px', padding: '30px 20px', textAlign: 'center', backgroundColor: '#fffdfa', cursor: 'pointer' }}
                onClick={() => {
                  // Giả lập nhập thêm 2 sản phẩm mẫu từ file CSV
                  const imported = [
                    {
                      id: `prod-imp-${Date.now()}-1`,
                      name: 'Mũ lưỡi trai Classic Cap',
                      sku: 'VX-1013',
                      category: 'Phụ kiện thời trang',
                      brand: 'Veylix Studio',
                      status: 'Active',
                      inventory: 65,
                      maxInventory: 100,
                      sales: 45,
                      revenue: 1125,
                      trend: '+9.2%',
                      trendUp: true,
                      rating: 4.8,
                      date: 'Vừa xong',
                      image: '/assets/images/products/everyday-tee.png',
                      price: 25.00,
                      desc: 'Mũ lưỡi trai cotton thêu logo Veylix tinh tế.'
                    },
                    {
                      id: `prod-imp-${Date.now()}-2`,
                      name: 'Sổ tay bìa da Leather Journal',
                      sku: 'VX-1014',
                      category: 'Văn phòng phẩm',
                      brand: 'Forma Living',
                      status: 'Active',
                      inventory: 40,
                      maxInventory: 80,
                      sales: 22,
                      revenue: 660,
                      trend: '+4.0%',
                      trendUp: true,
                      rating: 4.9,
                      date: 'Vừa xong',
                      image: '/assets/images/products/notebook-set.png',
                      price: 30.00,
                      desc: 'Sổ tay da thật ruột giấy kraft cổ điển.'
                    }
                  ];
                  setProducts(prev => [...imported, ...prev]);
                  showToast('✓ Đã nhập thành công 2 sản phẩm mới từ tệp CSV!');
                  setActiveModal(null);
                }}
              >
                <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Nhấp vào đây để chọn tệp CSV mẫu nhập thử nghiệm</strong>
                <span style={{ fontSize: '12px', color: '#7c7162' }}>Hỗ trợ định dạng .csv, .xlsx</span>
              </div>
            </div>
          </div>
        )}
      </DialogModal>

      {/* 6. Toasts thông báo */}
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
