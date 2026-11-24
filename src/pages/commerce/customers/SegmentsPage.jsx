import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';
import api from '../../../services/api';

export default function SegmentsPage() {
  const initialSegments = [
    { id: 'seg-1', name: 'Khách hàng VIP', count: 18, criteria: 'Tổng chi tiêu > $1,000 & tối thiểu 5 đơn', aov: 142.50, color: '#f59e0b' },
    { id: 'seg-2', name: 'Khách quen thân thiết', count: 45, criteria: 'Đã hoàn thành từ 3 đơn trở lên', aov: 82.30, color: '#10b981' },
    { id: 'seg-3', name: 'Khách hàng mới', count: 64, criteria: 'Đã đặt 1 đơn trong vòng 30 ngày qua', aov: 46.20, color: '#3b82f6' },
    { id: 'seg-4', name: 'Có nguy cơ rời bỏ', count: 12, criteria: 'Không phát sinh đơn sau hơn 90 ngày', aov: 58.00, color: '#ef4444' },
    { id: 'seg-5', name: 'Người dùng quan tâm', count: 88, criteria: 'Đã đăng ký tài khoản và nhận tin nhưng chưa mua', aov: 0, color: '#8b5cf6' }
  ];

  const [segments, setSegments] = useState(initialSegments);
  const [coupons, setCoupons] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [deletingSegment, setDeletingSegment] = useState(null);
  const [offeringSegment, setOfferingSegment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newSeg, setNewSeg] = useState({ name: '', criteria: '', color: '#10b981' });
  const [offerForm, setOfferForm] = useState({
    couponCode: 'HELLO10',
    message: 'Gửi tặng bạn mã ưu đãi đặc quyền từ Veylix Studio cho đơn hàng tiếp theo!'
  });

  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const loadSegments = useCallback(async () => {
    try {
      const [segData, coupData] = await Promise.all([
        api.getSegments(),
        api.getCoupons().catch(() => []),
      ]);
      if (Array.isArray(segData)) {
        setSegments(segData);
      }
      if (Array.isArray(coupData) && coupData.length > 0) {
        setCoupons(coupData);
        const activeFirst = coupData.find(c => c.status === 'Active') || coupData[0];
        if (activeFirst?.code) {
          setOfferForm(prev => ({ ...prev, couponCode: activeFirst.code }));
        }
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách phân khúc', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadSegments();
  }, [loadSegments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newSeg.name.trim() || isSubmitting) return;
    const payload = {
      name: newSeg.name.trim(),
      criteria: newSeg.criteria.trim() || 'Tùy chỉnh thủ công',
      color: newSeg.color
    };

    setIsSubmitting(true);
    try {
      const created = await api.createSegment(payload);
      if (created && created.id) {
        setSegments(prev => [...prev, created]);
      } else {
        await loadSegments();
      }
      setIsAddModalOpen(false);
      setNewSeg({ name: '', criteria: '', color: '#10b981' });
      showToast(`Đã tạo phân khúc "${payload.name}" thành công!`);
    } catch (err) {
      showToast(err.message || 'Không thể tạo phân khúc mới', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSegment || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: editingSegment.name.trim(),
        criteria: editingSegment.criteria.trim(),
        color: editingSegment.color || '#10b981'
      };
      const updated = await api.updateSegment(editingSegment.id, payload);
      if (updated && updated.id) {
        setSegments(prev => prev.map(s => (s.id === editingSegment.id ? updated : s)));
      } else {
        await loadSegments();
      }
      setEditingSegment(null);
      showToast(`Đã cập nhật phân khúc "${payload.name}"!`);
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật phân khúc', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSegment || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const targetId = deletingSegment.id;
      const targetName = deletingSegment.name;
      await api.deleteSegment(targetId);
      setSegments(prev => prev.filter(s => s.id !== targetId));
      setDeletingSegment(null);
      showToast(`Đã xóa phân khúc "${targetName}"!`);
    } catch (err) {
      showToast(err.message || 'Không thể xóa phân khúc', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportSegment = async (seg) => {
    try {
      const allCustomers = await api.getCustomers().catch(() => []);
      const segNameLower = (seg.name || '').toLowerCase();
      let matched = allCustomers.filter(c => {
        const cSeg = (c.segment || '').toLowerCase();
        if (segNameLower.includes('vip')) return cSeg.includes('vip') || Number(c.totalSpent) >= 1000;
        if (segNameLower.includes('quen')) return cSeg.includes('quen') || Number(c.ordersCount) >= 3;
        if (segNameLower.includes('mới')) return cSeg.includes('mới') || Number(c.ordersCount) <= 1;
        return cSeg === segNameLower;
      });
      if (matched.length === 0 && allCustomers.length > 0) {
        matched = allCustomers;
      }

      const headers = ['Phân khúc', 'Họ tên khách hàng', 'Email', 'Số điện thoại', 'Đơn hàng', 'Tổng chi tiêu ($)', 'Địa chỉ'];
      const rows = matched.map(c => [
        `"${seg.name}"`,
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.phone || ''}"`,
        c.ordersCount ?? 0,
        Number(c.totalSpent || 0).toFixed(2),
        `"${c.location || ''}"`
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `khach_hang_phan_khuc_${seg.id}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast(`Đã xuất CSV danh sách ${matched.length} khách hàng thuộc "${seg.name}"!`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi xuất danh sách khách hàng', 'error');
    }
  };

  const handleSendOfferSubmit = async (e) => {
    e.preventDefault();
    if (!offeringSegment || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await api.sendSegmentOffer(offeringSegment.id, {
        couponCode: offerForm.couponCode,
        message: offerForm.message.trim(),
      });
      const count = res?.sentCount ?? offeringSegment.count ?? 0;
      const segName = offeringSegment.name;
      setOfferingSegment(null);
      showToast(`Đã gửi mã ưu đãi ${offerForm.couponCode} tới ${count} khách thuộc "${segName}"!`);
    } catch (err) {
      showToast(err.message || 'Không thể gửi chiến dịch ưu đãi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="segments-page" style={{ paddingBottom: '36px' }}>
      <header className="commerce-heading">
        <div>
          <div className="commerce-breadcrumb">
            <Link to="/overview">Tổng quan</Link>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </span>
            <Link to="/commerce/customers">Khách hàng</Link>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </span>
            <span>Phân khúc khách hàng</span>
          </div>
          <h1>Phân khúc khách hàng<span>.</span></h1>
        </div>

        <div className="commerce-heading-actions">
          <button type="button" className="primary-button" onClick={() => setIsAddModalOpen(true)}>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
              </svg>
            </span>
            + Tạo phân khúc
          </button>
        </div>
      </header>

      {/* Grid thẻ phân khúc */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '16px' }}>
        {segments.map(s => (
          <div key={s.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: s.color || '#10b981' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{s.name}</h3>
              </div>
              <strong style={{ fontSize: '18px', color: '#885600' }}>{s.count ?? 0} khách</strong>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: '#685e50', minHeight: '38px' }}>
              {s.criteria}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #ebdccb', paddingTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <small style={{ color: '#776c5b' }}>Giá trị TB: <strong>${Number(s.aov || 0).toFixed(2)}</strong></small>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="secondary-button" 
                  style={{ padding: '3px 8px', fontSize: '12px' }}
                  onClick={() => handleExportSegment(s)}
                >
                  Xuất danh sách
                </button>
                <button 
                  type="button" 
                  className="primary-button" 
                  style={{ padding: '3px 8px', fontSize: '12px' }}
                  onClick={() => setOfferingSegment(s)}
                >
                  Gửi ưu đãi
                </button>
                <button 
                  type="button" 
                  className="secondary-button" 
                  style={{ padding: '3px 8px', fontSize: '12px' }}
                  onClick={() => setEditingSegment(s)}
                >
                  Sửa
                </button>
                <button 
                  type="button" 
                  className="secondary-button" 
                  style={{ padding: '3px 8px', fontSize: '12px', color: '#b23b3b' }}
                  onClick={() => setDeletingSegment(s)}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Gửi ưu đãi cho phân khúc */}
      <DialogModal
        isOpen={Boolean(offeringSegment)}
        onClose={() => setOfferingSegment(null)}
        title={offeringSegment ? `Gửi mã ưu đãi tới: ${offeringSegment.name}` : ''}
      >
        {offeringSegment && (
          <form onSubmit={handleSendOfferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '10px 14px', background: '#faf6ee', borderRadius: '8px', fontSize: '13px' }}>
              Nhóm đối tượng: <strong>{offeringSegment.name}</strong> ({offeringSegment.count ?? 0} khách hàng phù hợp)
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Chọn mã khuyến mãi đính kèm *
              </label>
              <select
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8', fontWeight: '600' }}
                value={offerForm.couponCode}
                onChange={e => setOfferForm({ ...offerForm, couponCode: e.target.value })}
              >
                {coupons.length > 0 ? (
                  coupons.map(c => (
                    <option key={c.id} value={c.code}>
                      {c.code} — {c.discountType} ({c.discountType === 'Phần trăm (%)' ? `${c.value}%` : c.discountType === 'Số tiền cố định ($)' ? `$${c.value}` : 'Freeship'})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="HELLO10">HELLO10 — Giảm 10%</option>
                    <option value="WELCOME20">WELCOME20 — Giảm $20</option>
                    <option value="SHIPFREE">SHIPFREE — Miễn phí vận chuyển</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Lời nhắn ưu đãi *
              </label>
              <textarea
                required
                rows={3}
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={offerForm.message}
                onChange={e => setOfferForm({ ...offerForm, message: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button type="button" className="secondary-button" onClick={() => setOfferingSegment(null)}>
                Hủy
              </button>
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Đang phát hành...' : 'Gửi ưu đãi ngay'}
              </button>
            </div>
          </form>
        )}
      </DialogModal>

      {/* Modal: Thêm phân khúc */}
      <DialogModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tạo phân khúc khách hàng mới"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Tên phân khúc *
            </label>
            <input 
              type="text" 
              required
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              placeholder="VD: Khách hàng sinh nhật tháng này"
              value={newSeg.name}
              onChange={e => setNewSeg({ ...newSeg, name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Điều kiện phân nhóm
            </label>
            <input 
              type="text" 
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              placeholder="VD: Sinh nhật trong tháng 11, có lịch sử mua hàng"
              value={newSeg.criteria}
              onChange={e => setNewSeg({ ...newSeg, criteria: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Màu nhận diện
            </label>
            <select 
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newSeg.color}
              onChange={e => setNewSeg({ ...newSeg, color: e.target.value })}
            >
              <option value="#10b981">Xanh ngọc (#10b981)</option>
              <option value="#f59e0b">Vàng hổ phách (#f59e0b)</option>
              <option value="#3b82f6">Xanh dương (#3b82f6)</option>
              <option value="#8b5cf6">Tím (#8b5cf6)</option>
              <option value="#ef4444">Đỏ cảnh báo (#ef4444)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="secondary-button" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu phân khúc'}
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Sửa phân khúc */}
      <DialogModal
        isOpen={Boolean(editingSegment)}
        onClose={() => setEditingSegment(null)}
        title={editingSegment ? `Chỉnh sửa phân khúc: ${editingSegment.name}` : ''}
      >
        {editingSegment && (
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Tên phân khúc *
              </label>
              <input
                type="text"
                required
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingSegment.name}
                onChange={e => setEditingSegment({ ...editingSegment, name: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Điều kiện phân nhóm
              </label>
              <input
                type="text"
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingSegment.criteria}
                onChange={e => setEditingSegment({ ...editingSegment, criteria: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Màu nhận diện
              </label>
              <select
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingSegment.color || '#10b981'}
                onChange={e => setEditingSegment({ ...editingSegment, color: e.target.value })}
              >
                <option value="#10b981">Xanh ngọc (#10b981)</option>
                <option value="#f59e0b">Vàng hổ phách (#f59e0b)</option>
                <option value="#3b82f6">Xanh dương (#3b82f6)</option>
                <option value="#8b5cf6">Tím (#8b5cf6)</option>
                <option value="#ef4444">Đỏ cảnh báo (#ef4444)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setEditingSegment(null)}>
                Hủy
              </button>
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}
      </DialogModal>

      {/* Modal: Xác nhận xóa phân khúc */}
      <DialogModal
        isOpen={Boolean(deletingSegment)}
        onClose={() => setDeletingSegment(null)}
        title="Xác nhận xóa phân khúc"
      >
        {deletingSegment && (
          <div>
            <p style={{ lineHeight: '1.6', marginBottom: '16px' }}>
              Bạn có chắc chắn muốn xóa phân khúc <strong>{deletingSegment.name}</strong> không?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setDeletingSegment(null)}>
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
