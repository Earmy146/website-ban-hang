import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import OverviewHeading from '../../components/overview/OverviewHeading';
import OverviewGmvCard from '../../components/overview/OverviewGmvCard';
import OverviewRevenueChart from '../../components/overview/OverviewRevenueChart';
import OverviewOperationsCard from '../../components/overview/OverviewOperationsCard';
import OverviewLiveShipments from '../../components/overview/OverviewLiveShipments';
import OverviewSalesChannels from '../../components/overview/OverviewSalesChannels';
import OverviewRecentOrders from '../../components/overview/OverviewRecentOrders';
import DialogModal from '../../components/ui/DialogModal';
import api, { getGlobalPeriod, PERIOD_CHANGE_EVENT, TOPBAR_REFRESH_EVENT } from '../../services/api';

export default function OverviewPage() {
  const [period, setPeriod] = useState(getGlobalPeriod());
  const [chartRange, setChartRange] = useState('30');
  const [overviewData, setOverviewData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeModalOrder, setActiveModalOrder] = useState(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [activeModalShipment, setActiveModalShipment] = useState(null);
  const [isLoadingShipment, setIsLoadingShipment] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const loadOverview = useCallback(async (showSuccessToast = false) => {
    setIsRefreshing(true);
    try {
      const data = await api.getOverview({ period, chartRange });
      if (data) {
        setOverviewData(data);
      }
      if (showSuccessToast) {
        showToast('Tải lại dữ liệu chỉ số thành công');
      }
    } catch (err) {
      if (showSuccessToast) {
        showToast(err.message || 'Không thể tải dữ liệu tổng quan', 'error');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [period, chartRange, showToast]);

  useEffect(() => {
    loadOverview(false);
  }, [loadOverview]);

  useEffect(() => {
    const handlePeriodChange = (e) => {
      if (e?.detail?.period) {
        setPeriod(String(e.detail.period));
      }
    };
    const handleRefresh = () => {
      loadOverview(false);
    };
    window.addEventListener(PERIOD_CHANGE_EVENT, handlePeriodChange);
    window.addEventListener(TOPBAR_REFRESH_EVENT, handleRefresh);
    return () => {
      window.removeEventListener(PERIOD_CHANGE_EVENT, handlePeriodChange);
      window.removeEventListener(TOPBAR_REFRESH_EVENT, handleRefresh);
    };
  }, [loadOverview]);

  const handleViewDetail = async (orderItem) => {
    const orderId = typeof orderItem === 'object' ? orderItem.id : orderItem;
    setActiveModalOrder(typeof orderItem === 'object' ? orderItem : { id: orderId });
    setIsLoadingOrder(true);
    try {
      const detail = await api.getOrder(String(orderId).replace(/^#/, ''));
      if (detail) {
        setActiveModalOrder(detail);
      }
    } catch {
      // Giữ thông tin đơn hàng sẵn có từ bảng nếu không lấy thêm được
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const handleViewShipment = async (shipmentItem) => {
    setActiveModalShipment(shipmentItem);
    setIsLoadingShipment(true);
    try {
      const list = await api.getShipments();
      if (Array.isArray(list)) {
        const cleanId = String(shipmentItem.id || '').replace(/^#/, '').toUpperCase();
        const found = list.find(
          item =>
            String(item.id || '').replace(/^#/, '').toUpperCase() === cleanId ||
            String(item.orderId || '').replace(/^#/, '').toUpperCase() === cleanId
        );
        if (found) {
          setActiveModalShipment({ ...shipmentItem, ...found });
        }
      }
    } catch {
      // Giữ thông tin kiện hàng sẵn có
    } finally {
      setIsLoadingShipment(false);
    }
  };

  const handleExportReport = () => {
    const gmv = overviewData?.gmvCard || { gmv: '$68,420', delta: '+12%', conversionRate: '3.4%', aov: '$54.80' };
    const channels = overviewData?.salesChannels || [];
    const recentOrders = overviewData?.recentOrders || [];

    const lines = [
      'BÁO CÁO TỔNG HỢP ĐIỀU HÀNH CỬA HÀNG VEYLIX',
      `Kỳ thống kê,${period} ngày qua`,
      `Tổng doanh số (GMV),"${gmv.gmv}"`,
      `Tăng trưởng,"${gmv.delta}"`,
      `Tỷ lệ chuyển đổi,"${gmv.conversionRate}"`,
      `Giá trị đơn trung bình (AOV),"${gmv.aov}"`,
      '',
      'TỶ TRỌNG KÊNH PHÂN PHỐI',
      'Kênh bán,Tỷ trọng (%),Doanh thu',
      ...channels.map(ch => `"${ch.name}",${ch.percent},"${ch.revenue}"`),
      '',
      'ĐƠN HÀNG MỚI NHẤT',
      'Mã đơn,Khách hàng,Sản phẩm,Tổng tiền,Thanh toán,Giao hàng',
      ...recentOrders.map(o => {
        const custName = typeof o.customer === 'object' ? o.customer?.name : o.customer;
        const items = o.itemsDesc || o.items || '';
        const amount = o.total !== undefined ? `$${Number(o.total).toFixed(2)}` : o.amount;
        const pay = o.paymentStatus || o.status || '';
        const ful = o.fulfillmentStatus || '';
        return `"#${o.id}","${custName || ''}","${items}","${amount || ''}","${pay}","${ful}"`;
      }),
    ];

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao_cao_tong_quan_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất báo cáo tổng hợp thành công!');
  };

  const getPaymentLabel = (status) => {
    if (status === 'Paid') return 'Đã thanh toán';
    if (status === 'Pending') return 'Chờ thanh toán';
    if (status === 'Refunded') return 'Đã hoàn tiền';
    return status || 'Đã xác nhận';
  };

  const getFulfillmentLabel = (status) => {
    if (status === 'Delivered') return 'Đã giao thành công';
    if (status === 'Shipped') return 'Đang giao hàng';
    if (status === 'Packed') return 'Đã đóng gói';
    if (status === 'Processing') return 'Đang xử lý';
    if (status === 'Cancelled') return 'Đã hủy';
    return status || 'Đang xử lý';
  };

  return (
    <div className="overview-page" style={{ paddingBottom: '36px' }}>
      <OverviewHeading 
        onRefresh={() => loadOverview(true)}
        onExport={handleExportReport}
        isRefreshing={isRefreshing}
      />

      {/* Thanh Thao tác nhanh đầu trang trực quan, dễ hiểu */}
      <section
        className="glass-card"
        aria-label="Thao tác nhanh"
        style={{
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>⚡</span>
          <div>
            <strong style={{ fontSize: '13.5px', color: '#2b2316', display: 'block' }}>Thao tác nhanh hàng ngày</strong>
            <small style={{ color: '#776c5b', fontSize: '12px' }}>Tạo đơn, thêm mặt hàng mới, bổ sung tồn kho hoặc mở cửa hàng mua sắm</small>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Link to="/commerce/orders?action=new" className="primary-button" style={{ textDecoration: 'none', padding: '7px 14px', fontSize: '13px' }}>
            + Tạo đơn hàng
          </Link>
          <Link to="/commerce/products?action=new" className="secondary-button" style={{ textDecoration: 'none', padding: '7px 14px', fontSize: '13px' }}>
            + Thêm sản phẩm
          </Link>
          <Link to="/commerce/stock?action=receive" className="secondary-button" style={{ textDecoration: 'none', padding: '7px 14px', fontSize: '13px' }}>
            📦 Nhập hàng kho
          </Link>
          <Link to="/commerce/ai-studio" className="secondary-button" style={{ textDecoration: 'none', padding: '7px 14px', fontSize: '13px' }}>
            ✨ AI Studio
          </Link>
          <Link
            to="/store"
            className="secondary-button"
            style={{
              textDecoration: 'none',
              padding: '7px 14px',
              fontSize: '13px',
              background: '#276840',
              color: '#fff',
              borderColor: '#276840'
            }}
          >
            🛍️ Mở Cửa hàng khách mua (/store)
          </Link>
        </div>
      </section>

      {/* Grid điều hành 3 cột mượt mà, độc lập */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
          alignItems: 'start'
        }}
      >
        {/* Cột 1: Chỉ số doanh thu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <OverviewGmvCard data={overviewData?.gmvCard} />
          <OverviewRevenueChart 
            data={overviewData?.revenueChart}
            activeRange={chartRange}
            onRangeChange={setChartRange}
          />
        </div>

        {/* Cột 2: Vận hành & Vận chuyển */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <OverviewOperationsCard data={overviewData?.operations} />
          <OverviewLiveShipments
            shipments={overviewData?.liveShipments}
            onSelectShipment={handleViewShipment}
          />
        </div>

        {/* Cột 3: Kênh phân phối & Đơn hàng mới */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <OverviewSalesChannels channels={overviewData?.salesChannels} />
          <OverviewRecentOrders 
            orders={overviewData?.recentOrders}
            onViewDetail={handleViewDetail}
          />
        </div>
      </div>

      {/* Modal: Xem chi tiết đơn hàng nhanh từ Overview */}
      <DialogModal
        isOpen={Boolean(activeModalOrder)}
        onClose={() => setActiveModalOrder(null)}
        title={activeModalOrder ? `Chi tiết nhanh đơn hàng #${String(activeModalOrder.id).replace(/^#/, '')}` : ''}
      >
        {activeModalOrder && (
          <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#3c352a', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isLoadingOrder ? (
              <p style={{ margin: 0, color: '#776c5b' }}>Đang tải chi tiết đơn hàng...</p>
            ) : null}

            <div style={{ padding: '12px 16px', background: '#f5efe4', borderRadius: '10px' }}>
              <p style={{ margin: '0 0 4px 0' }}>
                <strong>Khách hàng:</strong>{' '}
                {typeof activeModalOrder.customer === 'object'
                  ? `${activeModalOrder.customer?.name || ''}${activeModalOrder.customer?.email ? ` (${activeModalOrder.customer.email})` : ''}`
                  : activeModalOrder.customer || 'Khách lẻ'}
              </p>
              {activeModalOrder.channel && (
                <p style={{ margin: '0 0 4px 0' }}><strong>Kênh bán:</strong> {activeModalOrder.channel}</p>
              )}
              {activeModalOrder.date && (
                <p style={{ margin: 0 }}><strong>Thời gian đặt:</strong> {activeModalOrder.date}</p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <p style={{ margin: '0 0 6px 0' }}>
                  <strong>Tổng tiền:</strong>{' '}
                  <strong style={{ color: '#2a6946' }}>
                    {activeModalOrder.total !== undefined
                      ? `$${Number(activeModalOrder.total).toFixed(2)}`
                      : activeModalOrder.amount || '$0.00'}
                  </strong>
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Thanh toán:</strong>{' '}
                  {activeModalOrder.paymentStatus ? getPaymentLabel(activeModalOrder.paymentStatus) : (activeModalOrder.status || 'Đã thanh toán')}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 6px 0' }}>
                  <strong>Giao nhận:</strong>{' '}
                  {activeModalOrder.fulfillmentStatus ? getFulfillmentLabel(activeModalOrder.fulfillmentStatus) : 'Đang xử lý'}
                </p>
                {activeModalOrder.shippingMethod && (
                  <p style={{ margin: 0 }}><strong>Vận chuyển:</strong> {activeModalOrder.shippingMethod}</p>
                )}
              </div>
            </div>

            {(activeModalOrder.itemsDesc || activeModalOrder.items) && (
              <div style={{ padding: '10px 14px', background: '#faf6ee', borderRadius: '8px' }}>
                <strong>Sản phẩm:</strong> {activeModalOrder.itemsDesc || activeModalOrder.items}
                {activeModalOrder.itemsCount ? (
                  <small style={{ display: 'block', color: '#776c5b' }}>Số lượng: {activeModalOrder.itemsCount} sản phẩm</small>
                ) : null}
              </div>
            )}

            {activeModalOrder.address && (
              <p style={{ margin: 0 }}><strong>Địa chỉ nhận hàng:</strong> {activeModalOrder.address}</p>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <Link
                to="/commerce/orders"
                className="secondary-button"
                style={{ textDecoration: 'none' }}
                onClick={() => setActiveModalOrder(null)}
              >
                Mở trang Đơn hàng
              </Link>
              <button 
                type="button" 
                className="primary-button"
                onClick={() => setActiveModalOrder(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* Modal: Xem chi tiết vận đơn trực tiếp */}
      <DialogModal
        isOpen={Boolean(activeModalShipment)}
        onClose={() => setActiveModalShipment(null)}
        title={activeModalShipment ? `Chi tiết vận đơn #${String(activeModalShipment.id).replace(/^#/, '')}` : ''}
      >
        {activeModalShipment && (
          <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#3c352a', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isLoadingShipment ? (
              <small style={{ color: '#776c5b' }}>Đang đồng bộ trạng thái vận đơn mới nhất...</small>
            ) : null}

            <div style={{ padding: '12px 16px', background: '#f5efe4', borderRadius: '10px' }}>
              <p style={{ margin: '0 0 4px 0' }}>
                <strong>Mã vận đơn:</strong>{' '}
                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#885600' }}>
                  #{String(activeModalShipment.id).replace(/^#/, '')}
                </span>
              </p>
              {activeModalShipment.orderId && (
                <p style={{ margin: '0 0 4px 0' }}>
                  <strong>Đơn hàng gốc:</strong> #{String(activeModalShipment.orderId).replace(/^#/, '')}
                </p>
              )}
              <p style={{ margin: '0 0 4px 0' }}>
                <strong>Đơn vị vận chuyển:</strong> {activeModalShipment.carrier || 'Giao Hàng Tiết Kiệm (GHTK)'}
              </p>
              {activeModalShipment.customer && (
                <p style={{ margin: 0 }}>
                  <strong>Người nhận:</strong> {activeModalShipment.customer}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '10px 12px', background: '#faf6ee', borderRadius: '8px' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Điểm đến giao nhận</small>
                <strong>{activeModalShipment.destination || activeModalShipment.dest || 'Đang cập nhật'}</strong>
              </div>
              <div style={{ padding: '10px 12px', background: '#faf6ee', borderRadius: '8px' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Dự kiến giao (ETA)</small>
                <strong>{activeModalShipment.eta || activeModalShipment.time || 'Trong ngày'}</strong>
              </div>
            </div>

            <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <strong style={{ color: '#10b981' }}>● {activeModalShipment.statusText || activeModalShipment.status}</strong>
                <small style={{ display: 'block', color: '#685d4f' }}>
                  Cập nhật gần nhất: {activeModalShipment.time || activeModalShipment.createdAt || 'Vừa xong'}
                </small>
              </div>
              <div>
                <strong>● Đã bàn giao cho bưu cục vận chuyển</strong>
                <small style={{ display: 'block', color: '#685d4f' }}>Đã đối soát trọng lượng và in nhãn mã vạch</small>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <Link
                to="/commerce/fulfillment"
                className="secondary-button"
                style={{ textDecoration: 'none' }}
                onClick={() => setActiveModalShipment(null)}
              >
                Quản lý Vận chuyển &rarr;
              </Link>
              <button type="button" className="primary-button" onClick={() => setActiveModalShipment(null)}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* Toasts thông báo */}
      <div className="toasts-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(t => (
          <div 
            key={t.id} 
            style={{
              background: t.type === 'error' ? '#8a2323' : '#27342b',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              fontSize: '13px',
              fontWeight: '500',
              animation: 'dialog-appear 0.2s ease-out'
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
