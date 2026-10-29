import React, { useState, useMemo } from 'react';
import OrderHeading from '../../../components/commerce/orders/OrderHeading';
import OrderSummaryCards from '../../../components/commerce/orders/OrderSummaryCards';
import OrderToolbar from '../../../components/commerce/orders/OrderToolbar';
import OrderTable from '../../../components/commerce/orders/OrderTable';
import DialogModal from '../../../components/ui/DialogModal';
import { initialOrders } from '../../../data/mockOrders';

export default function OrdersPage() {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Bộ lọc
  const [channelFilter, setChannelFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [cancelingOrder, setCancelingOrder] = useState(null);

  // Form thêm đơn hàng mới
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerEmail: '',
    channel: 'Cửa hàng trực tuyến',
    itemsDesc: '',
    itemsCount: 1,
    total: '',
    paymentStatus: 'Paid',
    fulfillmentStatus: 'Processing',
    shippingMethod: 'Giao hàng tiêu chuẩn',
    address: 'Quận 1, TP. Hồ Chí Minh'
  });

  // Toasts
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

  // Lọc realtime
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (channelFilter !== 'all' && o.channel !== channelFilter) return false;
      if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter) return false;
      if (fulfillmentFilter !== 'all' && o.fulfillmentStatus !== fulfillmentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = o.id.toLowerCase().includes(q);
        const matchCustomer = o.customer.name.toLowerCase().includes(q) || o.customer.email.toLowerCase().includes(q);
        const matchDesc = o.itemsDesc.toLowerCase().includes(q);
        if (!matchId && !matchCustomer && !matchDesc) return false;
      }
      return true;
    });
  }, [orders, channelFilter, paymentFilter, fulfillmentFilter, searchQuery]);

  // Checkbox handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Batch actions
  const handleBulkPrint = () => {
    showToast(`Đang in nhãn vận đơn cho ${selectedIds.length} đơn hàng đã chọn...`);
    setSelectedIds([]);
  };

  const handleBulkCancel = () => {
    if (window.confirm(`Bạn có chắc muốn hủy ${selectedIds.length} đơn hàng đã chọn không?`)) {
      setOrders(prev => prev.filter(o => !selectedIds.includes(o.id)));
      showToast(`Đã hủy thành công ${selectedIds.length} đơn hàng.`);
      setSelectedIds([]);
    }
  };

  // Xuất file CSV
  const handleExport = () => {
    const headers = ['Mã đơn', 'Khách hàng', 'Email', 'Kênh bán', 'Sản phẩm', 'Tổng tiền ($)', 'Thanh toán', 'Giao hàng', 'Địa chỉ', 'Ngày tạo'];
    const rows = filteredOrders.map(o => [
      `#${o.id}`,
      `"${o.customer.name}"`,
      `"${o.customer.email}"`,
      `"${o.channel}"`,
      `"${o.itemsDesc}"`,
      o.total.toFixed(2),
      o.paymentStatus,
      o.fulfillmentStatus,
      `"${o.address}"`,
      `"${o.date}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danh_sach_don_hang_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file danh sách đơn hàng thành công!');
  };

  // Tạo đơn hàng mới
  const handleCreateOrder = (e) => {
    e.preventDefault();
    if (!newOrder.customerName.trim() || !newOrder.total) {
      showToast('Vui lòng nhập đầy đủ tên khách hàng và tổng tiền!', 'error');
      return;
    }

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const created = {
      id: `SF${randomNum}`,
      customer: {
        name: newOrder.customerName.trim(),
        email: newOrder.customerEmail.trim() || `${newOrder.customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        avatar: newOrder.customerName.substring(0, 2).toUpperCase()
      },
      date: 'Hôm nay',
      channel: newOrder.channel,
      itemsCount: Number(newOrder.itemsCount) || 1,
      itemsDesc: newOrder.itemsDesc.trim() || 'Đơn hàng tạo thủ công',
      total: parseFloat(newOrder.total) || 0,
      paymentStatus: newOrder.paymentStatus,
      fulfillmentStatus: newOrder.fulfillmentStatus,
      shippingMethod: newOrder.shippingMethod,
      address: newOrder.address
    };

    setOrders([created, ...orders]);
    setIsAddModalOpen(false);
    setNewOrder({
      customerName: '',
      customerEmail: '',
      channel: 'Cửa hàng trực tuyến',
      itemsDesc: '',
      itemsCount: 1,
      total: '',
      paymentStatus: 'Paid',
      fulfillmentStatus: 'Processing',
      shippingMethod: 'Giao hàng tiêu chuẩn',
      address: 'Quận 1, TP. Hồ Chí Minh'
    });
    showToast(`Đã tạo thành công đơn hàng #${created.id}!`);
  };

  // Lưu chỉnh sửa trạng thái
  const handleSaveOrderUpdate = (e) => {
    e.preventDefault();
    if (!editingOrder) return;
    setOrders(prev => prev.map(o => o.id === editingOrder.id ? editingOrder : o));
    setEditingOrder(null);
    showToast(`Đã cập nhật trạng thái đơn hàng #${editingOrder.id}!`);
  };

  // Hủy đơn hàng
  const handleConfirmCancel = () => {
    if (!cancelingOrder) return;
    setOrders(prev => prev.filter(o => o.id !== cancelingOrder.id));
    setCancelingOrder(null);
    showToast(`Đã hủy đơn hàng #${cancelingOrder.id}!`);
  };

  const handlePrintLabel = (order) => {
    showToast(`Đang in nhãn vận đơn cho đơn #${order.id}...`);
  };

  return (
    <div className="orders-page" style={{ paddingBottom: '32px' }}>
      <OrderHeading 
        onExport={handleExport}
        onAddOrder={() => setIsAddModalOpen(true)}
      />

      <OrderSummaryCards orders={orders} />

      <OrderToolbar 
        channelFilter={channelFilter}
        onChannelChange={setChannelFilter}
        paymentFilter={paymentFilter}
        onPaymentChange={setPaymentFilter}
        fulfillmentFilter={fulfillmentFilter}
        onFulfillmentChange={setFulfillmentFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <OrderTable 
        orders={filteredOrders}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onBulkPrint={handleBulkPrint}
        onBulkCancel={handleBulkCancel}
        onClearSelection={handleClearSelection}
        onViewOrder={setViewingOrder}
        onUpdateStatus={setEditingOrder}
        onPrintLabel={handlePrintLabel}
        onCancelOrder={setCancelingOrder}
      />

      {/* Modal: Tạo đơn hàng mới */}
      <DialogModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Tạo đơn hàng mới"
        wide={true}
      >
        <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Tên khách hàng *
              </label>
              <input 
                type="text" 
                required
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                placeholder="VD: Nguyễn Văn A..."
                value={newOrder.customerName}
                onChange={e => setNewOrder({ ...newOrder, customerName: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Email khách hàng
              </label>
              <input 
                type="email" 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                placeholder="VD: a.nguyen@example.com"
                value={newOrder.customerEmail}
                onChange={e => setNewOrder({ ...newOrder, customerEmail: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Kênh bán hàng
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={newOrder.channel}
                onChange={e => setNewOrder({ ...newOrder, channel: e.target.value })}
              >
                <option value="Cửa hàng trực tuyến">Cửa hàng trực tuyến</option>
                <option value="Ứng dụng di động">Ứng dụng di động</option>
                <option value="Sàn thương mại">Sàn thương mại</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Tổng giá trị ($) *
              </label>
              <input 
                type="number" 
                step="0.01"
                required
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                placeholder="VD: 89.50"
                value={newOrder.total}
                onChange={e => setNewOrder({ ...newOrder, total: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Số lượng sản phẩm
              </label>
              <input 
                type="number" 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={newOrder.itemsCount}
                onChange={e => setNewOrder({ ...newOrder, itemsCount: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Mô tả sản phẩm trong đơn
            </label>
            <input 
              type="text" 
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              placeholder="VD: Áo polo cao cấp + Ví da nam"
              value={newOrder.itemsDesc}
              onChange={e => setNewOrder({ ...newOrder, itemsDesc: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Trạng thái thanh toán
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={newOrder.paymentStatus}
                onChange={e => setNewOrder({ ...newOrder, paymentStatus: e.target.value })}
              >
                <option value="Paid">Đã thanh toán</option>
                <option value="Pending">Chờ thanh toán</option>
                <option value="Refunded">Đã hoàn tiền</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Trạng thái giao hàng
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={newOrder.fulfillmentStatus}
                onChange={e => setNewOrder({ ...newOrder, fulfillmentStatus: e.target.value })}
              >
                <option value="Processing">Đang xử lý</option>
                <option value="Packed">Đã đóng gói</option>
                <option value="Shipped">Đang giao hàng</option>
                <option value="Delivered">Đã giao thành công</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Địa chỉ nhận hàng
            </label>
            <input 
              type="text" 
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newOrder.address}
              onChange={e => setNewOrder({ ...newOrder, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
            <button 
              type="button" 
              className="secondary-button"
              onClick={() => setIsAddModalOpen(false)}
            >
              Hủy
            </button>
            <button type="submit" className="primary-button">
              Lưu đơn hàng
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Xem chi tiết đơn hàng */}
      <DialogModal 
        isOpen={Boolean(viewingOrder)} 
        onClose={() => setViewingOrder(null)}
        title={viewingOrder ? `Chi tiết đơn hàng #${viewingOrder.id}` : ''}
        wide={true}
      >
        {viewingOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '14px', color: '#3c352a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', background: '#f5efe4', borderRadius: '12px' }}>
              <div>
                <strong>Khách hàng: </strong> {viewingOrder.customer.name} ({viewingOrder.customer.email})
              </div>
              <div>
                <strong>Kênh bán: </strong> {viewingOrder.channel}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <p><strong>Ngày đặt hàng:</strong> {viewingOrder.date}</p>
                <p><strong>Tổng thanh toán:</strong> <span style={{ fontSize: '16px', fontWeight: '700', color: '#2a6946' }}>${viewingOrder.total.toFixed(2)}</span></p>
                <p><strong>Phương thức vận chuyển:</strong> {viewingOrder.shippingMethod}</p>
              </div>
              <div>
                <p><strong>Trạng thái thanh toán:</strong> {viewingOrder.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}</p>
                <p><strong>Trạng thái giao hàng:</strong> {viewingOrder.fulfillmentStatus}</p>
                <p><strong>Địa chỉ giao hàng:</strong> {viewingOrder.address}</p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2d9cd', paddingTop: '14px' }}>
              <strong>Sản phẩm trong đơn:</strong>
              <div style={{ marginTop: '8px', padding: '12px', background: '#faf6ee', borderRadius: '8px' }}>
                <p>{viewingOrder.itemsDesc}</p>
                <small style={{ color: '#776c5b' }}>Số lượng sản phẩm: {viewingOrder.itemsCount}</small>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                className="secondary-button"
                onClick={() => setViewingOrder(null)}
              >
                Đóng
              </button>
              <button 
                type="button" 
                className="primary-button"
                onClick={() => {
                  setEditingOrder(viewingOrder);
                  setViewingOrder(null);
                }}
              >
                Cập nhật trạng thái
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* Modal: Cập nhật trạng thái */}
      <DialogModal 
        isOpen={Boolean(editingOrder)} 
        onClose={() => setEditingOrder(null)}
        title={editingOrder ? `Cập nhật trạng thái đơn #${editingOrder.id}` : ''}
      >
        {editingOrder && (
          <form onSubmit={handleSaveOrderUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Trạng thái thanh toán
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingOrder.paymentStatus}
                onChange={e => setEditingOrder({ ...editingOrder, paymentStatus: e.target.value })}
              >
                <option value="Paid">Đã thanh toán</option>
                <option value="Pending">Chờ thanh toán</option>
                <option value="Refunded">Đã hoàn tiền</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Trạng thái giao hàng
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={editingOrder.fulfillmentStatus}
                onChange={e => setEditingOrder({ ...editingOrder, fulfillmentStatus: e.target.value })}
              >
                <option value="Processing">Đang xử lý</option>
                <option value="Packed">Đã đóng gói</option>
                <option value="Shipped">Đang giao hàng</option>
                <option value="Delivered">Đã giao thành công</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                className="secondary-button"
                onClick={() => setEditingOrder(null)}
              >
                Hủy
              </button>
              <button type="submit" className="primary-button">
                Lưu thay đổi
              </button>
            </div>
          </form>
        )}
      </DialogModal>

      {/* Modal: Xác nhận hủy đơn */}
      <DialogModal 
        isOpen={Boolean(cancelingOrder)} 
        onClose={() => setCancelingOrder(null)}
        title="Xác nhận hủy đơn hàng"
      >
        {cancelingOrder && (
          <div>
            <p style={{ marginBottom: '16px', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn hủy đơn hàng <strong>#{cancelingOrder.id}</strong> của khách hàng <strong>{cancelingOrder.customer.name}</strong> không? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                className="secondary-button"
                onClick={() => setCancelingOrder(null)}
              >
                Không, giữ lại
              </button>
              <button 
                type="button" 
                className="primary-button"
                style={{ background: '#b23b3b', borderColor: '#b23b3b', color: '#fff' }}
                onClick={handleConfirmCancel}
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* Toasts thông báo góc phải */}
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
