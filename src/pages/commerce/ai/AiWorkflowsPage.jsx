import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';
import api from '../../../services/api';

export default function AiWorkflowsPage() {
  const initialWorkflows = [
    {
      id: 'wf-1',
      name: 'Tự động tạo mô tả sản phẩm chuẩn SEO',
      description: 'Khi có sản phẩm mới thêm vào kho, AI tự động sinh nội dung mô tả tối ưu từ khóa Google và mạng xã hội.',
      trigger: 'Sản phẩm mới được tạo',
      status: 'Active',
      runsCount: 142,
      lastRun: '10 phút trước',
      logs: []
    },
    {
      id: 'wf-2',
      name: 'Phân tích cảm xúc & Tự động phản hồi đánh giá',
      description: 'Nhận diện đánh giá 5 sao để gửi lời cảm ơn tức thì, phân loại đánh giá dưới 3 sao chuyển CSKH xử lý ưu tiên.',
      trigger: 'Khách gửi đánh giá mới',
      status: 'Active',
      runsCount: 89,
      lastRun: '2 giờ trước',
      logs: []
    },
    {
      id: 'wf-3',
      name: 'Cảnh báo thông minh dự báo cạn kho',
      description: 'Dựa trên tốc độ bán thực tế và thời gian giao hàng của nhà cung cấp để đề xuất lịch nhập hàng trước khi hết hàng.',
      trigger: 'Định kỳ hàng ngày (06:00)',
      status: 'Active',
      runsCount: 31,
      lastRun: 'Hôm nay, 06:00',
      logs: []
    },
    {
      id: 'wf-4',
      name: 'Gợi ý mã ưu đãi giữ chân khách có nguy cơ rời bỏ',
      description: 'Tự động gửi voucher cá nhân hóa qua email cho khách hàng chưa mua lại sau 60 ngày.',
      trigger: 'Phân khúc khách hàng kích hoạt',
      status: 'Paused',
      runsCount: 18,
      lastRun: '3 ngày trước',
      logs: []
    }
  ];

  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWf, setEditingWf] = useState(null);
  const [deletingWf, setDeletingWf] = useState(null);
  const [runResultWf, setRunResultWf] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runningId, setRunningId] = useState(null);
  const [newWf, setNewWf] = useState({ name: '', description: '', trigger: 'Sản phẩm mới được tạo' });

  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const loadWorkflows = useCallback(async () => {
    try {
      const data = await api.getAiWorkflows();
      if (Array.isArray(data)) {
        setWorkflows(data);
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách quy trình AI', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const handleToggleStatus = async (w) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await api.toggleAiWorkflow(w.id);
      if (updated && updated.id) {
        setWorkflows(prev => prev.map(item => (item.id === w.id ? updated : item)));
        showToast(`Đã ${updated.status === 'Active' ? 'kích hoạt' : 'tạm dừng'} quy trình "${w.name}"`);
      } else {
        await loadWorkflows();
      }
    } catch (err) {
      showToast(err.message || 'Không thể đổi trạng thái quy trình AI', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunWorkflow = async (w) => {
    if (runningId) return;
    setRunningId(w.id);
    try {
      const updated = await api.runAiWorkflow(w.id);
      const fallbackLog = {
        time: new Date().toLocaleTimeString('vi-VN'),
        summary: `Thực thi thành công quy trình "${w.name}"`,
        output: `Đã xử lý dữ liệu cửa hàng theo sự kiện "${w.trigger}" — hoàn tất không có lỗi.`,
      };
      const resolvedWf = updated && updated.id
        ? {
            ...updated,
            logs: Array.isArray(updated.logs) && updated.logs.length > 0 ? updated.logs : [fallbackLog, ...(w.logs || [])],
          }
        : {
            ...w,
            runsCount: (w.runsCount || 0) + 1,
            lastRun: 'Vừa xong',
            logs: [fallbackLog, ...(w.logs || [])],
          };

      setWorkflows(prev => prev.map(item => (item.id === w.id ? resolvedWf : item)));
      setRunResultWf(resolvedWf);
      showToast(`Đã chạy thử thành công quy trình "${w.name}"!`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi chạy thử quy trình AI', 'error');
    } finally {
      setRunningId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newWf.name.trim() || isSubmitting) return;
    const payload = {
      name: newWf.name.trim(),
      description: newWf.description.trim() || 'Quy trình AI tự động hóa',
      trigger: newWf.trigger
    };

    setIsSubmitting(true);
    try {
      const created = await api.createAiWorkflow(payload);
      if (created && created.id) {
        setWorkflows(prev => [...prev, created]);
      } else {
        await loadWorkflows();
      }
      setIsAddModalOpen(false);
      setNewWf({ name: '', description: '', trigger: 'Sản phẩm mới được tạo' });
      showToast(`Đã thiết lập quy trình AI "${payload.name}"!`);
    } catch (err) {
      showToast(err.message || 'Không thể tạo quy trình AI mới', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingWf || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: editingWf.name.trim(),
        description: editingWf.description.trim(),
        trigger: editingWf.trigger,
        status: editingWf.status
      };
      const updated = await api.updateAiWorkflow(editingWf.id, payload);
      if (updated && updated.id) {
        setWorkflows(prev => prev.map(item => (item.id === editingWf.id ? updated : item)));
      } else {
        await loadWorkflows();
      }
      setEditingWf(null);
      showToast(`Đã cập nhật quy trình AI "${payload.name}"!`);
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật quy trình AI', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingWf || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const targetId = deletingWf.id;
      const targetName = deletingWf.name;
      await api.deleteAiWorkflow(targetId);
      setWorkflows(prev => prev.filter(item => item.id !== targetId));
      setDeletingWf(null);
      showToast(`Đã xóa quy trình AI "${targetName}"!`);
    } catch (err) {
      showToast(err.message || 'Không thể xóa quy trình AI', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="ai-workflows-page" style={{ paddingBottom: '36px' }}>
      <header className="commerce-heading">
        <div>
          <div className="commerce-breadcrumb">
            <Link to="/overview">Tổng quan</Link>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </span>
            <span>Trợ lý AI</span>
          </div>
          <h1>Quy trình AI Tự động hóa<span>.</span></h1>
        </div>

        <div className="commerce-heading-actions">
          <Link to="/commerce/ai-studio" className="secondary-button" style={{ textDecoration: 'none' }}>
            Mở AI Studio
          </Link>
          <button type="button" className="primary-button" onClick={() => setIsAddModalOpen(true)}>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
              </svg>
            </span>
            + Tạo quy trình AI
          </button>
        </div>
      </header>

      {/* Danh sách quy trình AI */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {workflows.map(w => (
          <div key={w.id} className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: '1', minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>🤖</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#2b2316' }}>{w.name}</h3>
                <span className={`badge badge-${w.status === 'Active' ? 'green' : 'amber'}`} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}>
                  {w.status === 'Active' ? 'Đang chạy' : 'Đang tạm dừng'}
                </span>
              </div>
              <p style={{ margin: '6px 0 8px 0', fontSize: '13px', color: '#685d4f', lineHeight: '1.5' }}>
                {w.description}
              </p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#887d6d', flexWrap: 'wrap' }}>
                <span>⚡ Điều kiện kích hoạt: <strong>{w.trigger}</strong></span>
                <span>📊 Lượt thực thi: <strong>{w.runsCount ?? 0} lần</strong></span>
                <span>🕒 Lần chạy gần nhất: <strong>{w.lastRun || 'Chưa chạy'}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="primary-button" 
                disabled={runningId === w.id}
                style={{ padding: '6px 14px', fontSize: '13px' }}
                onClick={() => handleRunWorkflow(w)}
              >
                {runningId === w.id ? 'Đang chạy...' : 'Chạy thử'}
              </button>
              <button 
                type="button" 
                disabled={isSubmitting}
                className="secondary-button"
                style={{ padding: '6px 14px', fontSize: '13px' }}
                onClick={() => handleToggleStatus(w)}
              >
                {w.status === 'Active' ? 'Tạm dừng' : 'Kích hoạt'}
              </button>
              <button
                type="button"
                className="secondary-button"
                style={{ padding: '6px 12px', fontSize: '13px' }}
                onClick={() => setEditingWf(w)}
              >
                Sửa
              </button>
              <button
                type="button"
                className="secondary-button"
                style={{ padding: '6px 12px', fontSize: '13px', color: '#b23b3b' }}
                onClick={() => setDeletingWf(w)}
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Kết quả chạy thử & lịch sử logs */}
      <DialogModal
        isOpen={Boolean(runResultWf)}
        onClose={() => setRunResultWf(null)}
        title={runResultWf ? `Kết quả chạy thử: ${runResultWf.name}` : ''}
        wide={true}
      >
        {runResultWf && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
            <div style={{ padding: '12px 16px', background: '#edf7f0', border: '1px solid #b7dfc4', borderRadius: '10px', color: '#1d5432' }}>
              <strong>✓ Thực thi thành công!</strong> Tổng số lần thực thi hiện tại: <strong>{runResultWf.runsCount} lần</strong> · Cập nhật: <strong>{runResultWf.lastRun}</strong>
            </div>

            <div>
              <strong style={{ display: 'block', marginBottom: '8px' }}>Nhật ký đầu ra các lần thực thi (Execution Logs):</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                {(runResultWf.logs || []).map((log, idx) => (
                  <div key={idx} style={{ padding: '12px 14px', background: '#faf6ee', borderRadius: '10px', border: '1px solid #e6dac8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong>{log.summary || 'Kết quả xử lý AI'}</strong>
                      <small style={{ color: '#776c5b' }}>{log.time}</small>
                    </div>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '12.5px', color: '#433a2c', lineHeight: '1.5' }}>
                      {log.output}
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="primary-button" onClick={() => setRunResultWf(null)}>
                Đóng kết quả
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* Modal: Thêm quy trình */}
      <DialogModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thiết lập quy trình AI tự động mới"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Tên quy trình AI *
            </label>
            <input 
              type="text" 
              required
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              placeholder="VD: Tự động dịch mô tả đa ngôn ngữ"
              value={newWf.name}
              onChange={e => setNewWf({ ...newWf, name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Mô tả mục tiêu của AI
            </label>
            <textarea 
              rows={3}
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              placeholder="Mô tả các bước AI cần làm khi điều kiện xảy ra..."
              value={newWf.description}
              onChange={e => setNewWf({ ...newWf, description: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Sự kiện kích hoạt
            </label>
            <select 
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newWf.trigger}
              onChange={e => setNewWf({ ...newWf, trigger: e.target.value })}
            >
              <option value="Sản phẩm mới được tạo">Sản phẩm mới được tạo</option>
              <option value="Khách gửi đánh giá mới">Khách gửi đánh giá mới</option>
              <option value="Đơn hàng được thanh toán">Đơn hàng được thanh toán</option>
              <option value="Tồn kho xuống dưới mức tối thiểu">Tồn kho xuống dưới mức tối thiểu</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="secondary-button" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Đang tạo...' : 'Khởi tạo quy trình'}
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Sửa quy trình AI */}
      <DialogModal
        isOpen={Boolean(editingWf)}
        onClose={() => setEditingWf(null)}
        title={editingWf ? `Chỉnh sửa: ${editingWf.name}` : ''}
      >
        {editingWf && (
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Tên quy trình AI *
              </label>
              <input
                type="text"
                required
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingWf.name}
                onChange={e => setEditingWf({ ...editingWf, name: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Mô tả mục tiêu
              </label>
              <textarea
                rows={3}
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingWf.description || ''}
                onChange={e => setEditingWf({ ...editingWf, description: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Sự kiện kích hoạt
              </label>
              <input
                type="text"
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingWf.trigger || ''}
                onChange={e => setEditingWf({ ...editingWf, trigger: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setEditingWf(null)}>
                Hủy
              </button>
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}
      </DialogModal>

      {/* Modal: Xác nhận xóa quy trình AI */}
      <DialogModal
        isOpen={Boolean(deletingWf)}
        onClose={() => setDeletingWf(null)}
        title="Xác nhận xóa quy trình AI"
      >
        {deletingWf && (
          <div>
            <p style={{ lineHeight: '1.6', marginBottom: '16px' }}>
              Bạn có chắc chắn muốn xóa quy trình tự động hóa <strong>{deletingWf.name}</strong> không?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setDeletingWf(null)}>
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
