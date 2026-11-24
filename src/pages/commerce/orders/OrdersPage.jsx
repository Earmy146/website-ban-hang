import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import OrderHeading from '../../../components/commerce/orders/OrderHeading';
import OrderSummaryCards from '../../../components/commerce/orders/OrderSummaryCards';
import OrderToolbar from '../../../components/commerce/orders/OrderToolbar';
import OrderTable from '../../../components/commerce/orders/OrderTable';
import DialogModal from '../../../components/ui/DialogModal';
import { initialOrders } from '../../../data/mockOrders';
import api from '../../../services/api';

function BarcodeSvg({ code = 'SF83291' }) {
  const chars = String(code).split('');
  const bars = [];
  let x = 8;
  chars.forEach((ch, idx) => {
    const val = ch.charCodeAt(0) + idx * 7;
    const w1 = (val % 3) + 1.5;
    const w2 = ((val >> 2) % 2) + 1;
    const gap1 = ((val >> 1) % 2) + 1.5;
    const gap2 = ((val >> 3) % 2) + 2;
    bars.push({ x, w: w1 });
    x += w1 + gap1;
    bars.push({ x, w: w2 });
    x += w2 + gap2;
  });
  bars.push({ x, w: 2.5 });
  const totalWidth = Math.max(160, x + 10);

  return (
    <svg viewBox={`0 0 ${totalWidth} 44`} style={{ width: '180px', height: '42px', display: 'block' }} aria-label={`Mã vạch ${code}`}>
      <rect x="0" y="0" width={totalWidth} height="44" fill="#fff" />
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y="4" width={b.w} height="28" fill="#1e1b18" />
      ))}
      <text x={totalWidth / 2} y="41" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#30281b">
        *{code}*
      </text>
    </svg>
  );
}

export default function OrdersPage() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState(initialOrders);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Bộ lọc (đồng bộ từ URL query params khi điều hướng từ Overview)
  const [channelFilter, setChannelFilter] = useState(() => searchParams.get('channel') || 'all');
  const [paymentFilter, setPaymentFilter] = useState(() => searchParams.get('payment') || 'all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState(() => searchParams.get('fulfillment') || 'all');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(() => searchParams.get('action') === 'new');

  useEffect(() => {
    const ful = searchParams.get('fulfillment');
    const pay = searchParams.get('payment');
    const ch = searchParams.get('channel');
    const q = searchParams.get('search');
    if (ful) setFulfillmentFilter(ful);
    if (pay) setPaymentFilter(pay);
    if (ch) setChannelFilter(ch);
    if (q !== null) setSearchQuery(q);
    if (searchParams.get('action') === 'new') setIsAddModalOpen(true);
  }, [searchParams]);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [cancelingOrder, setCancelingOrder] = useState(null);
  const [isBulkCancelModalOpen, setIsBulkCancelModalOpen] = useState(false);
  const [printingOrders, setPrintingOrders] = useState([]);

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
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.getOrders();
      if (Array.isArray(data)) {
        setOrders(data);
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách đơn hàng', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Lọc realtime
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (channelFilter !== 'all' && o.channel !== channelFilter) return false;
      if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter) return false;
      if (fulfillmentFilter !== 'all' && o.fulfillmentStatus !== fulfillmentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = (o.id || '').toLowerCase().includes(q);
        const custName = o.customer?.name || '';
        const custEmail = o.customer?.email || '';
        const matchCustomer = custName.toLowerCase().includes(q) || custEmail.toLowerCase().includes(q);
        const matchDesc = (o.itemsDesc || '').toLowerCase().includes(q);
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

  const handleViewOrder = async (order) => {
    setViewingOrder(order);
    try {
      const fresh = await api.getOrder(order.id);
      if (fresh && fresh.id) {
        setViewingOrder(fresh);
      }
    } catch {}
  };

  // Mở xem trước nhãn vận đơn hàng loạt
  const handleBulkPrint = () => {
    const selected = orders.filter(o => selectedIds.includes(o.id));
    if (selected.length === 0) return;
    setPrintingOrders(selected);
  };

  // Mở DialogModal xác nhận hủy đơn hàng loạt
  const handleBulkCancel = () => {
    if (selectedIds.length === 0) return;
    setIsBulkCancelModalOpen(true);
  };

  const handleConfirmBulkCancel = async () => {
    if (selectedIds.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const count = selectedIds.length;
      await api.bulkCancelOrders(selectedIds);
      await loadOrders();
      setSelectedIds([]);
      setIsBulkCancelModalOpen(false);
      showToast(`Đã hủy thành công ${count} đơn hàng.`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi hủy đơn hàng loạt', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xuất file CSV
  const handleExport = () => {
    const headers = ['Mã đơn', 'Khách hàng', 'Email', 'Kênh bán', 'Sản phẩm', 'Tổng tiền ($)', 'Thanh toán', 'Giao hàng', 'Địa chỉ', 'Ngày tạo'];
    const rows = filteredOrders.map(o => [
      `#${o.id}`,
      `"${o.customer?.name || ''}"`,
      `"${o.customer?.email || ''}"`,
      `"${o.channel}"`,
      `"${o.itemsDesc}"`,
      Number(o.total || 0).toFixed(2),
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
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!newOrder.customerName.trim() || !newOrder.total) {
      showToast('Vui lòng nhập đầy đủ tên khách hàng và tổng tiền!', 'error');
      return;
    }

    const payload = {
      customerName: newOrder.customerName.trim(),
      customerEmail: newOrder.customerEmail.trim(),
      channel: newOrder.channel,
      itemsDesc: newOrder.itemsDesc.trim() || 'Đơn hàng tạo thủ công',
      itemsCount: Number(newOrder.itemsCount) || 1,
      total: parseFloat(newOrder.total) || 0,
      paymentStatus: newOrder.paymentStatus,
      fulfillmentStatus: newOrder.fulfillmentStatus,
      shippingMethod: newOrder.shippingMethod,
      address: newOrder.address
    };

    setIsSubmitting(true);
    try {
      const created = await api.createOrder(payload);
      if (created && created.id) {
        setOrders(prev => [created, ...prev]);
      } else {
        await loadOrders();
      }
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
      showToast(`Đã tạo thành công đơn hàng #${created?.id || ''}!`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi tạo đơn hàng', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lưu chỉnh sửa trạng thái
  const handleSaveOrderUpdate = async (e) => {
    e.preventDefault();
    if (!editingOrder || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await api.updateOrderStatus(editingOrder.id, {
        paymentStatus: editingOrder.paymentStatus,
        fulfillmentStatus: editingOrder.fulfillmentStatus
      });
      if (updated && updated.id) {
        setOrders(prev => prev.map(o => (o.id === editingOrder.id ? updated : o)));
      } else {
        await loadOrders();
      }
      const orderCode = editingOrder.id;
      setEditingOrder(null);
      showToast(`Đã cập nhật trạng thái đơn hàng #${orderCode}!`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật trạng thái đơn hàng', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hủy đơn hàng lẻ
  const handleConfirmCancel = async () => {
    if (!cancelingOrder || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const targetId = cancelingOrder.id;
      await api.deleteOrder(targetId);
      await loadOrders();
      setSelectedIds(prev => prev.filter(id => id !== targetId));
      setCancelingOrder(null);
      showToast(`Đã hủy đơn hàng #${targetId}!`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi hủy đơn hàng', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintLabel = (order) => {
    setPrintingOrders([order]);
  };

  const handleExecutePrint = () => {
    const count = printingOrders.length;
    try {
      window.print();
    } catch {}
    setPrintingOrders([]);
    setSelectedIds([]);
    showToast(`Đã gửi lệnh in ${count} phiếu gửi hàng thành công!`);
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

      {(channelFilter !== 'all' || paymentFilter !== 'all' || fulfillmentFilter !== 'all' || searchQuery.trim()) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            marginTop: '10px',
            padding: '8px 14px',
            background: '#faf5ea',
            border: '1px solid #e5d8c3',
            borderRadius: '10px',
            fontSize: '13px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <strong>Đang lọc ({filteredOrders.length} đơn):</strong>
            {channelFilter !== 'all' && <span className="badge badge-indigo">Kênh: {channelFilter}</span>}
            {paymentFilter !== 'all' && <span className="badge badge-green">Thanh toán: {paymentFilter}</span>}
            {fulfillmentFilter !== 'all' && <span className="badge badge-amber">Giao hàng: {fulfillmentFilter}</span>}
            {searchQuery.trim() && <span className="badge badge-blue">Từ khóa: "{searchQuery}"</span>}
          </div>
          <button
            type="button"
            className="secondary-button"
            style={{ padding: '3px 10px', fontSize: '12px' }}
            onClick={() => {
              setChannelFilter('all');
              setPaymentFilter('all');
              setFulfillmentFilter('all');
              setSearchQuery('');
            }}
          >
            ✕ Xóa bộ lọc
          </button>
        </div>
      )}

      <OrderTable 
        orders={filteredOrders}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onBulkPrint={handleBulkPrint}
        onBulkCancel={handleBulkCancel}
        onClearSelection={handleClearSelection}
        onViewOrder={handleViewOrder}
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
                min="0"
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
                min="1"
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
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu đơn hàng'}
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
                <strong>Khách hàng: </strong> {viewingOrder.customer?.name} ({viewingOrder.customer?.email})
              </div>
              <div>
                <strong>Kênh bán: </strong> {viewingOrder.channel}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <p><strong>Ngày đặt hàng:</strong> {viewingOrder.date}</p>
                <p><strong>Tổng thanh toán:</strong> <span style={{ fontSize: '16px', fontWeight: '700', color: '#2a6946' }}>${Number(viewingOrder.total || 0).toFixed(2)}</span></p>
                <p><strong>Phương thức vận chuyển:</strong> {viewingOrder.shippingMethod}</p>
              </div>
              <div>
                <p>
                  <strong>Trạng thái thanh toán:</strong>{' '}
                  {viewingOrder.paymentStatus === 'Paid' ? 'Đã thanh toán' : viewingOrder.paymentStatus === 'Refunded' ? 'Đã hoàn tiền' : 'Chờ thanh toán'}
                </p>
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
                onClick={() => {
                  const target = viewingOrder;
                  setViewingOrder(null);
                  setPrintingOrders([target]);
                }}
              >
                In nhãn vận đơn
              </button>
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

      {/* Modal: Xem trước Phiếu Gửi Hàng (In nhãn vận đơn lẻ & hàng loạt) */}
      <DialogModal
        isOpen={printingOrders.length > 0}
        onClose={() => setPrintingOrders([])}
        title={`Xem trước Phiếu Gửi Hàng (${printingOrders.length} phiếu)`}
        wide={true}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ maxHeight: '58vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
            {printingOrders.map((o) => {
              const isCod = o.paymentStatus !== 'Paid';
              return (
                <div
                  key={o.id}
                  style={{
                    border: '2px dashed #5d5140',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5dac9', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <strong style={{ fontSize: '16px', color: '#25211d', letterSpacing: '0.5px' }}>VEYLIX EXPRESS FULFILLMENT</strong>
                      <small style={{ display: 'block', color: '#685947' }}>Mã đơn hàng: <strong>#{o.id}</strong> · Ngày: {o.date}</small>
                    </div>
                    <BarcodeSvg code={o.id} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                    <div style={{ padding: '10px 12px', background: '#faf6ee', borderRadius: '8px' }}>
                      <small style={{ color: '#776c5b', fontWeight: '700', textTransform: 'uppercase' }}>Người gửi</small>
                      <strong style={{ display: 'block', marginTop: '2px' }}>Kho Trung Tâm Veylix Studio</strong>
                      <span>Tầng 12, Tòa nhà Bitexco, Quận 1, TP.HCM</span>
                      <small style={{ display: 'block', color: '#685947' }}>Hotline: +84 28 3822 1234</small>
                    </div>
                    <div style={{ padding: '10px 12px', background: '#f5efe4', borderRadius: '8px' }}>
                      <small style={{ color: '#776c5b', fontWeight: '700', textTransform: 'uppercase' }}>Người nhận</small>
                      <strong style={{ display: 'block', marginTop: '2px' }}>{o.customer?.name}</strong>
                      <span>{o.address || 'TP. Hồ Chí Minh'}</span>
                      <small style={{ display: 'block', color: '#685947' }}>Email: {o.customer?.email}</small>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5dac9', paddingTop: '10px', fontSize: '13px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong>Kiện hàng ({o.itemsCount || 1} SP):</strong> {o.itemsDesc}
                      <small style={{ display: 'block', color: '#776c5b' }}>Hình thức giao: {o.shippingMethod}</small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: '#776c5b', display: 'block' }}>TIỀN THU HỘ (COD)</span>
                      <strong style={{ fontSize: '16px', color: isCod ? '#b23b3b' : '#205835' }}>
                        {isCod ? `$${Number(o.total || 0).toFixed(2)}` : '$0.00 (Đã thanh toán)'}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e5dac9', paddingTop: '12px' }}>
            <button type="button" className="secondary-button" onClick={() => setPrintingOrders([])}>
              Đóng
            </button>
            <button type="button" className="primary-button" onClick={handleExecutePrint}>
              In phiếu ngay ({printingOrders.length})
            </button>
          </div>
        </div>
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
                <option value="Cancelled">Đã hủy</option>
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
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}
      </DialogModal>

      {/* Modal: Xác nhận hủy đơn lẻ */}
      <DialogModal 
        isOpen={Boolean(cancelingOrder)} 
        onClose={() => setCancelingOrder(null)}
        title="Xác nhận hủy đơn hàng"
      >
        {cancelingOrder && (
          <div>
            <p style={{ marginBottom: '16px', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn hủy đơn hàng <strong>#{cancelingOrder.id}</strong> của khách hàng <strong>{cancelingOrder.customer?.name}</strong> không? Hành động này không thể hoàn tác.
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
                disabled={isSubmitting}
                style={{ background: '#b23b3b', borderColor: '#b23b3b', color: '#fff' }}
                onClick={handleConfirmCancel}
              >
                {isSubmitting ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* Modal: Xác nhận hủy đơn hàng loạt */}
      <DialogModal
        isOpen={isBulkCancelModalOpen}
        onClose={() => setIsBulkCancelModalOpen(false)}
        title="Xác nhận hủy đơn hàng loạt"
      >
        <div>
          <p style={{ marginBottom: '16px', lineHeight: '1.6' }}>
            Bạn có chắc chắn muốn hủy <strong>{selectedIds.length} đơn hàng đã chọn</strong> ({selectedIds.map(id => `#${id}`).join(', ')}) không? Trạng thái đơn hàng sẽ được cập nhật đồng bộ trong cơ sở dữ liệu.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setIsBulkCancelModalOpen(false)}
            >
              Giữ lại
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={isSubmitting}
              style={{ background: '#b23b3b', borderColor: '#b23b3b', color: '#fff' }}
              onClick={handleConfirmBulkCancel}
            >
              {isSubmitting ? 'Đang xử lý...' : `Xác nhận hủy (${selectedIds.length})`}
            </button>
          </div>
        </div>
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
