import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';
import api from '../../../services/api';

const QUICK_REPLIES = [
  'Dạ shop đã nhận đơn và đang đóng gói giao đi trong hôm nay ạ!',
  'Đơn hàng dự kiến giao tới tay bạn trong 1–2 ngày làm việc nhé!',
  'Bạn cho shop xin mã đơn hàng #SF để kiểm tra hành trình ngay ạ.',
  'Cảm ơn bạn rất nhiều vì đã tin tưởng lựa chọn sản phẩm Veylix Studio!'
];

export default function ChatPage() {
  const initialConversations = [
    {
      id: 'conv-1',
      customer: 'Sarah Kim',
      avatar: 'SK',
      lastMessage: 'Đơn hàng #SF83291 của mình bao giờ giao tới nơi vậy shop?',
      time: '5 phút trước',
      unread: true,
      messages: [
        { sender: 'customer', text: 'Chào shop, mình vừa đặt đơn hàng #SF83291 hôm qua.', time: '10:15' },
        { sender: 'bot', text: 'Chào bạn Sarah! Đơn hàng của bạn đã được xuất kho và đang trên đường giao.', time: '10:16' },
        { sender: 'customer', text: 'Đơn hàng #SF83291 của mình bao giờ giao tới nơi vậy shop?', time: '10:20' }
      ]
    },
    {
      id: 'conv-2',
      customer: 'Michael Tân',
      avatar: 'MT',
      lastMessage: 'Balo chống nước tốt lắm bạn nhé, cảm ơn shop!',
      time: '1 giờ trước',
      unread: false,
      messages: [
        { sender: 'customer', text: 'Balo chống nước tốt lắm bạn nhé, cảm ơn shop!', time: '09:30' },
        { sender: 'shop', text: 'Dạ cảm ơn bạn Michael Tân đã tin dùng sản phẩm của Veylix ạ!', time: '09:35' }
      ]
    },
    {
      id: 'conv-3',
      customer: 'Emily Davis',
      avatar: 'ED',
      lastMessage: 'Mình muốn đổi địa chỉ nhận hàng có kịp không shop?',
      time: '3 giờ trước',
      unread: false,
      messages: [
        { sender: 'customer', text: 'Mình muốn đổi địa chỉ nhận hàng có kịp không shop?', time: '07:15' }
      ]
    }
  ];

  const [conversations, setConversations] = useState(initialConversations);
  const [activeConvId, setActiveConvId] = useState('conv-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadFilter, setUnreadFilter] = useState('all'); // 'all' | 'unread'
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [isNewConvOpen, setIsNewConvOpen] = useState(false);
  const [newConvForm, setNewConvForm] = useState({
    customer: '',
    email: '',
    initialMessage: 'Xin chào quý khách, Veylix Studio có thể hỗ trợ gì cho đơn hàng của bạn ạ?'
  });

  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const loadConversations = useCallback(async (silent = false) => {
    try {
      const data = await api.getConversations();
      if (Array.isArray(data) && data.length > 0) {
        setConversations(data);
        setActiveConvId(curr => (data.some(c => c.id === curr) ? curr : data[0].id));
      }
      if (!silent) {
        // Không hiện toast khi load lần đầu
      }
    } catch (err) {
      if (!silent) showToast(err.message || 'Không thể tải hộp thư CSKH', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadConversations(true);
  }, [loadConversations]);

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      if (unreadFilter === 'unread' && !c.unread) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (c.customer || '').toLowerCase().includes(q);
        const matchMsg = (c.lastMessage || '').toLowerCase().includes(q);
        if (!matchName && !matchMsg) return false;
      }
      return true;
    });
  }, [conversations, unreadFilter, searchQuery]);

  const activeConv = conversations.find(c => c.id === activeConvId) || filteredConversations[0] || conversations[0];
  const unreadTotal = conversations.filter(c => c.unread).length;

  const handleSelectConversation = async (conv) => {
    setActiveConvId(conv.id);
    if (conv.unread) {
      setConversations(prev => prev.map(c => (c.id === conv.id ? { ...c, unread: false } : c)));
      try {
        await api.markConversationRead(conv.id);
      } catch {}
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv || isSending) return;
    const text = inputText.trim();

    setIsSending(true);
    try {
      const updated = await api.sendMessage(activeConv.id, text, 'shop');
      if (updated && updated.id) {
        setConversations(prev => prev.map(c => (c.id === activeConv.id ? updated : c)));
      } else {
        const newMsg = { sender: 'shop', text, time: 'Vừa xong' };
        setConversations(prev => prev.map(c => (
          c.id === activeConv.id
            ? { ...c, lastMessage: text, time: 'Vừa xong', unread: false, messages: [...(c.messages || []), newMsg] }
            : c
        )));
      }
      setInputText('');
    } catch (err) {
      showToast(err.message || 'Không thể gửi tin nhắn', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateConversation = async (e) => {
    e.preventDefault();
    if (!newConvForm.customer.trim() || !newConvForm.initialMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      const created = await api.createConversation({
        customer: newConvForm.customer.trim(),
        email: newConvForm.email.trim(),
        initialMessage: newConvForm.initialMessage.trim(),
      });
      if (created && created.id) {
        setConversations(prev => [created, ...prev.filter(c => c.id !== created.id)]);
        setActiveConvId(created.id);
      } else {
        await loadConversations(true);
      }
      setIsNewConvOpen(false);
      setNewConvForm({
        customer: '',
        email: '',
        initialMessage: 'Xin chào quý khách, Veylix Studio có thể hỗ trợ gì cho đơn hàng của bạn ạ?'
      });
      showToast(`Đã khởi tạo hội thoại với ${newConvForm.customer.trim()}!`);
    } catch (err) {
      showToast(err.message || 'Không thể tạo cuộc hội thoại mới', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="chat-support-page" style={{ paddingBottom: '36px' }}>
      <header className="commerce-heading">
        <div>
          <div className="commerce-breadcrumb">
            <Link to="/overview">Tổng quan</Link>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </span>
            <span>Hộp thư & CSKH</span>
          </div>
          <h1>Hộp thư hỗ trợ khách hàng<span>.</span></h1>
        </div>

        <div className="commerce-heading-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={async () => {
              await loadConversations(false);
              showToast('Đã đồng bộ tin nhắn mới nhất từ cửa hàng!');
            }}
          >
            Làm mới hộp thư
          </button>
          <button type="button" className="primary-button" onClick={() => setIsNewConvOpen(true)}>
            + Hội thoại mới
          </button>
        </div>
      </header>

      {/* Giao diện khung Chat 2 cột */}
      <div 
        className="glass-card" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '340px 1fr', 
          minHeight: '590px', 
          padding: 0, 
          overflow: 'hidden' 
        }}
      >
        {/* Cột danh sách hội thoại */}
        <div style={{ borderRight: '1px solid #ebdccb', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #ebdccb', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '15px' }}>Hội thoại ({filteredConversations.length})</strong>
              <div style={{ display: 'inline-flex', gap: '4px' }}>
                <button
                  type="button"
                  className={`pill ${unreadFilter === 'all' ? 'active' : ''}`}
                  style={{ fontSize: '11.5px', padding: '3px 9px' }}
                  onClick={() => setUnreadFilter('all')}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  className={`pill ${unreadFilter === 'unread' ? 'active' : ''}`}
                  style={{ fontSize: '11.5px', padding: '3px 9px' }}
                  onClick={() => setUnreadFilter('unread')}
                >
                  Chưa đọc ({unreadTotal})
                </button>
              </div>
            </div>

            <input
              type="search"
              placeholder="Tìm tên khách hàng hoặc tin nhắn..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd0be', fontSize: '12.5px', background: '#faf6ee' }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.length === 0 ? (
              <p style={{ padding: '24px 16px', textAlign: 'center', fontSize: '12.5px', color: '#776c5b' }}>
                Không có hội thoại nào khớp bộ lọc.
              </p>
            ) : (
              filteredConversations.map(c => {
                const isActive = activeConv && c.id === activeConv.id;
                return (
                  <div 
                    key={c.id}
                    onClick={() => handleSelectConversation(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      background: isActive ? '#f4ece0' : 'transparent',
                      borderBottom: '1px solid #f0e6d6',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div className="customer-avatar" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                      {c.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '13px', color: '#2b2316' }}>{c.customer}</strong>
                        <small style={{ color: '#887d6d', fontSize: '11px' }}>{c.time}</small>
                      </div>
                      <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#685d4f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.lastMessage}
                      </p>
                    </div>
                    {c.unread && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Khung chat tin nhắn chi tiết */}
        {activeConv ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header hội thoại */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #ebdccb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#faf6ee' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="customer-avatar" style={{ width: '36px', height: '36px', fontSize: '13px' }}>
                  {activeConv.avatar}
                </div>
                <div>
                  <strong style={{ fontSize: '14px' }}>{activeConv.customer}</strong>
                  <small style={{ display: 'block', color: '#10b981', fontSize: '11px' }}>● Đang trực tuyến (Đồng bộ Storefront Live Chat)</small>
                </div>
              </div>
              <Link to="/commerce/customers" className="secondary-button" style={{ padding: '4px 10px', fontSize: '12px' }}>
                Xem hồ sơ khách
              </Link>
            </div>

            {/* Danh sách tin nhắn */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#ffffff30' }}>
              {(activeConv.messages || []).map((m, idx) => {
                const isMe = m.sender === 'shop' || m.sender === 'bot';
                return (
                  <div 
                    key={idx}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '72%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div 
                      style={{
                        background: isMe ? '#27342b' : '#fff',
                        color: isMe ? '#fff' : '#2b2316',
                        padding: '10px 16px',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        fontSize: '13px',
                        lineHeight: '1.5'
                      }}
                    >
                      {m.text}
                    </div>
                    <small style={{ color: '#887d6d', fontSize: '11px', marginTop: '4px' }}>
                      {m.sender === 'bot' ? 'Trợ lý AI' : m.sender === 'shop' ? 'Bạn' : activeConv.customer} · {m.time}
                    </small>
                  </div>
                );
              })}
            </div>

            {/* Gợi ý trả lời nhanh */}
            <div style={{ padding: '8px 16px', borderTop: '1px solid #f0e6d6', background: '#fcfaf5', display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {QUICK_REPLIES.map((qr, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInputText(qr)}
                  style={{
                    border: '1px solid #dfd3c0',
                    background: '#fff',
                    borderRadius: '999px',
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    color: '#4e4334',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  + {qr.slice(0, 38)}...
                </button>
              ))}
            </div>

            {/* Ô nhập tin nhắn */}
            <form onSubmit={handleSend} style={{ padding: '14px 16px', borderTop: '1px solid #ebdccb', display: 'flex', gap: '10px', background: '#fff' }}>
              <input 
                type="text"
                placeholder="Nhập câu trả lời cho khách hàng..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c8b8', fontSize: '13px' }}
              />
              <button type="submit" disabled={isSending} className="primary-button" style={{ padding: '10px 20px', fontSize: '13px' }}>
                {isSending ? 'Đang gửi...' : 'Gửi tin'}
              </button>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#776c5b' }}>
            Chưa có cuộc hội thoại nào
          </div>
        )}
      </div>

      {/* Modal: Khởi tạo hội thoại mới */}
      <DialogModal
        isOpen={isNewConvOpen}
        onClose={() => setIsNewConvOpen(false)}
        title="Bắt đầu hội thoại CSKH mới"
      >
        <form onSubmit={handleCreateConversation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Họ tên khách hàng *
            </label>
            <input
              type="text"
              required
              className="c-field"
              placeholder="VD: Nguyễn Minh Châu"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newConvForm.customer}
              onChange={e => setNewConvForm({ ...newConvForm, customer: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Email khách hàng (tùy chọn)
            </label>
            <input
              type="email"
              className="c-field"
              placeholder="VD: chau.nguyen@example.com"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newConvForm.email}
              onChange={e => setNewConvForm({ ...newConvForm, email: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Tin nhắn mở đầu *
            </label>
            <textarea
              required
              rows={3}
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newConvForm.initialMessage}
              onChange={e => setNewConvForm({ ...newConvForm, initialMessage: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button type="button" className="secondary-button" onClick={() => setIsNewConvOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="primary-button" disabled={isSending}>
              {isSending ? 'Đang khởi tạo...' : 'Tạo & Gửi tin'}
            </button>
          </div>
        </form>
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
