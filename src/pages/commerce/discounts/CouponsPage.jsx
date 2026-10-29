import React, { useState, useMemo } from 'react';
import CouponHeading from '../../../components/commerce/discounts/CouponHeading';
import CouponToolbar from '../../../components/commerce/discounts/CouponToolbar';
import CouponTable from '../../../components/commerce/discounts/CouponTable';
import DialogModal from '../../../components/ui/DialogModal';
import { initialCoupons } from '../../../data/mockCoupons';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [selectedIds, setSelectedIds] = useState([]);

  // Bộ lọc
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingCoupon, setViewingCoupon] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deletingCoupon, setDeletingCoupon] = useState(null);

  // Form tạo mã mới
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'Phần trăm (%)',
    value: 10,
    minSpend: 50.00,
    eligibility: 'Tất cả mọi người',
    usageLimit: 100,
    startDate: 'Hôm nay',
    endDate: '31 Thg 12, 2026'
  });

  // Toasts
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  // Lọc realtime
  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      if (typeFilter !== 'all' && c.discountType !== typeFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = c.code.toLowerCase().includes(q);
        const matchEl = c.eligibility.toLowerCase().includes(q);
        if (!matchCode && !matchEl) return false;
      }
      return true;
    });
  }, [coupons, typeFilter, statusFilter, searchQuery]);

  // Checkbox handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredCoupons.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} mã ưu đãi đã chọn không?`)) {
      setCoupons(prev => prev.filter(c => !selectedIds.includes(c.id)));
      showToast(`Đã xóa ${selectedIds.length} mã ưu đãi.`);
      setSelectedIds([]);
    }
  };

  // Xuất file CSV
  const handleExport = () => {
    const headers = ['Mã ưu đãi', 'Loại giảm', 'Giá trị', 'Đơn tối thiểu ($)', 'Đối tượng', 'Lượt dùng', 'Giới hạn', 'Trạng thái', 'Bắt đầu', 'Kết thúc'];
    const rows = filteredCoupons.map(c => [
      `"${c.code}"`,
      `"${c.discountType}"`,
      c.value,
      c.minSpend.toFixed(2),
      `"${c.eligibility}"`,
      c.usageCount,
      c.usageLimit,
      `"${c.status}"`,
      `"${c.startDate}"`,
      `"${c.endDate}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ma_giam_gia_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất danh sách mã giảm giá thành công!');
  };

  // Tạo mã mới
  const handleCreateCoupon = (e) => {
    e.preventDefault();
    if (!newCoupon.code.trim()) {
      showToast('Vui lòng nhập mã ưu đãi!', 'error');
      return;
    }

    const created = {
      id: `coup-${Date.now()}`,
      code: newCoupon.code.trim().toUpperCase(),
      discountType: newCoupon.discountType,
      value: parseFloat(newCoupon.value) || 0,
      minSpend: parseFloat(newCoupon.minSpend) || 0,
      eligibility: newCoupon.eligibility,
      status: 'Active',
      usageCount: 0,
      usageLimit: parseInt(newCoupon.usageLimit, 10) || 100,
      startDate: newCoupon.startDate,
      endDate: newCoupon.endDate
    };

    setCoupons([created, ...coupons]);
    setIsAddModalOpen(false);
    setNewCoupon({
      code: '',
      discountType: 'Phần trăm (%)',
      value: 10,
      minSpend: 50.00,
      eligibility: 'Tất cả mọi người',
      usageLimit: 100,
      startDate: 'Hôm nay',
      endDate: '31 Thg 12, 2026'
    });
    showToast(`Đã kích hoạt mã ưu đãi ${created.code}!`);
  };

  // Lưu chỉnh sửa
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingCoupon) return;
    setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? editingCoupon : c));
    setEditingCoupon(null);
    showToast(`Đã lưu cập nhật cho mã ${editingCoupon.code}!`);
  };

  // Xóa mã
  const handleConfirmDelete = () => {
    if (!deletingCoupon) return;
    setCoupons(prev => prev.filter(c => c.id !== deletingCoupon.id));
    setDeletingCoupon(null);
    showToast(`Đã xóa mã ưu đãi ${deletingCoupon.code}!`);
  };

  return (
    <div className="coupons-page" style={{ paddingBottom: '32px' }}>
      <CouponHeading 
        onExport={handleExport}
        onAddCoupon={() => setIsAddModalOpen(true)}
      />

      <CouponToolbar 
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <CouponTable 
        coupons={filteredCoupons}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onBulkDelete={handleBulkDelete}
        onClearSelection={handleClearSelection}
        onViewCoupon={setViewingCoupon}
        onEditCoupon={setEditingCoupon}
        onDeleteCoupon={setDeletingCoupon}
      />

      {/* Modal: Tạo mã mới */}
      <DialogModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Tạo mã giảm giá mới"
      >
        <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Mã khuyến mãi (Code) *
            </label>
            <input 
              type="text" 
              required
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8', textTransform: 'uppercase', fontWeight: '700' }}
              placeholder="VD: BIGSALE50"
              value={newCoupon.code}
              onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Hình thức giảm
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={newCoupon.discountType}
                onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
              >
                <option value="Phần trăm (%)">Phần trăm (%)</option>
                <option value="Số tiền cố định ($)">Số tiền cố định ($)</option>
                <option value="Miễn phí vận chuyển">Miễn phí vận chuyển</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Giá trị ưu đãi
              </label>
              <input 
                type="number" 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={newCoupon.value}
                onChange={e => setNewCoupon({ ...newCoupon, value: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Đơn hàng tối thiểu ($)
              </label>
              <input 
                type="number" 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={newCoupon.minSpend}
                onChange={e => setNewCoupon({ ...newCoupon, minSpend: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Giới hạn lượt dùng
              </label>
              <input 
                type="number" 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={newCoupon.usageLimit}
                onChange={e => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Đối tượng áp dụng
            </label>
            <select 
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newCoupon.eligibility}
              onChange={e => setNewCoupon({ ...newCoupon, eligibility: e.target.value })}
            >
              <option value="Tất cả mọi người">Tất cả mọi người</option>
              <option value="Khách hàng mới">Khách hàng mới</option>
              <option value="Khách hàng quen">Khách hàng quen</option>
              <option value="Khách VIP">Khách VIP</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button 
              type="button" 
              className="secondary-button"
              onClick={() => setIsAddModalOpen(false)}
            >
              Hủy
            </button>
            <button type="submit" className="primary-button">
              Lưu mã giảm giá
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Xem chi tiết mã */}
      <DialogModal 
        isOpen={Boolean(viewingCoupon)} 
        onClose={() => setViewingCoupon(null)}
        title={viewingCoupon ? `Chi tiết mã: ${viewingCoupon.code}` : ''}
      >
        {viewingCoupon && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', color: '#3c352a' }}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#fdf8ee', borderRadius: '12px', border: '2px dashed #d5be8e' }}>
              <strong style={{ fontSize: '26px', letterSpacing: '2px', color: '#885600', fontFamily: 'monospace' }}>
                {viewingCoupon.code}
              </strong>
              <div style={{ marginTop: '8px', color: '#554a39' }}>
                {viewingCoupon.discountType === 'Phần trăm (%)' ? `Giảm ${viewingCoupon.value}% giá trị đơn hàng` : viewingCoupon.discountType === 'Số tiền cố định ($)' ? `Giảm $${viewingCoupon.value} trực tiếp` : 'Miễn phí giao hàng'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <p><strong>Đơn tối thiểu:</strong> ${viewingCoupon.minSpend.toFixed(2)}</p>
              <p><strong>Đối tượng:</strong> {viewingCoupon.eligibility}</p>
              <p><strong>Lượt sử dụng:</strong> {viewingCoupon.usageCount} / {viewingCoupon.usageLimit}</p>
              <p><strong>Thời hạn:</strong> {viewingCoupon.startDate} - {viewingCoupon.endDate}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                className="secondary-button"
                onClick={() => setViewingCoupon(null)}
              >
                Đóng
              </button>
              <button 
                type="button" 
                className="primary-button"
                onClick={() => {
                  setEditingCoupon(viewingCoupon);
                  setViewingCoupon(null);
                }}
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* Modal: Chỉnh sửa mã */}
      <DialogModal 
        isOpen={Boolean(editingCoupon)} 
        onClose={() => setEditingCoupon(null)}
        title={editingCoupon ? `Chỉnh sửa: ${editingCoupon.code}` : ''}
      >
        {editingCoupon && (
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                  Giá trị ưu đãi
                </label>
                <input 
                  type="number" 
                  className="c-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                  value={editingCoupon.value}
                  onChange={e => setEditingCoupon({ ...editingCoupon, value: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                  Giới hạn lượt dùng
                </label>
                <input 
                  type="number" 
                  className="c-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                  value={editingCoupon.usageLimit}
                  onChange={e => setEditingCoupon({ ...editingCoupon, usageLimit: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                  Đơn tối thiểu ($)
                </label>
                <input 
                  type="number" 
                  className="c-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                  value={editingCoupon.minSpend}
                  onChange={e => setEditingCoupon({ ...editingCoupon, minSpend: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                  Trạng thái
                </label>
                <select 
                  className="c-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                  value={editingCoupon.status}
                  onChange={e => setEditingCoupon({ ...editingCoupon, status: e.target.value })}
                >
                  <option value="Active">Đang áp dụng</option>
                  <option value="Scheduled">Đã lên lịch</option>
                  <option value="Expired">Đã hết hạn</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                className="secondary-button"
                onClick={() => setEditingCoupon(null)}
              >
                Hủy
              </button>
              <button type="submit" className="primary-button">
                Lưu thay đổi
              </button>
            </div>
          </form>
        )}
      </DialogModal>

      {/* Modal: Xác nhận xóa mã */}
      <DialogModal 
        isOpen={Boolean(deletingCoupon)} 
        onClose={() => setDeletingCoupon(null)}
        title="Xác nhận xóa mã ưu đãi"
      >
        {deletingCoupon && (
          <div>
            <p style={{ marginBottom: '16px', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn xóa mã giảm giá <strong>{deletingCoupon.code}</strong> không? Khách hàng sẽ không thể sử dụng mã này được nữa.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                className="secondary-button"
                onClick={() => setDeletingCoupon(null)}
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="primary-button"
                style={{ background: '#b23b3b', borderColor: '#b23b3b', color: '#fff' }}
                onClick={handleConfirmDelete}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* Toasts thông báo */}
      <div className="toasts-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(t => (
          <div 
            key={t.id} 
            style={{
              background: t.type === 'error' ? '#8a2323' : '#27342b',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              fontSize: '13px',
              fontWeight: '500',
              animation: 'dialog-appear 0.2s ease-out'
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
