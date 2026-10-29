import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';

export default function FulfillmentPage() {
  const initialShipments = [
    {
      id: 'TRK-98214',
      orderId: 'SF83291',
      carrier: 'Giao Hàng Tiết Kiệm (GHTK)',
      customer: 'Sarah Kim',
      destination: 'Quận 1, TP. Hồ Chí Minh',
      status: 'Out for delivery', // Pending, Packaging, Out for delivery, Delivered
      statusText: 'Đang giao hàng',
      statusClass: 'teal',
      createdAt: 'Hôm nay, 08:30',
      eta: 'Hôm nay, 17:00'
    },
    {
      id: 'TRK-98213',
      orderId: 'SF83290',
      carrier: 'DHL Express',
      customer: 'Michael Tân',
      destination: 'Quận 3, TP. Hồ Chí Minh',
      status: 'Out for delivery',
      statusText: 'Đang trung chuyển',
      statusClass: 'blue',
      createdAt: '28 Thg 4, 14:15',
      eta: '29 Thg 4'
    },
    {
      id: 'TRK-98212',
      orderId: 'SF83288',
      carrier: 'Viettel Post',
      customer: 'Daniel Lê',
      destination: 'Hải Châu, Đà Nẵng',
      status: 'Packaging',
      statusText: 'Đang đóng gói',
      statusClass: 'amber',
      createdAt: '27 Thg 4, 10:00',
      eta: '30 Thg 4'
    },
    {
      id: 'TRK-98211',
      orderId: 'SF83287',
      carrier: 'VNPost',
      customer: 'Priya Sharma',
      destination: 'Ninh Kiều, Cần Thơ',
      status: 'Pending',
      statusText: 'Chờ lấy hàng',
      statusClass: 'purple',
      createdAt: '26 Thg 4, 16:45',
      eta: '02 Thg 5'
    },
    {
      id: 'TRK-98210',
      orderId: 'SF83289',
      carrier: 'Giao Hàng Nhanh (GHN)',
      customer: 'Emily Davis',
      destination: 'Ba Đình, Hà Nội',
      status: 'Delivered',
      statusText: 'Đã giao thành công',
      statusClass: 'green',
      createdAt: '25 Thg 4, 09:10',
      eta: 'Đã hoàn tất'
    }
  ];

  const [shipments, setShipments] = useState(initialShipments);
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [trackingModalItem, setTrackingModalItem] = useState(null);

  // Form tạo vận đơn mới
  const [newShipment, setNewShipment] = useState({
    orderId: 'SF83286',
    carrier: 'Giao Hàng Tiết Kiệm (GHTK)',
    customer: 'Alex Trần',
    destination: 'Hoàn Kiếm, Hà Nội'
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

  // Lọc
  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      if (carrierFilter !== 'all' && !s.carrier.includes(carrierFilter)) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTrk = s.id.toLowerCase().includes(q);
        const matchOrd = s.orderId.toLowerCase().includes(q);
        const matchCust = s.customer.toLowerCase().includes(q);
        const matchDest = s.destination.toLowerCase().includes(q);
        if (!matchTrk && !matchOrd && !matchCust && !matchDest) return false;
      }
      return true;
    });
  }, [shipments, carrierFilter, statusFilter, searchQuery]);

  // Tạo vận đơn
  const handleCreateShipment = (e) => {
    e.preventDefault();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const created = {
      id: `TRK-${randomNum}`,
      orderId: newShipment.orderId,
      carrier: newShipment.carrier,
      customer: newShipment.customer,
      destination: newShipment.destination,
      status: 'Packaging',
      statusText: 'Đang đóng gói',
      statusClass: 'amber',
      createdAt: 'Vừa tạo',
      eta: '2-3 ngày tới'
    };

    setShipments([created, ...shipments]);
    setIsAddModalOpen(false);
    showToast(`Đã tạo thành công vận đơn ${created.id} cho đơn hàng #${created.orderId}!`);
  };

  // Cập nhật trạng thái
  const handleAdvanceStatus = (id) => {
    setShipments(prev => prev.map(s => {
      if (s.id === id) {
        if (s.status === 'Pending') {
          return { ...s, status: 'Packaging', statusText: 'Đang đóng gói', statusClass: 'amber' };
        } else if (s.status === 'Packaging') {
          return { ...s, status: 'Out for delivery', statusText: 'Đang giao hàng', statusClass: 'teal' };
        } else if (s.status === 'Out for delivery') {
          return { ...s, status: 'Delivered', statusText: 'Đã giao thành công', statusClass: 'green' };
        }
      }
      return s;
    }));
    showToast('Đã cập nhật tiến độ giao hàng!');
  };

  // Xuất file CSV
  const handleExport = () => {
    const headers = ['Mã vận đơn', 'Mã đơn hàng', 'Đơn vị vận chuyển', 'Khách nhận', 'Địa chỉ giao', 'Trạng thái', 'Thời gian tạo', 'Dự kiến đến'];
    const rows = filteredShipments.map(s => [
      `"${s.id}"`,
      `"#${s.orderId}"`,
      `"${s.carrier}"`,
      `"${s.customer}"`,
      `"${s.destination}"`,
      `"${s.statusText}"`,
      `"${s.createdAt}"`,
      `"${s.eta}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danh_sach_van_don_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất danh sách vận đơn thành công!');
  };

  return (
    <div className="fulfillment-page" style={{ paddingBottom: '36px' }}>
      <header className="commerce-heading">
        <div>
          <div className="commerce-breadcrumb">
            <Link to="/overview">Tổng quan</Link>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </span>
            <span>Vận chuyển & Đóng gói</span>
          </div>
          <h1>Vận chuyển & Giao nhận<span>.</span></h1>
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

          <button type="button" className="primary-button" onClick={() => setIsAddModalOpen(true)}>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
              </svg>
            </span>
            + Tạo vận đơn
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="order-summary-grid" style={{ marginBottom: '20px' }}>
        <div className="order-summary-card blue">
          <div>
            <small>Chờ lấy hàng</small>
            <strong>{shipments.filter(s => s.status === 'Pending').length}</strong>
            <em>Đã sẵn sàng tại kho</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Đang đóng gói</small>
            <strong>{shipments.filter(s => s.status === 'Packaging').length}</strong>
            <em>Nhân viên kho đang chuẩn bị</em>
          </div>
        </div>
        <div className="order-summary-card green">
          <div>
            <small>Đang giao trên đường</small>
            <strong>{shipments.filter(s => s.status === 'Out for delivery').length}</strong>
            <em>Shipper đang vận chuyển</em>
          </div>
        </div>
        <div className="order-summary-card green">
          <div>
            <small>Giao thành công</small>
            <strong>{shipments.filter(s => s.status === 'Delivered').length}</strong>
            <em>Đã giao tới tay khách</em>
          </div>
        </div>
      </section>

      {/* Toolbar */}
      <section className="glass-card c-toolbar">
        <div className="c-toolbar-filters">
          <label className="c-field">
            <span className="sr-only">Lọc theo đơn vị vận chuyển</span>
            <select 
              value={carrierFilter} 
              onChange={e => setCarrierFilter(e.target.value)}
              aria-label="Lọc theo đối tác vận chuyển"
            >
              <option value="all">Tất cả đối tác vận chuyển</option>
              <option value="GHTK">GHTK</option>
              <option value="GHN">GHN</option>
              <option value="Viettel">Viettel Post</option>
              <option value="DHL">DHL Express</option>
            </select>
          </label>

          <label className="c-field">
            <span className="sr-only">Lọc theo trạng thái</span>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              aria-label="Lọc theo trạng thái vận đơn"
            >
              <option value="all">Tất cả trạng thái vận chuyển</option>
              <option value="Pending">Chờ lấy hàng</option>
              <option value="Packaging">Đang đóng gói</option>
              <option value="Out for delivery">Đang giao hàng</option>
              <option value="Delivered">Đã giao thành công</option>
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
              placeholder="Tìm mã vận đơn, đơn hàng, khách..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm vận đơn"
            />
          </label>
        </div>
      </section>

      {/* Bảng vận đơn */}
      <section className="glass-card c-resource" style={{ marginTop: '16px' }}>
        <div className="product-list-heading">
          <div>
            <span>VẬN TẢI HÀNG HÓA</span>
            <h2>Danh sách kiện hàng vận chuyển</h2>
          </div>
          <small>{filteredShipments.length} kiện hàng</small>
        </div>

        <div className="table-scroll c-table-scroll" tabIndex="0" role="region" aria-label="Bảng vận chuyển">
          <table className="c-table">
            <thead>
              <tr>
                <th>Mã vận đơn</th>
                <th>Đơn hàng</th>
                <th>Đơn vị vận chuyển</th>
                <th>Người nhận</th>
                <th>Địa chỉ giao</th>
                <th>Trạng thái</th>
                <th>Dự kiến đến</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 20px', color: '#776c5b' }}>
                    Không có kiện hàng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredShipments.map(s => (
                  <tr key={s.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: '#885600', fontSize: '14px' }}>
                        {s.id}
                      </strong>
                    </td>
                    <td>
                      <Link to="/commerce/orders" style={{ fontWeight: '700', textDecoration: 'underline' }}>
                        #{s.orderId}
                      </Link>
                    </td>
                    <td>{s.carrier}</td>
                    <td><strong>{s.customer}</strong></td>
                    <td><small>{s.destination}</small></td>
                    <td>
                      <span className={`badge badge-${s.statusClass}`} style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
                        {s.statusText}
                      </span>
                    </td>
                    <td><small>{s.eta}</small></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          type="button" 
                          className="secondary-button"
                          style={{ padding: '3px 8px', fontSize: '12px' }}
                          onClick={() => setTrackingModalItem(s)}
                        >
                          Hành trình
                        </button>
                        {s.status !== 'Delivered' && (
                          <button 
                            type="button" 
                            className="primary-button"
                            style={{ padding: '3px 8px', fontSize: '12px' }}
                            onClick={() => handleAdvanceStatus(s.id)}
                          >
                            Tiếp theo &rarr;
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal: Tạo vận đơn */}
      <DialogModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tạo vận đơn xuất hàng mới"
      >
        <form onSubmit={handleCreateShipment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Mã đơn hàng liên kết
            </label>
            <input 
              type="text" 
              required
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newShipment.orderId}
              onChange={e => setNewShipment({ ...newShipment, orderId: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Đối tác vận chuyển
            </label>
            <select 
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newShipment.carrier}
              onChange={e => setNewShipment({ ...newShipment, carrier: e.target.value })}
            >
              <option value="Giao Hàng Tiết Kiệm (GHTK)">Giao Hàng Tiết Kiệm (GHTK)</option>
              <option value="Giao Hàng Nhanh (GHN)">Giao Hàng Nhanh (GHN)</option>
              <option value="Viettel Post">Viettel Post</option>
              <option value="DHL Express">DHL Express</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Người nhận & Địa chỉ giao
            </label>
            <input 
              type="text" 
              required
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newShipment.destination}
              onChange={e => setNewShipment({ ...newShipment, destination: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="secondary-button" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="primary-button">
              Phát hành vận đơn
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Hành trình kiện hàng */}
      <DialogModal
        isOpen={Boolean(trackingModalItem)}
        onClose={() => setTrackingModalItem(null)}
        title={trackingModalItem ? `Hành trình vận đơn: ${trackingModalItem.id}` : ''}
      >
        {trackingModalItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
            <div style={{ padding: '12px 16px', background: '#f6f0e4', borderRadius: '10px' }}>
              <strong>Đơn vị vận chuyển:</strong> {trackingModalItem.carrier}<br />
              <strong>Đơn hàng:</strong> #{trackingModalItem.orderId} · <strong>Người nhận:</strong> {trackingModalItem.customer}
            </div>

            <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong style={{ color: '#10b981' }}>● {trackingModalItem.statusText}</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#685d4f' }}>Kiện hàng đang tại bưu cục trung chuyển đích.</p>
              </div>
              <div>
                <strong>● Xuất kho đóng gói hoàn tất</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#685d4f' }}>Đã dán nhãn vận đơn và bàn giao đối tác vận chuyển.</p>
              </div>
              <div>
                <strong>● Đã tạo phiếu gửi</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#685d4f' }}>Thời gian: {trackingModalItem.createdAt}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button type="button" className="primary-button" onClick={() => setTrackingModalItem(null)}>
                Đóng
              </button>
            </div>
          </div>
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
