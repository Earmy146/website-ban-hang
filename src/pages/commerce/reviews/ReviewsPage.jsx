import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';
import { initialReviews } from '../../../data/mockReviews';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState(initialReviews);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [replyingReview, setReplyingReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [viewingReview, setViewingReview] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  // Lọc
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (ratingFilter !== 'all' && r.rating !== parseInt(ratingFilter, 10)) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCust = r.customerName.toLowerCase().includes(q);
        const matchProd = r.productName.toLowerCase().includes(q);
        const matchText = r.comment.toLowerCase().includes(q) || r.title.toLowerCase().includes(q);
        if (!matchCust && !matchProd && !matchText) return false;
      }
      return true;
    });
  }, [reviews, ratingFilter, statusFilter, searchQuery]);

  // Duyệt đánh giá
  const handleApprove = (id) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'Published' } : r));
    showToast('Đã phê duyệt công khai đánh giá!');
  };

  // Ẩn đánh giá
  const handleHide = (id) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'Flagged' } : r));
    showToast('Đã chuyển đánh giá vào danh sách xem xét/ẩn!');
  };

  // Gửi phản hồi
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingReview) return;
    setReviews(prev => prev.map(r => r.id === replyingReview.id ? { ...r, response: replyText.trim() } : r));
    setReplyingReview(null);
    setReplyText('');
    showToast(`Đã gửi phản hồi cho khách hàng ${replyingReview.customerName}!`);
  };

  // Xuất file CSV
  const handleExport = () => {
    const headers = ['Sản phẩm', 'Khách hàng', 'Số sao', 'Tiêu đề', 'Nội dung', 'Thời gian', 'Trạng thái', 'Phản hồi từ shop'];
    const rows = filteredReviews.map(r => [
      `"${r.productName}"`,
      `"${r.customerName}"`,
      r.rating,
      `"${r.title}"`,
      `"${r.comment}"`,
      `"${r.date}"`,
      r.status,
      `"${r.response || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danh_gia_khach_hang_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file đánh giá thành công!');
  };

  return (
    <div className="reviews-page" style={{ paddingBottom: '36px' }}>
      <header className="commerce-heading">
        <div>
          <div className="commerce-breadcrumb">
            <Link to="/overview">Tổng quan</Link>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </span>
            <span>Đánh giá & Xếp hạng</span>
          </div>
          <h1>Đánh giá & Xếp hạng<span>.</span></h1>
        </div>

        <div className="commerce-heading-actions">
          <button type="button" className="secondary-button" onClick={handleExport}>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z"></path>
              </svg>
            </span>
            Xuất file
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <section className="glass-card c-toolbar">
        <div className="c-toolbar-filters">
          <label className="c-field">
            <span className="sr-only">Lọc theo số sao</span>
            <select 
              value={ratingFilter} 
              onChange={e => setRatingFilter(e.target.value)}
              aria-label="Lọc theo xếp hạng sao"
            >
              <option value="all">Tất cả xếp hạng sao</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
              <option value="4">⭐⭐⭐⭐ (4 sao)</option>
              <option value="3">⭐⭐⭐ (3 sao)</option>
            </select>
          </label>

          <label className="c-field">
            <span className="sr-only">Lọc theo trạng thái</span>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              aria-label="Lọc theo trạng thái kiểm duyệt"
            >
              <option value="all">Tất cả trạng thái duyệt</option>
              <option value="Published">Đã duyệt công khai</option>
              <option value="Pending">Chờ kiểm duyệt</option>
              <option value="Flagged">Đã ẩn / Báo cáo</option>
            </select>
          </label>
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
              placeholder="Tìm theo sản phẩm, người đánh giá..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm đánh giá"
            />
          </label>
        </div>
      </section>

      {/* Danh sách thẻ đánh giá */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        {filteredReviews.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '48px 20px', color: '#776c5b' }}>
            Không tìm thấy đánh giá nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          filteredReviews.map(r => (
            <div 
              key={r.id} 
              className="glass-card" 
              style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#d97706', fontSize: '15px' }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </span>
                    <strong style={{ fontSize: '16px', color: '#271f14' }}>{r.title}</strong>
                  </div>
                  <div style={{ fontSize: '13px', color: '#7a7061', marginTop: '4px' }}>
                    Bởi <strong>{r.customerName}</strong> cho sản phẩm <strong style={{ color: '#885600' }}>{r.productName}</strong> · {r.date}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span 
                    className={`badge badge-${r.status === 'Published' ? 'green' : r.status === 'Pending' ? 'amber' : 'red'}`}
                    style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px' }}
                  >
                    {r.status === 'Published' ? 'Đã duyệt' : r.status === 'Pending' ? 'Chờ duyệt' : 'Đã ẩn'}
                  </span>

                  {r.status === 'Pending' && (
                    <button 
                      type="button" 
                      className="primary-button" 
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                      onClick={() => handleApprove(r.id)}
                    >
                      Duyệt ngay
                    </button>
                  )}

                  {r.status === 'Published' && (
                    <button 
                      type="button" 
                      className="secondary-button" 
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                      onClick={() => handleHide(r.id)}
                    >
                      Ẩn đánh giá
                    </button>
                  )}

                  <button 
                    type="button" 
                    className="secondary-button" 
                    style={{ padding: '4px 12px', fontSize: '12px' }}
                    onClick={() => {
                      setReplyingReview(r);
                      setReplyText(r.response || '');
                    }}
                  >
                    {r.response ? 'Sửa phản hồi' : 'Trả lời'}
                  </button>
                </div>
              </div>

              <p style={{ margin: '4px 0', fontSize: '14px', lineHeight: '1.6', color: '#443c2f' }}>
                "{r.comment}"
              </p>

              {r.response && (
                <div style={{ background: '#f5efe4', padding: '12px 16px', borderRadius: '10px', borderLeft: '4px solid #bda688', marginTop: '4px' }}>
                  <small style={{ fontWeight: '700', color: '#685e50', display: 'block', marginBottom: '2px' }}>
                    Phản hồi từ cửa hàng Veylix:
                  </small>
                  <p style={{ margin: 0, fontSize: '13px', color: '#3d3527' }}>{r.response}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: Phản hồi khách hàng */}
      <DialogModal
        isOpen={Boolean(replyingReview)}
        onClose={() => setReplyingReview(null)}
        title={replyingReview ? `Phản hồi cho ${replyingReview.customerName}` : ''}
      >
        {replyingReview && (
          <form onSubmit={handleSendReply} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '13px', color: '#665c4e', margin: 0 }}>
              Đánh giá về sản phẩm: <strong>{replyingReview.productName}</strong>
            </p>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Nội dung phản hồi từ ban quản trị *
              </label>
              <textarea 
                required
                rows={4}
                className="c-field"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                placeholder="VD: Cảm ơn bạn đã tin tưởng ủng hộ shop..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setReplyingReview(null)}>
                Hủy
              </button>
              <button type="submit" className="primary-button">
                Gửi phản hồi
              </button>
            </div>
          </form>
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
