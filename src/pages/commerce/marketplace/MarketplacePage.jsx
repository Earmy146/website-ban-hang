import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';
import api from '../../../services/api';

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
  const [editingVendor, setEditingVendor] = useState(null);
  const [deletingVendor, setDeletingVendor] = useState(null);
  const [payoutModalVendor, setPayoutModalVendor] = useState(null);
  const [reportModal, setReportModal] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newVendor, setNewVendor] = useState({
    name: '',
    owner: '',
    commission: 12
  });

  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const loadVendors = useCallback(async () => {
    try {
      const data = await api.getVendors();
      if (Array.isArray(data)) {
        setVendors(data);
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách đối tác sàn', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newVendor.name.trim() || isSubmitting) return;
    const payload = {
      name: newVendor.name.trim(),
      owner: newVendor.owner.trim() || 'Người đại diện',
      commission: parseFloat(newVendor.commission) || 10
    };

    setIsSubmitting(true);
    try {
      const created = await api.createVendor(payload);
      if (created && created.id) {
        setVendors(prev => [...prev, created]);
      } else {
        await loadVendors();
      }
      setIsAddModalOpen(false);
      setNewVendor({ name: '', owner: '', commission: 12 });
      showToast(`Đã thêm đối tác "${payload.name}" thành công!`);
    } catch (err) {
      showToast(err.message || 'Không thể thêm đối tác mới', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingVendor || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: editingVendor.name.trim(),
        owner: editingVendor.owner.trim(),
        commission: Number(editingVendor.commission) || 0,
        status: editingVendor.status
      };
      const updated = await api.updateVendor(editingVendor.id, payload);
      if (updated && updated.id) {
        setVendors(prev => prev.map(v => (v.id === editingVendor.id ? updated : v)));
      } else {
        await loadVendors();
      }
      setEditingVendor(null);
      showToast(`Đã cập nhật thông tin đối tác "${payload.name}"!`);
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật đối tác', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingVendor || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const targetId = deletingVendor.id;
      const targetName = deletingVendor.name;
      await api.deleteVendor(targetId);
      setVendors(prev => prev.filter(v => v.id !== targetId));
      setDeletingVendor(null);
      showToast(`Đã xóa đối tác "${targetName}" khỏi sàn!`);
    } catch (err) {
      showToast(err.message || 'Không thể xóa đối tác', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveVendor = async (vendor) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await api.updateVendorStatus(vendor.id, 'Active');
      if (updated && updated.id) {
        setVendors(prev => prev.map(v => (v.id === vendor.id ? updated : v)));
      } else {
        setVendors(prev => prev.map(v => (v.id === vendor.id ? { ...v, status: 'Active' } : v)));
      }
      showToast(`Đã phê duyệt kích hoạt gian hàng "${vendor.name}"!`);
    } catch (err) {
      showToast(err.message || 'Không thể phê duyệt đối tác', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReport = async (vendor) => {
    const commissionEarned = Math.round(((Number(vendor.sales || 0) * Number(vendor.commission || 0)) / 100) * 100) / 100;
    const netSales = Number(vendor.sales || 0) - commissionEarned;
    setReportModal({
      vendor,
      commissionEarned,
      netSales,
      recentOrders: [],
      productsList: [],
    });
    setIsLoadingReport(true);
    try {
      const data = await api.getVendorReport(vendor.id);
      if (data) {
        setReportModal({
          vendor: data.vendor || vendor,
          commissionEarned: data.commissionEarned ?? commissionEarned,
          netSales: data.netSales ?? netSales,
          recentOrders: Array.isArray(data.recentOrders) ? data.recentOrders : [],
          productsList: Array.isArray(data.productsList) ? data.productsList : [],
        });
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải báo cáo chi tiết đối tác', 'error');
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleExecutePayout = async () => {
    if (!payoutModalVendor || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const targetId = payoutModalVendor.id;
      const targetName = payoutModalVendor.name;
      const amount = payoutModalVendor.pendingPayout;
      const updated = await api.payoutVendor(targetId);
      if (updated && updated.id) {
        setVendors(prev => prev.map(v => (v.id === targetId ? updated : v)));
      } else {
        setVendors(prev => prev.map(v => (v.id === targetId ? { ...v, pendingPayout: 0 } : v)));
      }
      showToast(`Đã thanh toán $${Number(amount || 0).toLocaleString()} cho ${targetName}!`);
      setPayoutModalVendor(null);
    } catch (err) {
      showToast(err.message || 'Lỗi khi quyết toán cho đối tác', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
            <strong>${vendors.reduce((s, v) => s + Number(v.sales || 0), 0).toLocaleString()}</strong>
            <em>Tổng doanh số đối tác</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Doanh thu hoa hồng sàn</small>
            <strong>${Math.round(vendors.reduce((s, v) => s + (Number(v.sales || 0) * Number(v.commission || 0)) / 100, 0)).toLocaleString()}</strong>
            <em>Thu về từ chiết khấu</em>
          </div>
        </div>
        <div className="order-summary-card purple">
          <div>
            <small>Đang chờ thanh toán (Payout)</small>
            <strong>${vendors.reduce((s, v) => s + Number(v.pendingPayout || 0), 0).toLocaleString()}</strong>
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
                  <td><strong>{v.products ?? 0}</strong> món</td>
                  <td><span className="badge badge-amber">{v.commission}%</span></td>
                  <td><strong style={{ color: '#10b981' }}>${Number(v.sales || 0).toLocaleString()}</strong></td>
                  <td>
                    <strong style={{ color: Number(v.pendingPayout) > 0 ? '#b23b3b' : '#776c5b' }}>
                      ${Number(v.pendingPayout || 0).toLocaleString()}
                    </strong>
                  </td>
                  <td>
                    <span className={`badge badge-${v.status === 'Active' ? 'green' : v.status === 'Suspended' ? 'red' : 'amber'}`}>
                      {v.status === 'Active' ? 'Đang hoạt động' : v.status === 'Suspended' ? 'Tạm đình chỉ' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {v.status !== 'Active' && (
                        <button
                          type="button"
                          className="primary-button"
                          disabled={isSubmitting}
                          style={{ padding: '3px 8px', fontSize: '12px', background: '#1f6e43', borderColor: '#1f6e43' }}
                          onClick={() => handleApproveVendor(v)}
                        >
                          Phê duyệt
                        </button>
                      )}
                      {Number(v.pendingPayout) > 0 && (
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
                        onClick={() => handleOpenReport(v)}
                      >
                        Báo cáo
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ padding: '3px 8px', fontSize: '12px' }}
                        onClick={() => setEditingVendor(v)}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ padding: '3px 8px', fontSize: '12px', color: '#b23b3b' }}
                        onClick={() => setDeletingVendor(v)}
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Báo cáo chi tiết đối tác */}
      <DialogModal
        isOpen={Boolean(reportModal)}
        onClose={() => setReportModal(null)}
        title={reportModal ? `Báo cáo kinh doanh: ${reportModal.vendor?.name}` : ''}
        wide={true}
      >
        {reportModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13.5px' }}>
            {isLoadingReport && <small style={{ color: '#776c5b' }}>Đang tổng hợp dữ liệu đối tác từ máy chủ...</small>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
              <div style={{ padding: '12px', background: '#faf6ee', borderRadius: '10px', border: '1px solid #e6dac8' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Tổng doanh số</small>
                <strong style={{ fontSize: '18px', color: '#276840' }}>${Number(reportModal.vendor?.sales || 0).toLocaleString()}</strong>
              </div>
              <div style={{ padding: '12px', background: '#faf6ee', borderRadius: '10px', border: '1px solid #e6dac8' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Hoa hồng sàn ({reportModal.vendor?.commission}%)</small>
                <strong style={{ fontSize: '18px', color: '#b45309' }}>${Number(reportModal.commissionEarned || 0).toLocaleString()}</strong>
              </div>
              <div style={{ padding: '12px', background: '#faf6ee', borderRadius: '10px', border: '1px solid #e6dac8' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Doanh thu thuần ĐT</small>
                <strong style={{ fontSize: '18px' }}>${Number(reportModal.netSales || 0).toLocaleString()}</strong>
              </div>
              <div style={{ padding: '12px', background: '#faf6ee', borderRadius: '10px', border: '1px solid #e6dac8' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Số dư chờ thanh toán</small>
                <strong style={{ fontSize: '18px', color: '#b23b3b' }}>${Number(reportModal.vendor?.pendingPayout || 0).toLocaleString()}</strong>
              </div>
            </div>

            {reportModal.productsList?.length > 0 && (
              <div>
                <strong style={{ display: 'block', marginBottom: '8px' }}>Sản phẩm tiêu biểu của gian hàng ({reportModal.productsList.length})</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                  {reportModal.productsList.map((p, idx) => (
                    <div key={p.id || idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#fff', borderRadius: '8px', border: '1px solid #eee2d0' }}>
                      <span><strong>{p.name}</strong> <small style={{ color: '#776c5b' }}>({p.sku})</small></span>
                      <span>Đã bán: <strong>{p.sales ?? 0}</strong> · Giá: <strong>${Number(p.price || 0).toFixed(2)}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportModal.recentOrders?.length > 0 && (
              <div>
                <strong style={{ display: 'block', marginBottom: '8px' }}>Đơn hàng liên quan gần đây</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                  {reportModal.recentOrders.map((o, idx) => (
                    <div key={o.id || idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f9f5ed', borderRadius: '8px' }}>
                      <span><strong>#{o.id}</strong> · {typeof o.customer === 'object' ? o.customer?.name : o.customer}</span>
                      <strong>${Number(o.total || 0).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button type="button" className="primary-button" onClick={() => setReportModal(null)}>
                Đóng báo cáo
              </button>
            </div>
          </div>
        )}
      </DialogModal>

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
                min="0" 
                max="100"
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
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu đối tác'}
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Sửa người bán */}
      <DialogModal
        isOpen={Boolean(editingVendor)}
        onClose={() => setEditingVendor(null)}
        title={editingVendor ? `Chỉnh sửa đối tác: ${editingVendor.name}` : ''}
      >
        {editingVendor && (
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Tên đối tác *
              </label>
              <input
                type="text"
                required
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingVendor.name}
                onChange={e => setEditingVendor({ ...editingVendor, name: e.target.value })}
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
                  value={editingVendor.owner || ''}
                  onChange={e => setEditingVendor({ ...editingVendor, owner: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                  Hoa hồng sàn (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="c-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                  value={editingVendor.commission}
                  onChange={e => setEditingVendor({ ...editingVendor, commission: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Trạng thái gian hàng
              </label>
              <select
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingVendor.status}
                onChange={e => setEditingVendor({ ...editingVendor, status: e.target.value })}
              >
                <option value="Active">Đang hoạt động (Active)</option>
                <option value="Pending">Chờ phê duyệt (Pending)</option>
                <option value="Suspended">Tạm đình chỉ (Suspended)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setEditingVendor(null)}>
                Hủy
              </button>
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}
      </DialogModal>

      {/* Modal: Xác nhận xóa đối tác */}
      <DialogModal
        isOpen={Boolean(deletingVendor)}
        onClose={() => setDeletingVendor(null)}
        title="Xác nhận xóa đối tác sàn"
      >
        {deletingVendor && (
          <div>
            <p style={{ lineHeight: '1.6', marginBottom: '16px' }}>
              Bạn có chắc chắn muốn xóa đối tác <strong>{deletingVendor.name}</strong> khỏi sàn thương mại điện tử Veylix không?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setDeletingVendor(null)}>
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

      {/* Modal: Quyết toán */}
      <DialogModal
        isOpen={Boolean(payoutModalVendor)}
        onClose={() => setPayoutModalVendor(null)}
        title={payoutModalVendor ? `Quyết toán cho ${payoutModalVendor.name}` : ''}
      >
        {payoutModalVendor && (
          <div>
            <p style={{ lineHeight: '1.6', marginBottom: '16px' }}>
              Xác nhận thanh toán số tiền <strong>${Number(payoutModalVendor.pendingPayout || 0).toLocaleString()}</strong> doanh số bán hàng kỳ này cho đối tác <strong>{payoutModalVendor.name}</strong> qua tài khoản ngân hàng liên kết?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setPayoutModalVendor(null)}>
                Hủy
              </button>
              <button type="button" className="primary-button" disabled={isSubmitting} onClick={handleExecutePayout}>
                {isSubmitting ? 'Đang thanh toán...' : 'Xác nhận thanh toán'}
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
