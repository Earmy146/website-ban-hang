import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';

export default function UsersPage() {
  const initialUsers = [
    { id: 'usr-1', name: 'Alex Chen', email: 'alex.chen@veylix.vn', role: 'Chủ sở hữu (Owner)', status: 'Active', avatar: 'AC', lastActive: 'Đang hoạt động' },
    { id: 'usr-2', name: 'Trần Mai Phương', email: 'phuong.tran@veylix.vn', role: 'Quản lý kho & Đơn hàng', status: 'Active', avatar: 'MP', lastActive: '15 phút trước' },
    { id: 'usr-3', name: 'Lê Hoàng Nam', email: 'nam.le@veylix.vn', role: 'Chuyên viên CSKH', status: 'Active', avatar: 'HN', lastActive: '1 giờ trước' },
    { id: 'usr-4', name: 'Nguyễn Tuấn Kiệt', email: 'kiet.nguyen@veylix.vn', role: 'Tiếp thị & Tăng trưởng', status: 'Active', avatar: 'TK', lastActive: 'Hôm qua' }
  ];

  const [users, setUsers] = useState(initialUsers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Chuyên viên CSKH'
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
    if (!newUser.name.trim() || !newUser.email.trim()) return;
    const initials = newUser.name.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
    const created = {
      id: `usr-${Date.now()}`,
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      role: newUser.role,
      status: 'Active',
      avatar: initials || 'NV',
      lastActive: 'Vừa mời'
    };
    setUsers([...users, created]);
    setIsAddModalOpen(false);
    setNewUser({ name: '', email: '', role: 'Chuyên viên CSKH' });
    showToast(`Đã gửi lời mời tham gia tới ${created.email}!`);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
    setEditingUser(null);
    showToast(`Đã lưu phân quyền cho ${editingUser.name}!`);
  };

  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
    setDeletingUser(null);
    showToast(`Đã xóa thành viên ${deletingUser.name}!`);
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

      {/* Bảng nhân sự */}
      <section className="glass-card c-resource">
        <div className="product-list-heading">
          <div>
            <span>DANH SÁCH NHÂN SỰ</span>
            <h2>Thành viên có quyền truy cập hệ thống</h2>
          </div>
          <small>{users.length} thành viên</small>
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
              {users.map(u => (
                <tr key={u.id}>
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
                  <td>
                    <span className="badge badge-green" style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
                      Đang hoạt động
                    </span>
                  </td>
                  <td><small>{u.lastActive}</small></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        type="button" 
                        className="secondary-button" 
                        style={{ padding: '3px 8px', fontSize: '12px' }}
                        onClick={() => setEditingUser(u)}
                      >
                        Đổi vai trò
                      </button>
                      {u.role !== 'Chủ sở hữu (Owner)' && (
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
              ))}
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
            <button type="submit" className="primary-button">
              Gửi lời mời
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Sửa vai trò */}
      <DialogModal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        title={editingUser ? `Đổi vai trò: ${editingUser.name}` : ''}
      >
        {editingUser && (
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Chọn vai trò mới
              </label>
              <select 
                className="c-field"
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setEditingUser(null)}>
                Hủy
              </button>
              <button type="submit" className="primary-button">
                Lưu quyền hạn
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
                style={{ background: '#b23b3b', borderColor: '#b23b3b' }}
                onClick={handleConfirmDelete}
              >
                Xác nhận xóa
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
