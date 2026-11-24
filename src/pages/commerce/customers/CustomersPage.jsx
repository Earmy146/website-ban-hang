import React, { useState, useMemo, useEffect, useCallback } from 'react';
import CustomerHeading from '../../../components/commerce/customers/CustomerHeading';
import CustomerSummaryCards from '../../../components/commerce/customers/CustomerSummaryCards';
import CustomerToolbar from '../../../components/commerce/customers/CustomerToolbar';
import CustomerTable from '../../../components/commerce/customers/CustomerTable';
import DialogModal from '../../../components/ui/DialogModal';
import { initialCustomers } from '../../../data/mockCustomers';
import api from '../../../services/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bộ lọc
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [marketingFilter, setMarketingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false);

  // Form gửi email hàng loạt
  const [emailForm, setEmailForm] = useState({
    subject: 'Ưu đãi đặc quyền dành riêng cho khách hàng thân thiết Veylix Studio',
    content: 'Xin chào quý khách,\n\nCảm ơn bạn đã đồng hành cùng Veylix Studio. Nhập ngay mã ưu đãi HELLO10 khi mua sắm trực tuyến tại cửa hàng của chúng tôi để nhận chiết khấu 10% cho bộ sưu tập mới nhất!\n\nTrân trọng,\nĐội ngũ Veylix Studio'
  });

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
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const data = await api.getCustomers();
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách khách hàng', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Lọc realtime
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (segmentFilter !== 'all' && c.segment !== segmentFilter) return false;
      if (marketingFilter !== 'all' && c.marketing !== marketingFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (c.name || '').toLowerCase().includes(q);
        const matchEmail = (c.email || '').toLowerCase().includes(q);
        const matchPhone = (c.phone || '').toLowerCase().includes(q);
        const matchLoc = (c.location || '').toLowerCase().includes(q);
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
    if (selectedIds.length === 0) return;
    setIsBulkEmailModalOpen(true);
  };

  const handleSendBulkEmail = async (e) => {
    e.preventDefault();
    if (isSubmitting || selectedIds.length === 0) return;
    if (!emailForm.subject.trim() || !emailForm.content.trim()) {
      showToast('Vui lòng nhập đầy đủ tiêu đề và nội dung email!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.bulkEmailCustomers({
        ids: selectedIds,
        subject: emailForm.subject.trim(),
        content: emailForm.content.trim(),
      });
      const count = res?.sentCount ?? selectedIds.length;
      setIsBulkEmailModalOpen(false);
      setSelectedIds([]);
      showToast(`Đã gửi thành công chiến dịch email tới ${count} khách hàng!`);
    } catch (err) {
      showToast(err.message || 'Không thể gửi email hàng loạt', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const count = selectedIds.length;
      await api.bulkDeleteCustomers(selectedIds);
      await loadCustomers();
      setSelectedIds([]);
      setIsBulkDeleteModalOpen(false);
      showToast(`Đã xóa thành công ${count} khách hàng.`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi xóa khách hàng hàng loạt', 'error');
    } finally {
      setIsSubmitting(false);
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
      Number(c.totalSpent || 0).toFixed(2),
      Number(c.aov || 0).toFixed(2),
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
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!newCust.name.trim() || !newCust.email.trim()) {
      showToast('Vui lòng nhập đầy đủ tên và email khách hàng!', 'error');
      return;
    }

    const payload = {
      name: newCust.name.trim(),
      email: newCust.email.trim(),
      phone: newCust.phone.trim(),
      location: newCust.location,
      segment: newCust.segment,
      marketing: newCust.marketing
    };

    setIsSubmitting(true);
    try {
      const created = await api.createCustomer(payload);
      if (created && created.id) {
        setCustomers(prev => [created, ...prev]);
      } else {
        await loadCustomers();
      }
      setIsAddModalOpen(false);
      setNewCust({
        name: '',
        email: '',
        phone: '',
        location: 'TP. Hồ Chí Minh, Việt Nam',
        segment: 'Khách mới',
        marketing: 'Đã đăng ký'
      });
      showToast(`Đã thêm khách hàng ${payload.name} thành công!`);
    } catch (err) {
      showToast(err.message || 'Không thể thêm khách hàng', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lưu chỉnh sửa thông tin khách hàng
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingCustomer || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: editingCustomer.name.trim(),
        email: editingCustomer.email.trim(),
        phone: editingCustomer.phone || '',
        location: editingCustomer.location || '',
        segment: editingCustomer.segment,
        marketing: editingCustomer.marketing
      };
      const updated = await api.updateCustomer(editingCustomer.id, payload);
      if (updated && updated.id) {
        setCustomers(prev => prev.map(c => (c.id === editingCustomer.id ? updated : c)));
      } else {
        await loadCustomers();
      }
      setEditingCustomer(null);
      showToast(`Đã lưu thông tin khách hàng ${payload.name}!`);
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật thông tin khách hàng', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa khách hàng lẻ
  const handleConfirmDelete = async () => {
    if (!deletingCustomer || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const targetId = deletingCustomer.id;
      const targetName = deletingCustomer.name;
      await api.deleteCustomer(targetId);
      setCustomers(prev => prev.filter(c => c.id !== targetId));
      setSelectedIds(prev => prev.filter(id => id !== targetId));
      setDeletingCustomer(null);
      showToast(`Đã xóa khách hàng ${targetName}!`);
    } catch (err) {
      showToast(err.message || 'Không thể xóa khách hàng', 'error');
    } finally {
      setIsSubmitting(false);
    }
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

      {/* Modal: Gửi email hàng loạt */}
      <DialogModal
        isOpen={isBulkEmailModalOpen}
        onClose={() => setIsBulkEmailModalOpen(false)}
        title={`Gửi chiến dịch Email hàng loạt (${selectedIds.length} khách hàng)`}
        wide={true}
      >
        <form onSubmit={handleSendBulkEmail} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="secondary-button"
              style={{ padding: '4px 10px', fontSize: '12px' }}
              onClick={() => setEmailForm({
                subject: 'Ưu đãi đặc quyền 10% từ Veylix Studio',
                content: 'Xin chào quý khách,\n\nNhập ngay mã HELLO10 tại cửa hàng trực tuyến Veylix để nhận ưu đãi 10% cho đơn hàng tiếp theo của bạn!'
              })}
            >
              Mẫu ưu đãi 10%
            </button>
            <button
              type="button"
              className="secondary-button"
              style={{ padding: '4px 10px', fontSize: '12px' }}
              onClick={() => setEmailForm({
                subject: 'Ra mắt Bộ sưu tập Tối giản Mới — Miễn phí giao hàng',
                content: 'Chào bạn,\n\nVeylix vừa ra mắt các thiết kế mới nhất trong tuần này. Áp dụng mã SHIPFREE để được miễn phí vận chuyển toàn quốc!'
              })}
            >
              Mẫu ra mắt BST mới
            </button>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Tiêu đề Email (Subject) *
            </label>
            <input
              type="text"
              required
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={emailForm.subject}
              onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Nội dung thông điệp *
            </label>
            <textarea
              required
              rows={5}
              className="c-field"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={emailForm.content}
              onChange={e => setEmailForm({ ...emailForm, content: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" className="secondary-button" onClick={() => setIsBulkEmailModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi chiến dịch...' : `Gửi ngay (${selectedIds.length} người nhận)`}
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Xác nhận xóa khách hàng hàng loạt */}
      <DialogModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        title="Xác nhận xóa khách hàng đã chọn"
      >
        <div>
          <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
            Bạn có chắc chắn muốn xóa <strong>{selectedIds.length} hồ sơ khách hàng</strong> đã chọn khỏi danh sách quản lý không?
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="secondary-button" onClick={() => setIsBulkDeleteModalOpen(false)}>
              Hủy bỏ
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={isSubmitting}
              style={{ background: '#b23b3b', borderColor: '#b23b3b', color: '#fff' }}
              onClick={handleConfirmBulkDelete}
            >
              {isSubmitting ? 'Đang xóa...' : `Xác nhận xóa (${selectedIds.length})`}
            </button>
          </div>
        </div>
      </DialogModal>

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
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu khách hàng'}
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
                <strong style={{ fontSize: '20px' }}>{viewingCustomer.ordersCount || 0}</strong>
              </div>
              <div style={{ padding: '12px', background: '#fff', borderRadius: '10px', border: '1px solid #ebdccb' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Tổng chi tiêu</small>
                <strong style={{ fontSize: '20px', color: '#2b6e41' }}>${Number(viewingCustomer.totalSpent || 0).toFixed(2)}</strong>
              </div>
              <div style={{ padding: '12px', background: '#fff', borderRadius: '10px', border: '1px solid #ebdccb' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Giá trị TB (AOV)</small>
                <strong style={{ fontSize: '20px' }}>${Number(viewingCustomer.aov || 0).toFixed(2)}</strong>
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
                  value={editingCustomer.location || ''}
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
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu cập nhật'}
              </button>
            </div>
          </form>
        )}
      </DialogModal>

      {/* Modal: Xác nhận xóa khách hàng lẻ */}
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
                disabled={isSubmitting}
                style={{ background: '#b23b3b', borderColor: '#b23b3b', color: '#fff' }}
                onClick={handleConfirmDelete}
              >
                {isSubmitting ? 'Đang xóa...' : 'Xác nhận xóa'}
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
