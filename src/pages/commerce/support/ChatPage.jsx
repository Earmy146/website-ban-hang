import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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
  const [inputText, setInputText] = useState('');

  const activeConv = conversations.find(c => c.id === activeConvId) || conversations[0];

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      sender: 'shop',
      text: inputText.trim(),
      time: 'Vừa xong'
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          lastMessage: inputText.trim(),
          time: 'Vừa xong',
          unread: false,
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));

    setInputText('');
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
      </header>

      {/* Giao diện khung Chat 2 cột */}
      <div 
        className="glass-card" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '320px 1fr', 
          minHeight: '560px', 
          padding: 0, 
          overflow: 'hidden' 
        }}
      >
        {/* Cột danh sách hội thoại */}
        <div style={{ borderRight: '1px solid #ebdccb', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #ebdccb' }}>
            <strong style={{ fontSize: '15px' }}>Hội thoại ({conversations.length})</strong>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.map(c => {
              const isActive = c.id === activeConvId;
              return (
                <div 
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
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
            })}
          </div>
        </div>

        {/* Khung chat tin nhắn chi tiết */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header hội thoại */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #ebdccb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#faf6ee' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="customer-avatar" style={{ width: '36px', height: '36px', fontSize: '13px' }}>
                {activeConv.avatar}
              </div>
              <div>
                <strong style={{ fontSize: '14px' }}>{activeConv.customer}</strong>
                <small style={{ display: 'block', color: '#10b981', fontSize: '11px' }}>● Đang trực tuyến</small>
              </div>
            </div>
            <Link to="/commerce/customers" className="secondary-button" style={{ padding: '4px 10px', fontSize: '12px' }}>
              Xem hồ sơ khách
            </Link>
          </div>

          {/* Danh sách tin nhắn */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', background: '#ffffff30' }}>
            {activeConv.messages.map((m, idx) => {
              const isMe = m.sender === 'shop' || m.sender === 'bot';
              return (
                <div 
                  key={idx}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
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

          {/* Ô nhập tin nhắn */}
          <form onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid #ebdccb', display: 'flex', gap: '10px', background: '#fff' }}>
            <input 
              type="text"
              placeholder="Nhập câu trả lời cho khách hàng..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #d4c8b8', fontSize: '13px' }}
            />
            <button type="submit" className="primary-button" style={{ padding: '10px 20px', fontSize: '13px' }}>
              Gửi tin
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

