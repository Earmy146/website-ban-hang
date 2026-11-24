import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';
import api from '../../../services/api';

function ShipmentBarcodeSvg({ code = 'TRK-98214' }) {
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

export default function FulfillmentPage() {
  const initialShipments = [
    {
      id: 'TRK-98214',
      orderId: 'SF83291',
      carrier: 'Giao Hàng Tiết Kiệm (GHTK)',
      customer: 'Sarah Kim',
      destination: 'Quận 1, TP. Hồ Chí Minh',
      status: 'Out for delivery',
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
  const [ordersLookup, setOrdersLookup] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [trackingModalItem, setTrackingModalItem] = useState(null);
  const [printingShipments, setPrintingShipments] = useState([]);

  // Form tạo vận đơn mới
  const [newShipment, setNewShipment] = useState({
    orderId: 'SF83286',
    carrier: 'Giao Hàng Tiết Kiệm (GHTK)',
    customer: 'Alex Trần',
    destination: 'Hoàn Kiếm, Hà Nội'
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

  const loadShipments = useCallback(async () => {
    try {
      const [shipData, orderData] = await Promise.all([
        api.getShipments(),
        api.getOrders().catch(() => null),
      ]);
      if (Array.isArray(shipData)) {
        setShipments(shipData);
      }
      if (Array.isArray(orderData)) {
        setOrdersLookup(orderData);
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải danh sách vận đơn', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  const handleOrderIdChange = (rawVal) => {
    const cleaned = rawVal.replace(/^#/, '');
    const matchedOrder = ordersLookup.find(
      o => String(o.id).toUpperCase() === cleaned.trim().toUpperCase()
    );
    if (matchedOrder) {
      setNewShipment(prev => ({
        ...prev,
        orderId: rawVal,
        customer: matchedOrder.customer?.name || prev.customer,
        destination: matchedOrder.address || prev.destination,
      }));
    } else {
      setNewShipment(prev => ({ ...prev, orderId: rawVal }));
    }
  };

  // Đếm theo từng trạng thái cho dải Tab lọc nhanh
  const statusTabs = useMemo(() => [
    { id: 'all', label: 'Tất cả', count: shipments.length },
    { id: 'Pending', label: 'Chờ lấy hàng', count: shipments.filter(s => s.status === 'Pending').length },
    { id: 'Packaging', label: 'Đang đóng gói', count: shipments.filter(s => s.status === 'Packaging').length },
    { id: 'Out for delivery', label: 'Đang giao hàng', count: shipments.filter(s => s.status === 'Out for delivery').length },
    { id: 'Delivered', label: 'Đã giao', count: shipments.filter(s => s.status === 'Delivered').length },
  ], [shipments]);

  // Lọc
  const filteredShipments = useMemo(() => {
    return shipments.filter(s => {
      if (carrierFilter !== 'all' && !(s.carrier || '').includes(carrierFilter)) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTrk = (s.id || '').toLowerCase().includes(q);
        const matchOrd = (s.orderId || '').toLowerCase().includes(q);
        const matchCust = (s.customer || '').toLowerCase().includes(q);
        const matchDest = (s.destination || '').toLowerCase().includes(q);
        if (!matchTrk && !matchOrd && !matchCust && !matchDest) return false;
      }
      return true;
    });
  }, [shipments, carrierFilter, statusFilter, searchQuery]);

  // Checkbox hàng loạt
  const allFilteredSelected = filteredShipments.length > 0 && filteredShipments.every(s => selectedIds.includes(s.id));

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredShipments.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  // Tạo vận đơn
  const handleCreateShipment = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const payload = {
      orderId: newShipment.orderId.replace(/^#/, '').trim(),
      carrier: newShipment.carrier,
      customer: newShipment.customer.trim(),
      destination: newShipment.destination.trim()
    };

    setIsSubmitting(true);
    try {
      const created = await api.createShipment(payload);
      if (created && created.id) {
        setShipments(prev => [created, ...prev]);
      } else {
        await loadShipments();
      }
      setIsAddModalOpen(false);
      showToast(`Đã tạo thành công vận đơn ${created?.id || ''} cho đơn hàng #${payload.orderId}!`);
    } catch (err) {
      showToast(err.message || 'Lỗi khi tạo vận đơn', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật trạng thái 1 dòng
  const handleAdvanceStatus = async (id) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updated = await api.advanceShipment(id);
      if (updated && updated.id) {
        setShipments(prev => prev.map(s => (s.id === id ? updated : s)));
      } else {
        await loadShipments();
      }
      showToast('Đã cập nhật tiến độ giao hàng!');
    } catch (err) {
      showToast(err.message || 'Lỗi khi cập nhật trạng thái vận đơn', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chuyển bước giao hàng hàng loạt
  const handleBulkAdvance = async () => {
    if (selectedIds.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await api.bulkAdvanceShipments(selectedIds);
      await loadShipments();
      const count = result?.advancedCount ?? selectedIds.length;
      setSelectedIds([]);
      showToast(`✓ Đã chuyển bước tiến độ cho ${count} vận đơn đã chọn!`);
    } catch (err) {
      showToast(err.message || 'Không thể chuyển bước vận đơn hàng loạt', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkPrint = () => {
    const selected = shipments.filter(s => selectedIds.includes(s.id));
    if (selected.length === 0) return;
    setPrintingShipments(selected);
  };

  const handleExecutePrint = () => {
    const count = printingShipments.length;
    try {
      window.print();
    } catch {}
    setPrintingShipments([]);
    setSelectedIds([]);
    showToast(`✓ Đã gửi lệnh in ${count} phiếu vận đơn thành công!`);
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
      <section className="order-summary-grid" style={{ marginBottom: '16px' }}>
        <div className="order-summary-card blue" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('Pending')}>
          <div>
            <small>Chờ lấy hàng</small>
            <strong>{shipments.filter(s => s.status === 'Pending').length}</strong>
            <em>Đã sẵn sàng tại kho</em>
          </div>
        </div>
        <div className="order-summary-card amber" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('Packaging')}>
          <div>
            <small>Đang đóng gói</small>
            <strong>{shipments.filter(s => s.status === 'Packaging').length}</strong>
            <em>Nhân viên kho đang chuẩn bị</em>
          </div>
        </div>
        <div className="order-summary-card green" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('Out for delivery')}>
          <div>
            <small>Đang giao trên đường</small>
            <strong>{shipments.filter(s => s.status === 'Out for delivery').length}</strong>
            <em>Shipper đang vận chuyển</em>
          </div>
        </div>
        <div className="order-summary-card green" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('Delivered')}>
          <div>
            <small>Giao thành công</small>
            <strong>{shipments.filter(s => s.status === 'Delivered').length}</strong>
            <em>Đã giao tới tay khách</em>
          </div>
        </div>
      </section>

      {/* Dải Tab lọc nhanh trạng thái có đếm số lượng */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }} role="tablist" aria-label="Lọc nhanh trạng thái vận đơn">
        {statusTabs.map(tab => {
          const active = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={active ? 'primary-button' : 'secondary-button'}
              style={{ padding: '7px 14px', fontSize: '13px', borderRadius: '999px' }}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label} <strong>({tab.count})</strong>
            </button>
          );
        })}
      </div>

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
              <option value="VNPost">VNPost</option>
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
              <option value="Delayed">Chậm trễ</option>
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

        {selectedIds.length > 0 && (
          <div className="c-selection" style={{ marginBottom: '14px', padding: '10px 16px', background: '#f5efe4', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <strong style={{ fontSize: '13.5px' }}>Đã chọn {selectedIds.length} kiện hàng vận chuyển</strong>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="primary-button"
                disabled={isSubmitting}
                style={{ padding: '6px 12px', fontSize: '12.5px' }}
                onClick={handleBulkAdvance}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Chuyển bước giao hàng hàng loạt'}
              </button>
              <button
                type="button"
                className="secondary-button"
                style={{ padding: '6px 12px', fontSize: '12.5px' }}
                onClick={handleBulkPrint}
              >
                In phiếu vận đơn hàng loạt
              </button>
              <button
                type="button"
                className="secondary-button"
                style={{ padding: '6px 12px', fontSize: '12.5px' }}
                onClick={() => setSelectedIds([])}
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}

        <div className="table-scroll c-table-scroll" tabIndex="0" role="region" aria-label="Bảng vận chuyển">
          <table className="c-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    aria-label="Chọn tất cả vận đơn"
                    checked={allFilteredSelected}
                    onChange={e => handleSelectAll(e.target.checked)}
                  />
                </th>
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
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px 20px', color: '#776c5b' }}>
                    Không có kiện hàng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredShipments.map(s => (
                  <tr key={s.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Chọn vận đơn ${s.id}`}
                        checked={selectedIds.includes(s.id)}
                        onChange={() => handleToggleSelect(s.id)}
                      />
                    </td>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: '#885600', fontSize: '14px' }}>
                        {s.id}
                      </strong>
                    </td>
                    <td>
                      <Link to={`/commerce/orders?search=${encodeURIComponent(String(s.orderId).replace(/^#/, ''))}`} style={{ fontWeight: '700', textDecoration: 'underline' }}>
                        #{String(s.orderId).replace(/^#/, '')}
                      </Link>
                    </td>
                    <td>{s.carrier}</td>
                    <td><strong>{s.customer}</strong></td>
                    <td><small>{s.destination}</small></td>
                    <td>
                      <span className={`badge badge-${s.statusClass || 'teal'}`} style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
                        {s.statusText || s.status}
                      </span>
                    </td>
                    <td><small>{s.eta}</small></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button 
                          type="button" 
                          className="secondary-button"
                          style={{ padding: '3px 8px', fontSize: '12px' }}
                          onClick={() => setTrackingModalItem(s)}
                        >
                          Hành trình
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          style={{ padding: '3px 8px', fontSize: '12px' }}
                          onClick={() => setPrintingShipments([s])}
                        >
                          In phiếu
                        </button>
                        {s.status !== 'Delivered' && (
                          <button 
                            type="button" 
                            className="primary-button"
                            disabled={isSubmitting}
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

      {/* Modal: In phiếu vận đơn (lẻ & hàng loạt) */}
      <DialogModal
        isOpen={printingShipments.length > 0}
        onClose={() => setPrintingShipments([])}
        title={`Xem trước Phiếu Vận Đơn (${printingShipments.length} kiện)`}
        wide={true}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {printingShipments.map(s => (
              <div
                key={s.id}
                style={{
                  padding: '16px 18px',
                  background: '#fff',
                  borderRadius: '12px',
                  border: '2px dashed #c8b698',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee2d0', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '15px', color: '#272016', display: 'block' }}>VEYLIX LOGISTICS · {s.carrier}</strong>
                    <small style={{ color: '#776c5b' }}>Mã vận đơn: <strong>{s.id}</strong> · Đơn gốc: <strong>#{String(s.orderId).replace(/^#/, '')}</strong></small>
                  </div>
                  <ShipmentBarcodeSvg code={s.id} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div style={{ padding: '10px 12px', background: '#faf6ee', borderRadius: '8px' }}>
                    <small style={{ color: '#776c5b', display: 'block' }}>NGƯỜI GỬI (KHO XUẤT)</small>
                    <strong>Kho Trung tâm Veylix</strong>
                    <div style={{ color: '#5c5243' }}>Tầng 12, Bitexco, Quận 1, TP.HCM</div>
                  </div>
                  <div style={{ padding: '10px 12px', background: '#faf6ee', borderRadius: '8px' }}>
                    <small style={{ color: '#776c5b', display: 'block' }}>NGƯỜI NHẬN</small>
                    <strong>{s.customer}</strong>
                    <div style={{ color: '#5c5243' }}>{s.destination}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: '#685d4f' }}>
                  <span>Trạng thái hiện tại: <strong>{s.statusText || s.status}</strong></span>
                  <span>Dự kiến giao: <strong>{s.eta || 'Tiêu chuẩn'}</strong></span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="secondary-button" onClick={() => setPrintingShipments([])}>
              Đóng
            </button>
            <button type="button" className="primary-button" onClick={handleExecutePrint}>
              🖨️ In phiếu ngay
            </button>
          </div>
        </div>
      </DialogModal>

      {/* Modal: Tạo vận đơn */}
      <DialogModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tạo vận đơn xuất hàng mới"
      >
        <form onSubmit={handleCreateShipment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Mã đơn hàng liên kết *
            </label>
            <input 
              type="text" 
              required
              className="c-field"
              placeholder="VD: SF83291"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newShipment.orderId}
              onChange={e => handleOrderIdChange(e.target.value)}
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
              <option value="VNPost">VNPost</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Tên người nhận
            </label>
            <input 
              type="text" 
              className="c-field"
              placeholder="Tự động lấy từ đơn hàng nếu để trống"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newShipment.customer}
              onChange={e => setNewShipment({ ...newShipment, customer: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Địa chỉ giao nhận *
            </label>
            <input 
              type="text" 
              required
              className="c-field"
              placeholder="VD: Quận 1, TP. Hồ Chí Minh"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={newShipment.destination}
              onChange={e => setNewShipment({ ...newShipment, destination: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="secondary-button" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Đang phát hành...' : 'Phát hành vận đơn'}
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
              <strong>Đơn hàng:</strong> #{String(trackingModalItem.orderId).replace(/^#/, '')} · <strong>Người nhận:</strong> {trackingModalItem.customer}
            </div>

            <div style={{ borderLeft: '3px solid #10b981', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong style={{ color: '#10b981' }}>● {trackingModalItem.statusText}</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#685d4f' }}>Kiện hàng đang tại bưu cục trung chuyển đích ({trackingModalItem.destination}).</p>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  const item = trackingModalItem;
                  setTrackingModalItem(null);
                  setPrintingShipments([item]);
                }}
              >
                🖨️ In phiếu vận đơn
              </button>
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
          <div key={t.id} style={{ background: t.type === 'error' ? '#8a2323' : '#27342b', color: '#fff', padding: '10px 18px', borderRadius: '10px', fontSize: '13px' }}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
