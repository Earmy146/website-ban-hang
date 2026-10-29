import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';

export default function SegmentsPage() {
  const initialSegments = [
    { id: 'seg-1', name: 'Khách hàng VIP', count: 18, criteria: 'Tổng chi tiêu > $1,000 & tối thiểu 5 đơn', aov: 142.50, color: '#f59e0b' },
    { id: 'seg-2', name: 'Khách quen thân thiết', count: 45, criteria: 'Đã hoàn thành từ 3 đơn trở lên', aov: 82.30, color: '#10b981' },
    { id: 'seg-3', name: 'Khách hàng mới', count: 64, criteria: 'Đã đặt 1 đơn trong vòng 30 ngày qua', aov: 46.20, color: '#3b82f6' },
    { id: 'seg-4', name: 'Có nguy cơ rời bỏ', count: 12, criteria: 'Không phát sinh đơn sau hơn 90 ngày', aov: 58.00, color: '#ef4444' },
    { id: 'seg-5', name: 'Người dùng quan tâm', count: 88, criteria: 'Đã đăng ký tài khoản và nhận tin nhưng chưa mua', aov: 0, color: '#8b5cf6' }
  ];

  const [segments, setSegments] = useState(initialSegments);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSeg, setNewSeg] = useState({ name: '', criteria: '', color: '#10b981' });

  const [toasts, setToasts] = useState([]);
  const showToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newSeg.name.trim()) return;
    const created = {
      id: `seg-${Date.now()}`,
      name: newSeg.name.trim(),
      criteria: newSeg.criteria.trim() || 'Tùy chỉnh thủ công',
      count: 0,
      aov: 0,
      color: newSeg.color
    };
    setSegments([...segments, created]);
    setIsAddModalOpen(false);
    setNewSeg({ name: '', criteria: '', color: '#10b981' });
    showToast(`Đã tạo phân khúc "${created.name}" thành công!`);
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {segments.map(s => (
          <div key={s.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: s.color }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>{s.name}</h3>
              </div>
              <strong style={{ fontSize: '18px', color: '#885600' }}>{s.count} khách</strong>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: '#685e50', minHeight: '38px' }}>
              {s.criteria}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #ebdccb', paddingTop: '10px' }}>
              <small style={{ color: '#776c5b' }}>Giá trị TB: <strong>${s.aov.toFixed(2)}</strong></small>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  type="button" 
                  className="secondary-button" 
                  style={{ padding: '3px 8px', fontSize: '12px' }}
                  onClick={() => showToast(`Đã xuất danh sách ${s.count} khách thuộc ${s.name}`)}
                >
                  Xuất danh sách
                </button>
                <button 
                  type="button" 
                  className="primary-button" 
                  style={{ padding: '3px 8px', fontSize: '12px' }}
                  onClick={() => showToast(`Đã mở chiến dịch gửi ưu đãi cho ${s.name}`)}
                >
                  Gửi ưu đãi
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="secondary-button" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="primary-button">
              Lưu phân khúc
            </button>
          </div>
        </form>
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

