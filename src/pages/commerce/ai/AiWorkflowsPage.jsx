import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';

export default function AiWorkflowsPage() {
  const initialWorkflows = [
    {
      id: 'wf-1',
      name: 'Tự động tạo mô tả sản phẩm chuẩn SEO',
      description: 'Khi có sản phẩm mới thêm vào kho, AI tự động sinh nội dung mô tả tối ưu từ khóa Google và mạng xã hội.',
      trigger: 'Sản phẩm mới được tạo',
      status: 'Active',
      runsCount: 142,
      lastRun: '10 phút trước'
    },
    {
      id: 'wf-2',
      name: 'Phân tích cảm xúc & Tự động phản hồi đánh giá',
      description: 'Nhận diện đánh giá 5 sao để gửi lời cảm ơn tức thì, phân loại đánh giá dưới 3 sao chuyển CSKH xử lý ưu tiên.',
      trigger: 'Khách gửi đánh giá mới',
      status: 'Active',
      runsCount: 89,
      lastRun: '2 giờ trước'
    },
    {
      id: 'wf-3',
      name: 'Cảnh báo thông minh dự báo cạn kho',
      description: 'Dựa trên tốc độ bán thực tế và thời gian giao hàng của nhà cung cấp để đề xuất lịch nhập hàng trước khi hết hàng.',
      trigger: 'Định kỳ hàng ngày (06:00)',
      status: 'Active',
      runsCount: 31,
      lastRun: 'Hôm nay, 06:00'
    },
    {
      id: 'wf-4',
      name: 'Gợi ý mã ưu đãi giữ chân khách có nguy cơ rời bỏ',
      description: 'Tự động gửi voucher cá nhân hóa qua email cho khách hàng chưa mua lại sau 60 ngày.',
      trigger: 'Phân khúc khách hàng kích hoạt',
      status: 'Paused',
      runsCount: 18,
      lastRun: '3 ngày trước'
    }
  ];

  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWf, setNewWf] = useState({ name: '', description: '', trigger: 'Sản phẩm mới được tạo' });

  const [toasts, setToasts] = useState([]);
  const showToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  const handleToggleStatus = (id) => {
    setWorkflows(prev => prev.map(w => {
      if (w.id === id) {
        const nextStatus = w.status === 'Active' ? 'Paused' : 'Active';
        showToast(`Đã ${nextStatus === 'Active' ? 'kích hoạt' : 'tạm dừng'} quy trình "${w.name}"`);
        return { ...w, status: nextStatus };
      }
      return w;
    }));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newWf.name.trim()) return;
    const created = {
      id: `wf-${Date.now()}`,
      name: newWf.name.trim(),
      description: newWf.description.trim() || 'Quy trình AI tự động hóa',
      trigger: newWf.trigger,
      status: 'Active',
      runsCount: 0,
      lastRun: 'Chưa chạy'
    };
    setWorkflows([...workflows, created]);
    setIsAddModalOpen(false);
    setNewWf({ name: '', description: '', trigger: 'Sản phẩm mới được tạo' });
    showToast(`Đã thiết lập quy trình AI "${created.name}"!`);
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
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#887d6d' }}>
                <span>⚡ Điều kiện kích hoạt: <strong>{w.trigger}</strong></span>
                <span>📊 Lượt thực thi: <strong>{w.runsCount} lần</strong></span>
                <span>🕒 Lần chạy gần nhất: <strong>{w.lastRun}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                type="button" 
                className="secondary-button" 
                style={{ padding: '6px 14px', fontSize: '13px' }}
                onClick={() => showToast(`Đang chạy thử nghiệm quy trình "${w.name}"...`)}
              >
                Chạy thử
              </button>
              <button 
                type="button" 
                className={w.status === 'Active' ? 'secondary-button' : 'primary-button'}
                style={{ padding: '6px 14px', fontSize: '13px' }}
                onClick={() => handleToggleStatus(w.id)}
              >
                {w.status === 'Active' ? 'Tạm dừng' : 'Kích hoạt'}
              </button>
            </div>
          </div>
        ))}
      </div>

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
            <button type="submit" className="primary-button">
              Khởi tạo quy trình
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
