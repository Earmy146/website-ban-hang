import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';

export default function MarketplacePage() {
  const initialVendors = [
    { id: 'ven-1', name: 'Công ty TNHH Thời Trang Veylix', owner: 'Nguyễn Văn Hùng', commission: 12, sales: 48900, pendingPayout: 43032, status: 'Active', products: 54 },
    { id: 'ven-2', name: 'Northline Lifestyle Co.', owner: 'Trần Minh Tuấn', commission: 15, sales: 36200, pendingPayout: 30770, status: 'Active', products: 38 },
    { id: 'ven-3', name: 'Xưởng Gốm Sứ Forma Living', owner: 'Lê Thu Hương', commission: 10, sales: 22100, pendingPayout: 19890, status: 'Active', products: 29 },
    { id: 'ven-4', name: 'Phụ Kiện Công Nghệ TechHub', owner: 'Phạm Đức Anh', commission: 12, sales: 15800, pendingPayout: 13904, status: 'Active', products: 18 },
    { id: 'ven-5', name: 'Thủ Công Mỹ Nghệ EcoVietnam', owner: 'Võ Thị Mai', commission: 8, sales: 6400, pendingPayout: 5888, status: 'Pending', products: 12 }
  ];

  const [vendors, setVendors] = useState(initialVendors);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [payoutModalVendor, setPayoutModalVendor] = useState(null);

  const [newVendor, setNewVendor] = useState({
    name: '',
    owner: '',
    commission: 12
  });

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
    if (!newVendor.name.trim()) return;
    const created = {
      id: `ven-${Date.now()}`,
      name: newVendor.name.trim(),
      owner: newVendor.owner.trim() || 'Người đại diện',
      commission: parseFloat(newVendor.commission) || 10,
      sales: 0,
      pendingPayout: 0,
      status: 'Active',
      products: 0
    };
    setVendors([...vendors, created]);
    setIsAddModalOpen(false);
    setNewVendor({ name: '', owner: '', commission: 12 });
    showToast(`Đã thêm đối tác "${created.name}" thành công!`);
  };

  const handleExecutePayout = () => {
    if (!payoutModalVendor) return;
    setVendors(prev => prev.map(v => v.id === payoutModalVendor.id ? { ...v, pendingPayout: 0 } : v));
    showToast(`Đã thanh toán $${payoutModalVendor.pendingPayout.toLocaleString()} cho ${payoutModalVendor.name}!`);
    setPayoutModalVendor(null);
  };

  return (
    <div className="marketplace-page" style={{ paddingBottom: '36px' }}>
      <header className="commerce-heading">
        <div>
          <div className="commerce-breadcrumb">
            <Link to="/overview">Tổng quan</Link>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </span>
            <span>Sàn thương mại</span>
          </div>
          <h1>Đối tác người bán & Sàn TMĐT<span>.</span></h1>
        </div>

        <div className="commerce-heading-actions">
          <button type="button" className="primary-button" onClick={() => setIsAddModalOpen(true)}>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
              </svg>
            </span>
            + Thêm người bán
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="order-summary-grid" style={{ marginBottom: '20px' }}>
        <div className="order-summary-card green">
          <div>
            <small>Tổng đối tác người bán</small>
            <strong>{vendors.length}</strong>
            <em>{vendors.filter(v => v.status === 'Active').length} đang hoạt động</em>
          </div>
        </div>
        <div className="order-summary-card blue">
          <div>
            <small>Doanh số sàn tạo ra</small>
            <strong>${vendors.reduce((s, v) => s + v.sales, 0).toLocaleString()}</strong>
            <em>Tổng doanh số đối tác</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Doanh thu hoa hồng sàn</small>
            <strong>${Math.round(vendors.reduce((s, v) => s + (v.sales * v.commission) / 100, 0)).toLocaleString()}</strong>
            <em>Thu về từ chiết khấu</em>
          </div>
        </div>
        <div className="order-summary-card purple">
          <div>
            <small>Đang chờ thanh toán (Payout)</small>
            <strong>${vendors.reduce((s, v) => s + v.pendingPayout, 0).toLocaleString()}</strong>
            <em>Quyết toán định kỳ</em>
          </div>
        </div>
      </section>

      {/* Bảng danh sách người bán */}
      <section className="glass-card c-resource">
        <div className="product-list-heading">
          <div>
            <span>MẠNG LƯỚI NGƯỜI BÁN</span>
            <h2>Danh sách đối tác kinh doanh trên sàn</h2>
          </div>
          <small>{vendors.length} đối tác</small>
        </div>

        <div className="table-scroll c-table-scroll" tabIndex="0" role="region" aria-label="Bảng người bán">
          <table className="c-table">
            <thead>
              <tr>
                <th>Đối tác</th>
                <th>Người đại diện</th>
                <th>Sản phẩm</th>
                <th>Hoa hồng sàn (%)</th>
                <th>Tổng doanh số</th>
                <th>Chờ quyết toán</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id}>
                  <td>
                    <strong style={{ fontSize: '14px', color: '#272016' }}>{v.name}</strong>
                  </td>
                  <td>{v.owner}</td>
                  <td><strong>{v.products}</strong> món</td>
                  <td><span className="badge badge-amber">{v.commission}%</span></td>
                  <td><strong style={{ color: '#10b981' }}>${v.sales.toLocaleString()}</strong></td>
                  <td>
                    <strong style={{ color: v.pendingPayout > 0 ? '#b23b3b' : '#776c5b' }}>
                      ${v.pendingPayout.toLocaleString()}
                    </strong>
                  </td>
                  <td>
                    <span className={`badge badge-${v.status === 'Active' ? 'green' : 'amber'}`}>
                      {v.status === 'Active' ? 'Đang hoạt động' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {v.pendingPayout > 0 && (
                        <button 
                          type="button" 
                          className="primary-button" 
                          style={{ padding: '3px 8px', fontSize: '12px' }}
                          onClick={() => setPayoutModalVendor(v)}
                        >
                          Quyết toán
                        </button>
                      )}
                      <button 
                        type="button" 
                        className="secondary-button" 
                        style={{ padding: '3px 8px', fontSize: '12px' }}
                        onClick={() => showToast(`Xem báo cáo chi tiết đối tác ${v.name}`)}
                      >
                        Báo cáo
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Thêm người bán */}
      <DialogModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm đối tác người bán mới"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Tên doanh nghiệp / Đối tác *
            </label>
            <input 
              type="text" 
              required
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newVendor.name}
              onChange={e => setNewVendor({ ...newVendor, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Người đại diện
              </label>
              <input 
                type="text" 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={newVendor.owner}
                onChange={e => setNewVendor({ ...newVendor, owner: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Mức hoa hồng sàn (%)
              </label>
              <input 
                type="number" 
                min="1" 
                max="50"
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={newVendor.commission}
                onChange={e => setNewVendor({ ...newVendor, commission: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="secondary-button" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="primary-button">
              Lưu đối tác
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Quyết toán */}
      <DialogModal
        isOpen={Boolean(payoutModalVendor)}
        onClose={() => setPayoutModalVendor(null)}
        title={payoutModalVendor ? `Quyết toán cho ${payoutModalVendor.name}` : ''}
      >
        {payoutModalVendor && (
          <div>
            <p style={{ lineHeight: '1.6', marginBottom: '16px' }}>
              Xác nhận thanh toán số tiền <strong>${payoutModalVendor.pendingPayout.toLocaleString()}</strong> doanh số bán hàng kỳ này cho đối tác <strong>{payoutModalVendor.name}</strong> qua tài khoản ngân hàng liên kết?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setPayoutModalVendor(null)}>
                Hủy
              </button>
              <button type="button" className="primary-button" onClick={handleExecutePayout}>
                Xác nhận thanh toán
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

