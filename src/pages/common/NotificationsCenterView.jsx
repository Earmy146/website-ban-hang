import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { request, emitTopbarRefresh } from '../../services/api';
import {
  PageHeader,
  QuickGuideBanner,
  FilterPillTabs,
  ToastStack,
  useToast,
  exportCsvFile,
} from './commonWidgets';

const TYPE_VISUAL = {
  order: { icon: '🛍️', badge: 'green', label: 'Đơn hàng mới', actionLabel: 'Xem Đơn hàng →', actionTo: '/commerce/orders' },
  warning: { icon: '⚠️', badge: 'amber', label: 'Cảnh báo tồn kho', actionLabel: 'Kiểm tra Kho →', actionTo: '/commerce/stock' },
  danger: { icon: '🚚', badge: 'red', label: 'Sự cố vận chuyển', actionLabel: 'Xem Vận đơn →', actionTo: '/commerce/fulfillment' },
  review: { icon: '⭐', badge: 'purple', label: 'Đánh giá sản phẩm', actionLabel: 'Xem Đánh giá →', actionTo: '/commerce/reviews' },
  finance: { icon: '💳', badge: 'blue', label: 'Tài chính & Quyết toán', actionLabel: 'Xem Giao dịch →', actionTo: '/commerce/transactions' },
  info: { icon: '🔔', badge: 'blue', label: 'Hệ thống & CSKH', actionLabel: 'Mở Hộp thư →', actionTo: '/commerce/chat' },
};

export default function NotificationsCenterView({ navInfo }) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { toasts, showToast } = useToast();

  const loadNotifications = useCallback(async (toastMsg = null) => {
    setIsLoading(true);
    try {
      const data = await request('/notifications');
      if (Array.isArray(data)) {
        setNotifications(data);
      }
      if (toastMsg) showToast(toastMsg);
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách thông báo', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkOneRead = async (item) => {
    if (!item.unread || busyId) return;
    setBusyId(item.id);
    try {
      await request(`/notifications/${encodeURIComponent(item.id)}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
      );
      emitTopbarRefresh();
      showToast(`Đã đánh dấu đã đọc: "${item.title}"`);
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật thông báo', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadCount = notifications.filter((n) => n.unread).length;
    if (unreadCount === 0 || busyId) {
      showToast('Tất cả thông báo đều đã được đọc!', 'info');
      return;
    }
    setBusyId('all');
    try {
      await request('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      emitTopbarRefresh();
      showToast(`Đã đánh dấu đã đọc toàn bộ ${unreadCount} thông báo!`);
    } catch (err) {
      showToast(err.message || 'Không thể đánh dấu tất cả đã đọc', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const unreadCount = notifications.filter((n) => n.unread).length;
  const stockAlertsCount = notifications.filter((n) => n.type === 'warning').length;
  const orderAlertsCount = notifications.filter((n) => n.type === 'order').length;
  const shippingAlertsCount = notifications.filter((n) => n.type === 'danger').length;

  const tabs = useMemo(
    () => [
      { id: 'all', label: 'Tất cả', icon: '🔔', count: notifications.length },
      { id: 'unread', label: 'Chưa đọc', icon: '🔴', count: unreadCount },
      { id: 'order', label: 'Đơn hàng', icon: '🛍️', count: orderAlertsCount },
      { id: 'warning', label: 'Cảnh báo kho', icon: '⚠️', count: stockAlertsCount },
      { id: 'danger', label: 'Vận chuyển', icon: '🚚', count: shippingAlertsCount },
      {
        id: 'other',
        label: 'Đánh giá & Tài chính',
        icon: '⭐',
        count: notifications.filter((n) => !['order', 'warning', 'danger'].includes(n.type)).length,
      },
    ],
    [notifications, unreadCount, orderAlertsCount, stockAlertsCount, shippingAlertsCount]
  );

  const visibleList = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'unread' && !n.unread) return false;
      if (activeTab === 'order' && n.type !== 'order') return false;
      if (activeTab === 'warning' && n.type !== 'warning') return false;
      if (activeTab === 'danger' && n.type !== 'danger') return false;
      if (activeTab === 'other' && ['order', 'warning', 'danger'].includes(n.type)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!`${n.title || ''} ${n.detail || ''} ${n.time || ''}`.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  const handleExportCsv = () => {
    const headers = ['Tiêu đề', 'Nội dung chi tiết', 'Phân loại', 'Thời gian', 'Trạng thái đọc'];
    const rows = visibleList.map((n) => [
      n.title,
      n.detail,
      TYPE_VISUAL[n.type]?.label || n.type || 'Hệ thống',
      n.time || '',
      n.unread ? 'Chưa đọc' : 'Đã đọc',
    ]);
    exportCsvFile(`thong_bao_he_thong_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showToast('Đã xuất danh sách thông báo ra CSV!');
  };

  return (
    <div className="general-commerce-page" style={{ paddingBottom: '40px' }}>
      <PageHeader
        navInfo={navInfo}
        subtitle="Trung tâm theo dõi toàn bộ cảnh báo đơn hàng mới từ /store, tồn kho thấp, vận đơn trễ và đánh giá khách hàng — đồng bộ tức thì với chuông thông báo trên thanh Topbar."
      >
        <button
          type="button"
          className="secondary-button"
          disabled={isLoading}
          onClick={() => loadNotifications('Đã cập nhật danh sách thông báo mới nhất!')}
        >
          Làm mới
        </button>
        <button type="button" className="secondary-button" onClick={handleExportCsv}>
          Xuất CSV
        </button>
        <button
          type="button"
          className="primary-button"
          disabled={unreadCount === 0 || busyId === 'all'}
          onClick={handleMarkAllRead}
        >
          ✓ Đánh dấu tất cả đã đọc ({unreadCount})
        </button>
      </PageHeader>

      <QuickGuideBanner
        icon="🔔"
        title="Đồng bộ trực tiếp với Cửa hàng & Chuông thông báo Topbar:"
        steps={[
          'Mỗi đơn đặt mới, tin nhắn Chat hoặc đánh giá trên /store sẽ tự động đẩy thông báo về đây',
          'Bấm vào nút hành động bên phải mỗi tin để nhảy thẳng tới trang xử lý',
          'Đánh dấu đã đọc tại đây sẽ cập nhật ngay số đếm trên chuông Topbar',
        ]}
        rightSlot={
          <Link to="/commerce/settings-notifications" className="secondary-button" style={{ fontSize: '12.5px', padding: '6px 12px' }}>
            ⚙️ Cấu hình ngưỡng cảnh báo
          </Link>
        }
      />

      {/* 4 THẺ KPI */}
      <section className="order-summary-grid" style={{ marginBottom: '20px' }}>
        <div className="order-summary-card blue">
          <div>
            <small>Tổng thông báo</small>
            <strong>{notifications.length}</strong>
            <em>Lưu trữ theo thời gian thực</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Thông báo chưa đọc</small>
            <strong>{unreadCount}</strong>
            <em>{unreadCount > 0 ? 'Cần quản trị viên xem xét' : 'Bạn đã xử lý hết thông báo'}</em>
          </div>
        </div>
        <div className="order-summary-card green">
          <div>
            <small>Đơn hàng mới</small>
            <strong>{orderAlertsCount}</strong>
            <em>Đổ về từ Storefront & Đa kênh</em>
          </div>
        </div>
        <div className="order-summary-card purple">
          <div>
            <small>Cảnh báo kho & giao vận</small>
            <strong>{stockAlertsCount + shippingAlertsCount}</strong>
            <em>Theo dõi sát SLA vận hành</em>
          </div>
        </div>
      </section>

      {/* TAB LỌC 1 CHẠM + TÌM KIẾM */}
      <section
        className="glass-card"
        style={{
          padding: '14px 18px',
          marginBottom: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <FilterPillTabs tabs={tabs} activeId={activeTab} onSelect={setActiveTab} />

        <label className="c-search" style={{ maxWidth: '280px', width: '100%' }}>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
            </svg>
          </span>
          <input
            type="search"
            placeholder="Tìm mã đơn, sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Tìm thông báo"
          />
        </label>
      </section>

      {/* DANH SÁCH THẺ THÔNG BÁO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {visibleList.length === 0 ? (
          <section className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', color: '#756a59' }}>
            Không có thông báo nào trong mục này.
          </section>
        ) : (
          visibleList.map((n) => {
            const vis = TYPE_VISUAL[n.type] || TYPE_VISUAL.info;
            return (
              <article
                key={n.id}
                className="glass-card"
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  borderLeft: n.unread ? '4px solid #b87d14' : '4px solid transparent',
                  background: n.unread ? 'rgba(255, 250, 238, 0.96)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: '260px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: '#f3ead9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0,
                    }}
                  >
                    {vis.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '14.5px', color: '#272016' }}>{n.title}</strong>
                      <span className={`badge badge-${vis.badge}`} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}>
                        {vis.label}
                      </span>
                      {n.unread && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#9a3412',
                            background: '#ffedd5',
                            padding: '2px 8px',
                            borderRadius: '999px',
                          }}
                        >
                          ● MỚI
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '5px 0 4px 0', fontSize: '13.5px', color: '#524738', lineHeight: 1.5 }}>
                      {n.detail}
                    </p>
                    <small style={{ color: '#857968', fontSize: '12px' }}>🕒 {n.time || 'Vừa xong'}</small>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {n.unread && (
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={busyId === n.id}
                      style={{ padding: '6px 12px', fontSize: '12.5px' }}
                      onClick={() => handleMarkOneRead(n)}
                    >
                      ✓ Đánh dấu đã đọc
                    </button>
                  )}
                  <Link
                    to={vis.actionTo}
                    className="secondary-button"
                    style={{ padding: '6px 12px', fontSize: '12.5px', fontWeight: 700 }}
                  >
                    {vis.actionLabel}
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>

      <ToastStack toasts={toasts} />
    </div>
  );
}
