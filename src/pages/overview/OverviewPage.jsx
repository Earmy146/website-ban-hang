import React, { useState } from 'react';
import OverviewHeading from '../../components/overview/OverviewHeading';
import OverviewGmvCard from '../../components/overview/OverviewGmvCard';
import OverviewRevenueChart from '../../components/overview/OverviewRevenueChart';
import OverviewOperationsCard from '../../components/overview/OverviewOperationsCard';
import OverviewLiveShipments from '../../components/overview/OverviewLiveShipments';
import OverviewSalesChannels from '../../components/overview/OverviewSalesChannels';
import OverviewRecentOrders from '../../components/overview/OverviewRecentOrders';
import DialogModal from '../../components/ui/DialogModal';

export default function OverviewPage() {
  const [activeModalOrder, setActiveModalOrder] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  const handleViewDetail = (orderId) => {
    setActiveModalOrder(orderId);
  };

  return (
    <div className="overview-page" style={{ paddingBottom: '36px' }}>
      <OverviewHeading onQuickAction={showToast} />

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
          <OverviewGmvCard />
          <OverviewRevenueChart />
        </div>

        {/* Cột 2: Vận hành & Vận chuyển */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <OverviewOperationsCard />
          <OverviewLiveShipments />
        </div>

        {/* Cột 3: Kênh phân phối & Đơn hàng mới */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <OverviewSalesChannels />
          <OverviewRecentOrders onViewDetail={handleViewDetail} />
        </div>
      </div>

      {/* Modal: Xem chi tiết đơn hàng nhanh từ Overview */}
      <DialogModal
        isOpen={Boolean(activeModalOrder)}
        onClose={() => setActiveModalOrder(null)}
        title={activeModalOrder ? `Chi tiết nhanh đơn hàng #${activeModalOrder}` : ''}
      >
        {activeModalOrder && (
          <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#3c352a' }}>
            <p><strong>Mã đơn hàng:</strong> #{activeModalOrder}</p>
            <p><strong>Trạng thái:</strong> Đang đồng bộ cùng hệ thống kho vận chuyển</p>
            <p><strong>Ghi chú:</strong> Đơn hàng đã được xác nhận thanh toán trực tuyến và phân bổ tới kho xuất hàng gần nhất.</p>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
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
