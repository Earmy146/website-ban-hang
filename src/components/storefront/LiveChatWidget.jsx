import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SfIcon } from './StoreIcons';
import { useStore } from './StoreContext';
import { storeApi } from './storeApi';

const GUEST_CHAT_KEY = 'veylix_sf_chat_identity_v1';

function readChatIdentity() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(GUEST_CHAT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function LiveChatWidget() {
  const { customer, showToast } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [guestIdentity, setGuestIdentity] = useState(() => readChatIdentity());
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const activeIdentity = customer
    ? { name: customer.name, email: customer.email || '' }
    : guestIdentity;

  const loadConversation = useCallback(async (silent = false) => {
    if (!activeIdentity?.name) return;
    try {
      if (!silent) setLoading(true);
      const res = await storeApi.getChat(activeIdentity.name, activeIdentity.email);
      const conv = Array.isArray(res) ? res[0] : res?.conversation || res;
      if (conv && Array.isArray(conv.messages)) {
        setMessages(conv.messages);
      }
    } catch {
      // Keep current messages if no conversation created yet
    } finally {
      if (!silent) setLoading(false);
    }
  }, [activeIdentity?.name, activeIdentity?.email]);

  useEffect(() => {
    if (isOpen && activeIdentity?.name) {
      loadConversation();
      const timer = setInterval(() => {
        loadConversation(true);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [isOpen, activeIdentity?.name, loadConversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleStartChat = (e) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    const cleanEmail = emailInput.trim();
    if (!cleanName) {
      showToast('Vui lòng nhập tên của bạn để bắt đầu trò chuyện', 'error');
      return;
    }
    const ident = { name: cleanName, email: cleanEmail };
    setGuestIdentity(ident);
    try {
      window.localStorage.setItem(GUEST_CHAT_KEY, JSON.stringify(ident));
    } catch {
      // ignore
    }
  };

  const handleUseDemoSarah = () => {
    const ident = { name: 'Sarah Kim', email: 'sarah.kim@example.com' };
    setGuestIdentity(ident);
    try {
      window.localStorage.setItem(GUEST_CHAT_KEY, JSON.stringify(ident));
    } catch {
      // ignore
    }
  };

  const handleSend = async (customText) => {
    const text = String(customText ?? draft).trim();
    if (!text || !activeIdentity?.name || sending) return;

    const optimisticMsg = {
      sender: 'customer',
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    if (customText === undefined) setDraft('');

    try {
      setSending(true);
      const res = await storeApi.sendChatMessage({
        customer: activeIdentity.name,
        email: activeIdentity.email || undefined,
        text,
      });
      const conv = res?.conversation || res;
      if (conv && Array.isArray(conv.messages)) {
        setMessages(conv.messages);
      }
    } catch (err) {
      showToast(err.message || 'Không thể gửi tin nhắn lúc này', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="sf-chat-widget">
      {isOpen && (
        <div className="sf-chat-panel" role="dialog" aria-label="Trò chuyện trực tuyến với Veylix">
          <div className="sf-chat-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#44d685',
                    display: 'inline-block',
                  }}
                />
                <strong style={{ fontSize: '14.5px' }}>Veylix Concierge</strong>
              </div>
              <small style={{ fontSize: '11.5px', opacity: 0.8 }}>
                {activeIdentity?.name
                  ? `Đang hỗ trợ: ${activeIdentity.name}`
                  : 'Phản hồi trực tiếp từ đội ngũ CSKH'}
              </small>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {activeIdentity?.name && (
                <button
                  type="button"
                  onClick={() => loadConversation(false)}
                  title="Làm mới tin nhắn từ cửa hàng"
                  aria-label="Làm mới hội thoại"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <SfIcon name="refresh" size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Thu gọn cửa sổ chat"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <SfIcon name="close" size={16} />
              </button>
            </div>
          </div>

          {!activeIdentity?.name ? (
            <form
              onSubmit={handleStartChat}
              style={{ padding: '20px', display: 'grid', gap: '12px', overflowY: 'auto' }}
            >
              <p style={{ fontSize: '13.5px', color: 'var(--sf-text-muted)' }}>
                Nhập họ tên & email để kết nối trực tiếp với chuyên viên tư vấn Veylix Studio.
              </p>
              <div className="sf-field">
                <label htmlFor="sf-chat-name">Họ và tên *</label>
                <input
                  id="sf-chat-name"
                  className="sf-input"
                  placeholder="Ví dụ: Nguyễn Minh Anh"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  required
                />
              </div>
              <div className="sf-field">
                <label htmlFor="sf-chat-email">Email (nhận thông báo phản hồi)</label>
                <input
                  id="sf-chat-email"
                  type="email"
                  className="sf-input"
                  placeholder="ban@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </div>
              <button type="submit" className="sf-btn sf-btn-primary sf-btn-block">
                Bắt đầu trò chuyện
              </button>
              <button
                type="button"
                className="sf-btn sf-btn-outline sf-btn-sm sf-btn-block"
                onClick={handleUseDemoSarah}
              >
                Dùng thử nhanh với khách Sarah Kim
              </button>
            </form>
          ) : (
            <>
              <div className="sf-chat-messages" ref={scrollRef}>
                <div className="sf-chat-bubble is-shop">
                  Xin chào <strong>{activeIdentity.name}</strong>! Veylix Studio có thể hỗ trợ gì cho bạn về sản phẩm, mã ưu đãi hay đơn hàng hôm nay?
                  <small>Trợ lý cửa hàng</small>
                </div>

                {loading && messages.length === 0 && (
                  <div style={{ fontSize: '12.5px', color: 'var(--sf-text-muted)', textAlign: 'center' }}>
                    Đang đồng bộ hội thoại...
                  </div>
                )}

                {messages.map((m, idx) => {
                  const isCust = m.sender === 'customer';
                  return (
                    <div
                      key={idx}
                      className={`sf-chat-bubble ${isCust ? 'is-customer' : 'is-shop'}`}
                    >
                      <div>{m.text}</div>
                      <small>
                        {isCust ? 'Bạn' : m.sender === 'bot' ? 'Trợ lý Veylix' : 'Chuyên viên Shop'} · {m.time || 'Vừa xong'}
                      </small>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  padding: '8px 12px',
                  background: 'var(--sf-bg-soft)',
                  borderTop: '1px solid var(--sf-border-subtle)',
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                }}
              >
                {[
                  'Tư vấn chọn size áo',
                  'Kiểm tra tiến độ đơn hàng',
                  'Chính sách đổi trả 30 ngày',
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q)}
                    style={{
                      whiteSpace: 'nowrap',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      padding: '5px 10px',
                      background: 'var(--sf-surface-elevated)',
                      color: 'var(--sf-text)',
                      border: '1.5px solid var(--sf-border-color)',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <form
                className="sf-chat-input-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <input
                  className="sf-input"
                  placeholder="Nhập tin nhắn gửi cửa hàng..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="sf-btn sf-btn-primary"
                  style={{ padding: '0 14px' }}
                  disabled={sending || !draft.trim()}
                  aria-label="Gửi tin nhắn"
                >
                  <SfIcon name="send" size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        className="sf-chat-launcher"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
      >
        <SfIcon name={isOpen ? 'close' : 'chat'} size={19} />
        <span>{isOpen ? 'Đóng hỗ trợ' : 'Chat với Shop'}</span>
      </button>
    </div>
  );
}
