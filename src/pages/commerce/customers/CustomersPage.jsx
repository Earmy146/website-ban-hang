import React, { useState, useMemo } from 'react';
import CustomerHeading from '../../../components/commerce/customers/CustomerHeading';
import CustomerSummaryCards from '../../../components/commerce/customers/CustomerSummaryCards';
import CustomerToolbar from '../../../components/commerce/customers/CustomerToolbar';
import CustomerTable from '../../../components/commerce/customers/CustomerTable';
import DialogModal from '../../../components/ui/DialogModal';
import { initialCustomers } from '../../../data/mockCustomers';

export default function CustomersPage() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [selectedIds, setSelectedIds] = useState([]);

  // Bộ lọc
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [marketingFilter, setMarketingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);

  // Form thêm khách hàng mới
  const [newCust, setNewCust] = useState({
    name: '',
    email: '',
    phone: '',
    location: 'TP. Hồ Chí Minh, Việt Nam',
    segment: 'Khách mới',
    marketing: 'Đã đăng ký'
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
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (segmentFilter !== 'all' && c.segment !== segmentFilter) return false;
      if (marketingFilter !== 'all' && c.marketing !== marketingFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchEmail = c.email.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        const matchLoc = c.location?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchLoc) return false;
      }
      return true;
    });
  }, [customers, segmentFilter, marketingFilter, searchQuery]);

  // Checkbox handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredCustomers.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Batch actions
  const handleBulkEmail = () => {
    showToast(`Đã chuẩn bị chiến dịch gửi email cho ${selectedIds.length} khách hàng!`);
    setSelectedIds([]);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Bạn có chắc muốn xóa ${selectedIds.length} khách hàng đã chọn không?`)) {
      setCustomers(prev => prev.filter(c => !selectedIds.includes(c.id)));
      showToast(`Đã xóa thành công ${selectedIds.length} khách hàng.`);
      setSelectedIds([]);
    }
  };

  // Xuất file CSV
  const handleExport = () => {
    const headers = ['Họ tên', 'Email', 'Số điện thoại', 'Phân khúc', 'Đơn hàng', 'Tổng chi tiêu ($)', 'Đơn TB ($)', 'Địa chỉ', 'Tiếp thị', 'Đơn gần nhất'];
    const rows = filteredCustomers.map(c => [
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.phone || ''}"`,
      `"${c.segment}"`,
      c.ordersCount,
      c.totalSpent.toFixed(2),
      c.aov.toFixed(2),
      `"${c.location}"`,
      `"${c.marketing}"`,
      `"${c.lastOrder}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danh_sach_khach_hang_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất danh sách khách hàng thành công!');
  };

  // Thêm khách hàng mới
  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCust.name.trim() || !newCust.email.trim()) {
      showToast('Vui lòng nhập đầy đủ tên và email khách hàng!', 'error');
      return;
    }

    const initials = newCust.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const created = {
      id: `cust-${Date.now()}`,
      name: newCust.name.trim(),
      email: newCust.email.trim(),
      phone: newCust.phone.trim(),
      avatar: initials || 'KH',
      segment: newCust.segment,
      ordersCount: 0,
      totalSpent: 0,
      aov: 0,
      lastOrder: 'Chưa có đơn hàng',
      location: newCust.location,
      marketing: newCust.marketing,
      status: 'Active'
    };

    setCustomers([created, ...customers]);
    setIsAddModalOpen(false);
    setNewCust({
      name: '',
      email: '',
      phone: '',
      location: 'TP. Hồ Chí Minh, Việt Nam',
      segment: 'Khách mới',
      marketing: 'Đã đăng ký'
    });
    showToast(`Đã thêm khách hàng ${created.name} thành công!`);
  };

  // Lưu chỉnh sửa thông tin khách hàng
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? editingCustomer : c));
    setEditingCustomer(null);
    showToast(`Đã lưu thông tin khách hàng ${editingCustomer.name}!`);
  };

  // Xóa khách hàng
  const handleConfirmDelete = () => {
    if (!deletingCustomer) return;
    setCustomers(prev => prev.filter(c => c.id !== deletingCustomer.id));
    setDeletingCustomer(null);
    showToast(`Đã xóa khách hàng ${deletingCustomer.name}!`);
  };

  return (
    <div className="customers-page" style={{ paddingBottom: '32px' }}>
      <CustomerHeading 
        onExport={handleExport}
        onAddCustomer={() => setIsAddModalOpen(true)}
      />

      <CustomerSummaryCards customers={customers} />

      <CustomerToolbar 
        segmentFilter={segmentFilter}
        onSegmentChange={setSegmentFilter}
        marketingFilter={marketingFilter}
        onMarketingChange={setMarketingFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <CustomerTable 
        customers={filteredCustomers}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onBulkEmail={handleBulkEmail}
        onBulkDelete={handleBulkDelete}
        onClearSelection={handleClearSelection}
        onViewCustomer={setViewingCustomer}
        onEditCustomer={setEditingCustomer}
        onDeleteCustomer={setDeletingCustomer}
      />

      {/* Modal: Thêm khách hàng mới */}
      <DialogModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm khách hàng mới"
        wide={true}
      >
        <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Họ và tên khách hàng *
              </label>
              <input 
                type="text" 
                required
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                placeholder="VD: Nguyễn Hoàng Long"
                value={newCust.name}
                onChange={e => setNewCust({ ...newCust, name: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Địa chỉ Email *
              </label>
              <input 
                type="email" 
                required
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                placeholder="VD: hoanglong@example.com"
                value={newCust.email}
                onChange={e => setNewCust({ ...newCust, email: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Số điện thoại
              </label>
              <input 
                type="tel" 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                placeholder="VD: +84 908 123 456"
                value={newCust.phone}
                onChange={e => setNewCust({ ...newCust, phone: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Phân khúc khách hàng
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={newCust.segment}
                onChange={e => setNewCust({ ...newCust, segment: e.target.value })}
              >
                <option value="Khách mới">Khách mới</option>
                <option value="Khách quen">Khách quen</option>
                <option value="Khách VIP">Khách VIP</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Địa chỉ / Tỉnh thành
              </label>
              <input 
                type="text" 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                placeholder="VD: Ba Đình, Hà Nội"
                value={newCust.location}
                onChange={e => setNewCust({ ...newCust, location: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Đăng ký nhận tin tiếp thị
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={newCust.marketing}
                onChange={e => setNewCust({ ...newCust, marketing: e.target.value })}
              >
                <option value="Đã đăng ký">Đã đăng ký nhận tin</option>
                <option value="Chưa đăng ký">Chưa đăng ký nhận tin</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
            <button 
              type="button" 
              className="secondary-button"
              onClick={() => setIsAddModalOpen(false)}
            >
              Hủy
            </button>
            <button type="submit" className="primary-button">
              Lưu khách hàng
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Xem hồ sơ khách hàng */}
      <DialogModal 
        isOpen={Boolean(viewingCustomer)} 
        onClose={() => setViewingCustomer(null)}
        title={viewingCustomer ? `Hồ sơ khách hàng: ${viewingCustomer.name}` : ''}
        wide={true}
      >
        {viewingCustomer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '14px', color: '#3c352a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: '#f6f0e4', borderRadius: '12px' }}>
              <div className="customer-avatar" style={{ width: '56px', height: '56px', fontSize: '20px' }}>
                {viewingCustomer.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px 0' }}>{viewingCustomer.name}</h3>
                <p style={{ margin: 0, color: '#776c5b' }}>{viewingCustomer.email} · {viewingCustomer.phone || 'Chưa có SĐT'}</p>
              </div>
              <div>
                <span className="customer-segment vip">{viewingCustomer.segment}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', textAlign: 'center' }}>
              <div style={{ padding: '12px', background: '#fff', borderRadius: '10px', border: '1px solid #ebdccb' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Tổng đơn hàng</small>
                <strong style={{ fontSize: '20px' }}>{viewingCustomer.ordersCount}</strong>
              </div>
              <div style={{ padding: '12px', background: '#fff', borderRadius: '10px', border: '1px solid #ebdccb' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Tổng chi tiêu</small>
                <strong style={{ fontSize: '20px', color: '#2b6e41' }}>${viewingCustomer.totalSpent.toFixed(2)}</strong>
              </div>
              <div style={{ padding: '12px', background: '#fff', borderRadius: '10px', border: '1px solid #ebdccb' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Giá trị TB (AOV)</small>
                <strong style={{ fontSize: '20px' }}>${viewingCustomer.aov.toFixed(2)}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '14px', background: '#faf6ee', borderRadius: '10px' }}>
              <div>
                <p><strong>Địa chỉ:</strong> {viewingCustomer.location}</p>
                <p><strong>Đơn hàng gần nhất:</strong> {viewingCustomer.lastOrder}</p>
              </div>
              <div>
                <p><strong>Trạng thái tiếp thị:</strong> {viewingCustomer.marketing}</p>
                <p><strong>Trạng thái tài khoản:</strong> Đang hoạt động</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                className="secondary-button"
                onClick={() => setViewingCustomer(null)}
              >
                Đóng
              </button>
              <button 
                type="button" 
                className="primary-button"
                onClick={() => {
                  setEditingCustomer(viewingCustomer);
                  setViewingCustomer(null);
                }}
              >
                Chỉnh sửa thông tin
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* Modal: Chỉnh sửa thông tin khách hàng */}
      <DialogModal 
        isOpen={Boolean(editingCustomer)} 
        onClose={() => setEditingCustomer(null)}
        title={editingCustomer ? `Chỉnh sửa: ${editingCustomer.name}` : ''}
        wide={true}
      >
        {editingCustomer && (
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                  Họ và tên
                </label>
                <input 
                  type="text" 
                  required
                  className="c-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                  value={editingCustomer.name}
                  onChange={e => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                  Email
                </label>
                <input 
                  type="email" 
                  required
                  className="c-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                  value={editingCustomer.email}
                  onChange={e => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                  Số điện thoại
                </label>
                <input 
                  type="tel" 
                  className="c-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                  value={editingCustomer.phone || ''}
                  onChange={e => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                  Phân khúc
                </label>
                <select 
                  className="c-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                  value={editingCustomer.segment}
                  onChange={e => setEditingCustomer({ ...editingCustomer, segment: e.target.value })}
                >
                  <option value="Khách mới">Khách mới</option>
                  <option value="Khách quen">Khách quen</option>
                  <option value="Khách VIP">Khách VIP</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                  Địa chỉ
                </label>
                <input 
                  type="text" 
                  className="c-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                  value={editingCustomer.location}
                  onChange={e => setEditingCustomer({ ...editingCustomer, location: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                  Đăng ký nhận tin
                </label>
                <select 
                  className="c-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                  value={editingCustomer.marketing}
                  onChange={e => setEditingCustomer({ ...editingCustomer, marketing: e.target.value })}
                >
                  <option value="Đã đăng ký">Đã đăng ký nhận tin</option>
                  <option value="Chưa đăng ký">Chưa đăng ký nhận tin</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                className="secondary-button"
                onClick={() => setEditingCustomer(null)}
              >
                Hủy
              </button>
              <button type="submit" className="primary-button">
                Lưu cập nhật
              </button>
            </div>
          </form>
        )}
      </DialogModal>

      {/* Modal: Xác nhận xóa khách hàng */}
      <DialogModal 
        isOpen={Boolean(deletingCustomer)} 
        onClose={() => setDeletingCustomer(null)}
        title="Xác nhận xóa khách hàng"
      >
        {deletingCustomer && (
          <div>
            <p style={{ marginBottom: '16px', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn xóa hồ sơ khách hàng <strong>{deletingCustomer.name}</strong> ({deletingCustomer.email}) không? Lịch sử đơn hàng trước đây sẽ được lưu trữ ẩn.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                className="secondary-button"
                onClick={() => setDeletingCustomer(null)}
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
