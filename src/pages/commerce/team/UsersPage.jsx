import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';
import api from '../../../services/api';

export default function UsersPage() {
  const initialUsers = [
    { id: 'usr-1', name: 'Alex Chen', email: 'alex.chen@veylix.vn', role: 'Chủ sở hữu (Owner)', status: 'Active', avatar: 'AC', lastActive: 'Đang hoạt động' },
    { id: 'usr-2', name: 'Trần Mai Phương', email: 'phuong.tran@veylix.vn', role: 'Quản lý kho & Đơn hàng', status: 'Active', avatar: 'MP', lastActive: '15 phút trước' },
    { id: 'usr-3', name: 'Lê Hoàng Nam', email: 'nam.le@veylix.vn', role: 'Chuyên viên CSKH', status: 'Active', avatar: 'HN', lastActive: '1 giờ trước' },
    { id: 'usr-4', name: 'Nguyễn Tuấn Kiệt', email: 'kiet.nguyen@veylix.vn', role: 'Tiếp thị & Tăng trưởng', status: 'Active', avatar: 'TK', lastActive: 'Hôm qua' }
  ];

  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Chuyên viên CSKH'
  });

  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const data = await api.getUsers();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách thành viên', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const kpis = useMemo(() => {
    const activeCount = users.filter(u => u.status === 'Active').length;
    const invitedOrDisabled = users.filter(u => u.status !== 'Active').length;
    const distinctRoles = new Set(users.map(u => u.role)).size;
    return {
      total: users.length,
      activeCount,
      invitedOrDisabled,
      distinctRoles,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim() || isSubmitting) return;
    const payload = {
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      role: newUser.role
    };

    setIsSubmitting(true);
    try {
      const created = await api.createUser(payload);
      if (created && created.id) {
        setUsers(prev => [...prev, created]);
      } else {
        await loadUsers();
      }
      setIsAddModalOpen(false);
      setNewUser({ name: '', email: '', role: 'Chuyên viên CSKH' });
      showToast(`Đã gửi lời mời tham gia tới ${payload.email}!`);
    } catch (err) {
      showToast(err.message || 'Không thể mời thành viên mới', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: editingUser.name?.trim(),
        role: editingUser.role,
        status: editingUser.status,
      };
      const updated = await api.updateUser(editingUser.id, payload);
      if (updated && updated.id) {
        setUsers(prev => prev.map(u => (u.id === editingUser.id ? updated : u)));
      } else {
        await loadUsers();
      }
      const targetName = editingUser.name;
      setEditingUser(null);
      showToast(`Đã lưu phân quyền cho ${targetName}!`);
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật phân quyền', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tạm khóa / Mở khóa thành viên 1 chạm
  const handleToggleLock = async (user) => {
    if (isSubmitting || user.role === 'Chủ sở hữu (Owner)') return;
    const nextStatus = user.status === 'Disabled' ? 'Active' : 'Disabled';
    setIsSubmitting(true);
    try {
      const updated = await api.updateUser(user.id, { status: nextStatus });
      if (updated && updated.id) {
        setUsers(prev => prev.map(u => (u.id === user.id ? updated : u)));
      } else {
        setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, status: nextStatus } : u)));
      }
      showToast(
        nextStatus === 'Disabled'
          ? `🔒 Đã tạm khóa quyền truy cập của ${user.name}!`
          : `🔓 Đã mở khóa tài khoản cho ${user.name}!`
      );
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật trạng thái thành viên', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const targetId = deletingUser.id;
      const targetName = deletingUser.name;
      await api.deleteUser(targetId);
      setUsers(prev => prev.filter(u => u.id !== targetId));
      setDeletingUser(null);
      showToast(`Đã xóa thành viên ${targetName}!`);
    } catch (err) {
      showToast(err.message || 'Không thể xóa thành viên này', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (status) => {
    if (status === 'Disabled') {
      return (
        <span className="badge badge-red" style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
          Đã tạm khóa
        </span>
      );
    }
    if (status === 'Invited') {
      return (
        <span className="badge badge-amber" style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
          Đã mời tham gia
        </span>
      );
    }
    return (
      <span className="badge badge-green" style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
        Đang hoạt động
      </span>
    );
  };

  return (
    <div className="users-page" style={{ paddingBottom: '36px' }}>
      <header className="commerce-heading">
        <div>
          <div className="commerce-breadcrumb">
            <Link to="/overview">Tổng quan</Link>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </span>
            <span>Nhân sự & Phân quyền</span>
          </div>
          <h1>Thành viên đội ngũ & Phân quyền<span>.</span></h1>
        </div>

        <div className="commerce-heading-actions">
          <Link to="/commerce/permissions" className="secondary-button" style={{ textDecoration: 'none' }}>
            🛡️ Ma trận phân quyền
          </Link>
          <button type="button" className="primary-button" onClick={() => setIsAddModalOpen(true)}>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
              </svg>
            </span>
            + Mời thành viên
          </button>
        </div>
      </header>

      {/* 4 Thẻ KPI Nhân sự */}
      <section className="order-summary-grid" style={{ marginBottom: '18px' }}>
        <div className="order-summary-card blue">
          <div>
            <small>Tổng nhân sự hệ thống</small>
            <strong>{kpis.total}</strong>
            <em>Đội ngũ quản trị & vận hành</em>
          </div>
        </div>
        <div className="order-summary-card green">
          <div>
            <small>Đang hoạt động</small>
            <strong>{kpis.activeCount}</strong>
            <em>Có quyền truy cập bình thường</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Chờ nhận lời mời / Tạm khóa</small>
            <strong>{kpis.invitedOrDisabled}</strong>
            <em>Có thể mở khóa hoặc mời lại</em>
          </div>
        </div>
        <div className="order-summary-card purple">
          <div>
            <small>Nhóm vai trò RBAC</small>
            <strong>{kpis.distinctRoles}</strong>
            <em>Quản lý chi tiết tại Ma trận quyền</em>
          </div>
        </div>
      </section>

      {/* Thanh tìm kiếm & hướng dẫn nhanh */}
      <section className="glass-card c-toolbar" style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: '#685d4f' }}>
          💡 Bạn có thể <strong>Tạm khóa / Mở khóa</strong> nhanh tài khoản nhân viên nghỉ phép hoặc bấm <strong>Ma trận phân quyền</strong> để cấu hình quyền Xem/Thêm/Sửa/Xóa cho từng vai trò.
        </div>
        <div className="c-toolbar-search">
          <label className="c-search">
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </span>
            <input
              type="search"
              placeholder="Tìm tên nhân viên, email, vai trò..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm thành viên"
            />
          </label>
        </div>
      </section>

      {/* Bảng nhân sự */}
      <section className="glass-card c-resource">
        <div className="product-list-heading">
          <div>
            <span>DANH SÁCH NHÂN SỰ</span>
            <h2>Thành viên có quyền truy cập hệ thống</h2>
          </div>
          <small>{filteredUsers.length} thành viên</small>
        </div>

        <div className="table-scroll c-table-scroll" tabIndex="0" role="region" aria-label="Bảng nhân viên">
          <table className="c-table">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Vai trò phân quyền</th>
                <th>Trạng thái</th>
                <th>Hoạt động gần nhất</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const isOwner = u.role === 'Chủ sở hữu (Owner)';
                const isLocked = u.status === 'Disabled';

                return (
                  <tr key={u.id} style={{ opacity: isLocked ? 0.78 : 1 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="customer-avatar" style={{ width: '38px', height: '38px', fontSize: '13px' }}>
                          {u.avatar}
                        </div>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#272016' }}>{u.name}</strong>
                          <small style={{ display: 'block', color: '#776c5b' }}>{u.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-indigo" style={{ fontSize: '12px', padding: '4px 9px', borderRadius: '6px' }}>
                        {u.role}
                      </span>
                    </td>
                    <td>{renderStatusBadge(u.status)}</td>
                    <td><small>{u.lastActive}</small></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button 
                          type="button" 
                          className="secondary-button" 
                          style={{ padding: '3px 8px', fontSize: '12px' }}
                          onClick={() => setEditingUser(u)}
                        >
                          Đổi vai trò
                        </button>
                        {!isOwner && (
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={isSubmitting}
                            style={{
                              padding: '3px 8px',
                              fontSize: '12px',
                              color: isLocked ? '#1f6e43' : '#9a5b00'
                            }}
                            onClick={() => handleToggleLock(u)}
                          >
                            {isLocked ? 'Mở khóa' : 'Tạm khóa'}
                          </button>
                        )}
                        {!isOwner && (
                          <button 
                            type="button" 
                            className="secondary-button" 
                            style={{ padding: '3px 8px', fontSize: '12px', color: '#b23b3b' }}
                            onClick={() => setDeletingUser(u)}
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Mời thành viên */}
      <DialogModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Mời thành viên mới vào nhóm"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Họ và tên *
            </label>
            <input 
              type="text" 
              required
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newUser.name}
              onChange={e => setNewUser({ ...newUser, name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Email công việc *
            </label>
            <input 
              type="email" 
              required
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newUser.email}
              onChange={e => setNewUser({ ...newUser, email: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Vai trò & Quyền hạn
            </label>
            <select 
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newUser.role}
              onChange={e => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="Quản lý kho & Đơn hàng">Quản lý kho & Đơn hàng</option>
              <option value="Chuyên viên CSKH">Chuyên viên CSKH</option>
              <option value="Tiếp thị & Tăng trưởng">Tiếp thị & Tăng trưởng</option>
              <option value="Kế toán & Dòng tiền">Kế toán & Dòng tiền</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="secondary-button" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi lời mời'}
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Sửa vai trò & thông tin */}
      <DialogModal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title={editingUser ? `Chỉnh sửa phân quyền: ${editingUser.name}` : ''}
      >
        {editingUser && (
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Họ và tên thành viên
              </label>
              <input
                type="text"
                required
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingUser.name || ''}
                onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Chọn vai trò mới
              </label>
              <select 
                className="c-field"
                disabled={editingUser.role === 'Chủ sở hữu (Owner)'}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingUser.role}
                onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
              >
                <option value="Quản lý kho & Đơn hàng">Quản lý kho & Đơn hàng</option>
                <option value="Chuyên viên CSKH">Chuyên viên CSKH</option>
                <option value="Tiếp thị & Tăng trưởng">Tiếp thị & Tăng trưởng</option>
                <option value="Kế toán & Dòng tiền">Kế toán & Dòng tiền</option>
                <option value="Chủ sở hữu (Owner)">Chủ sở hữu (Owner)</option>
              </select>
            </div>

            {editingUser.role !== 'Chủ sở hữu (Owner)' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                  Trạng thái tài khoản
                </label>
                <select
                  className="c-field"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                  value={editingUser.status || 'Active'}
                  onChange={e => setEditingUser({ ...editingUser, status: e.target.value })}
                >
                  <option value="Active">Đang hoạt động</option>
                  <option value="Invited">Đã mời tham gia</option>
                  <option value="Disabled">Tạm khóa quyền truy cập</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setEditingUser(null)}>
                Hủy
              </button>
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu quyền hạn'}
              </button>
            </div>
          </form>
        )}
      </DialogModal>

      {/* Modal: Xác nhận xóa */}
      <DialogModal
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        title="Xác nhận xóa thành viên"
      >
        {deletingUser && (
          <div>
            <p style={{ lineHeight: '1.6', marginBottom: '16px' }}>
              Bạn có chắc chắn muốn thu hồi quyền truy cập và xóa tài khoản của <strong>{deletingUser.name}</strong> ({deletingUser.email}) không?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setDeletingUser(null)}>
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
