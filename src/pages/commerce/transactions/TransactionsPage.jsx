import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';
import api from '../../../services/api';

const GATEWAY_META = [
  { id: 'Stripe', label: 'Stripe (Thẻ quốc tế)', icon: '💳', color: '#635bff' },
  { id: 'VNPay QR', label: 'VNPay QR', icon: '🏦', color: '#0066b2' },
  { id: 'MoMo', label: 'Ví MoMo', icon: '📱', color: '#a50064' },
  { id: 'PayPal', label: 'PayPal', icon: '🌐', color: '#0070ba' },
];

export default function TransactionsPage() {
  const initialTransactions = [
    {
      id: 'TXN-90214',
      orderId: 'SF83291',
      customer: 'Sarah Kim',
      gateway: 'Stripe',
      amount: 95.72,
      fee: 2.78,
      net: 92.94,
      status: 'Succeeded',
      statusText: 'Thành công',
      statusClass: 'green',
      date: 'Hôm nay, 10:14',
      cardLast4: '4242'
    },
    {
      id: 'TXN-90213',
      orderId: 'SF83290',
      customer: 'Michael Tân',
      gateway: 'VNPay QR',
      amount: 85.32,
      fee: 1.71,
      net: 83.61,
      status: 'Succeeded',
      statusText: 'Thành công',
      statusClass: 'green',
      date: '28 Thg 4, 15:22',
      cardLast4: '8899'
    },
    {
      id: 'TXN-90212',
      orderId: 'SF83289',
      customer: 'Emily Davis',
      gateway: 'PayPal',
      amount: 43.88,
      fee: 1.55,
      net: 42.33,
      status: 'Succeeded',
      statusText: 'Thành công',
      statusClass: 'green',
      date: '25 Thg 4, 08:45',
      cardLast4: '1122'
    },
    {
      id: 'TXN-90211',
      orderId: 'SF83288',
      customer: 'Daniel Lê',
      gateway: 'MoMo',
      amount: 74.12,
      fee: 1.48,
      net: 72.64,
      status: 'Succeeded',
      statusText: 'Thành công',
      statusClass: 'green',
      date: '22 Thg 4, 19:30',
      cardLast4: '7766'
    },
    {
      id: 'TXN-90210',
      orderId: 'SF83286',
      customer: 'Alex Trần',
      gateway: 'Stripe',
      amount: 120.00,
      fee: 0,
      net: 0,
      status: 'Pending',
      statusText: 'Đang chờ xử lý',
      statusClass: 'amber',
      date: '16 Thg 4, 11:05',
      cardLast4: '5544'
    },
    {
      id: 'TXN-90209',
      orderId: 'SF83280',
      customer: 'Olivia Martin',
      gateway: 'Stripe',
      amount: 55.00,
      fee: 0,
      net: -55.00,
      status: 'Refunded',
      statusText: 'Đã hoàn tiền',
      statusClass: 'red',
      date: '10 Thg 4, 14:10',
      cardLast4: '3321'
    }
  ];

  const [transactions, setTransactions] = useState(initialTransactions);
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [viewingTxn, setViewingTxn] = useState(null);
  const [receiptTxn, setReceiptTxn] = useState(null);
  const [refundingTxn, setRefundingTxn] = useState(null);

  // Toasts
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      const data = await api.getTransactions();
      if (Array.isArray(data)) {
        setTransactions(data);
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải lịch sử giao dịch', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Thống kê doanh số theo Cổng thanh toán
  const gatewayBreakdown = useMemo(() => {
    const totalAmount = transactions.reduce((s, t) => s + Math.max(0, Number(t.amount || 0)), 0) || 1;
    return GATEWAY_META.map(g => {
      const items = transactions.filter(t => t.gateway === g.id);
      const volume = items.reduce((s, t) => s + Math.max(0, Number(t.amount || 0)), 0);
      const share = Math.round((volume / totalAmount) * 100);
      return {
        ...g,
        count: items.length,
        volume,
        share,
      };
    });
  }, [transactions]);

  // Lọc
  const filteredTxns = useMemo(() => {
    return transactions.filter(t => {
      if (gatewayFilter !== 'all' && t.gateway !== gatewayFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = (t.id || '').toLowerCase().includes(q);
        const matchOrd = (t.orderId || '').toLowerCase().includes(q);
        const matchCust = (t.customer || '').toLowerCase().includes(q);
        if (!matchId && !matchOrd && !matchCust) return false;
      }
      return true;
    });
  }, [transactions, gatewayFilter, statusFilter, searchQuery]);

  // Hoàn tiền
  const handleConfirmRefund = async () => {
    if (!refundingTxn || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const targetId = refundingTxn.id;
      const updated = await api.refundTransaction(targetId);
      if (updated && updated.id) {
        setTransactions(prev => prev.map(t => (t.id === targetId ? updated : t)));
      } else {
        await loadTransactions();
      }
      showToast(`Đã hoàn tiền thành công cho giao dịch ${targetId}!`);
      setRefundingTxn(null);
    } catch (err) {
      showToast(err.message || 'Lỗi khi xử lý hoàn tiền', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    try {
      window.print();
    } catch {}
    showToast(`✓ Đã gửi lệnh in biên lai giao dịch ${receiptTxn?.id || ''}!`);
  };

  // Xuất file CSV
  const handleExport = () => {
    const headers = ['Mã giao dịch', 'Mã đơn hàng', 'Khách hàng', 'Cổng thanh toán', 'Số tiền ($)', 'Phí cổng ($)', 'Thực nhận ($)', 'Trạng thái', 'Thời gian'];
    const rows = filteredTxns.map(t => [
      `"${t.id}"`,
      `"#${t.orderId}"`,
      `"${t.customer}"`,
      `"${t.gateway}"`,
      Number(t.amount || 0).toFixed(2),
      Number(t.fee || 0).toFixed(2),
      Number(t.net || 0).toFixed(2),
      `"${t.statusText}"`,
      `"${t.date}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lich_su_giao_dich_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất lịch sử giao dịch thành công!');
  };

  const totalSettled = transactions.filter(t => t.status === 'Succeeded').reduce((sum, t) => sum + Number(t.net || 0), 0);

  return (
    <div className="transactions-page" style={{ paddingBottom: '36px' }}>
      <header className="commerce-heading">
        <div>
          <div className="commerce-breadcrumb">
            <Link to="/overview">Tổng quan</Link>
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
              </svg>
            </span>
            <span>Giao dịch thanh toán</span>
          </div>
          <h1>Giao dịch & Dòng tiền<span>.</span></h1>
        </div>

        <div className="commerce-heading-actions">
          <Link to="/commerce/providers" className="secondary-button" style={{ textDecoration: 'none' }}>
            Cấu hình cổng thanh toán
          </Link>
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

      {/* KPI Cards */}
      <section className="order-summary-grid" style={{ marginBottom: '16px' }}>
        <div className="order-summary-card green">
          <div>
            <small>Đã quyết toán về tài khoản</small>
            <strong>${totalSettled.toFixed(2)}</strong>
            <em>Sau khi khấu trừ phí xử lý</em>
          </div>
        </div>
        <div className="order-summary-card blue">
          <div>
            <small>Giao dịch thành công</small>
            <strong>{transactions.filter(t => t.status === 'Succeeded').length}</strong>
            <em>Tỷ lệ thành công 98.4%</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Đang chờ ngân hàng</small>
            <strong>{transactions.filter(t => t.status === 'Pending').length}</strong>
            <em>Đang xác thực bảo mật</em>
          </div>
        </div>
        <div className="order-summary-card red">
          <div>
            <small>Giao dịch hoàn tiền</small>
            <strong>{transactions.filter(t => t.status === 'Refunded').length}</strong>
            <em>Theo yêu cầu người mua</em>
          </div>
        </div>
      </section>

      {/* Phân bổ doanh số theo từng Cổng thanh toán (Bấm lọc nhanh 1 chạm) */}
      <section className="glass-card" style={{ padding: '16px 20px', marginBottom: '16px' }} aria-label="Phân bổ theo cổng thanh toán">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <strong style={{ fontSize: '14px', color: '#2b2316' }}>Phân bổ dòng tiền theo Cổng thanh toán</strong>
            <small style={{ display: 'block', color: '#776c5b', fontSize: '12px' }}>Bấm vào bất kỳ cổng nào dưới đây để lọc nhanh giao dịch của cổng đó</small>
          </div>
          {gatewayFilter !== 'all' && (
            <button
              type="button"
              className="secondary-button"
              style={{ padding: '4px 12px', fontSize: '12px' }}
              onClick={() => setGatewayFilter('all')}
            >
              ✕ Xem tất cả cổng ({transactions.length})
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {gatewayBreakdown.map(gw => {
            const isSelected = gatewayFilter === gw.id;
            return (
              <button
                key={gw.id}
                type="button"
                onClick={() => setGatewayFilter(prev => (prev === gw.id ? 'all' : gw.id))}
                style={{
                  textAlign: 'left',
                  cursor: 'pointer',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: isSelected ? '#fff8e8' : 'rgba(255, 255, 255, 0.65)',
                  border: isSelected ? '2px solid #c98a1e' : '1px solid #e6dac8',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#272016' }}>
                    {gw.icon} {gw.id}
                  </span>
                  <span className="badge badge-amber" style={{ fontSize: '11px' }}>{gw.count} GD</span>
                </div>
                <strong style={{ fontSize: '16px', color: '#276840' }}>${gw.volume.toFixed(2)}</strong>
                <div style={{ width: '100%', height: '6px', background: '#eadfce', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(4, gw.share)}%`, height: '100%', background: gw.color, borderRadius: '3px' }} />
                </div>
                <small style={{ color: '#776c5b', fontSize: '11.5px' }}>Tỷ trọng: {gw.share}% tổng giá trị</small>
              </button>
            );
          })}
        </div>
      </section>

      {/* Toolbar */}
      <section className="glass-card c-toolbar">
        <div className="c-toolbar-filters">
          <label className="c-field">
            <span className="sr-only">Lọc theo cổng thanh toán</span>
            <select 
              value={gatewayFilter} 
              onChange={e => setGatewayFilter(e.target.value)}
              aria-label="Lọc theo cổng thanh toán"
            >
              <option value="all">Tất cả cổng thanh toán</option>
              <option value="Stripe">Stripe (Thẻ quốc tế)</option>
              <option value="VNPay QR">VNPay QR</option>
              <option value="MoMo">Ví MoMo</option>
              <option value="PayPal">PayPal</option>
            </select>
          </label>

          <label className="c-field">
            <span className="sr-only">Lọc theo trạng thái</span>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              aria-label="Lọc theo trạng thái giao dịch"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Succeeded">Thành công</option>
              <option value="Pending">Chờ xử lý</option>
              <option value="Refunded">Đã hoàn tiền</option>
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
              placeholder="Tìm mã giao dịch, đơn hàng, khách..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm giao dịch"
            />
          </label>
        </div>
      </section>

      {/* Bảng giao dịch */}
      <section className="glass-card c-resource" style={{ marginTop: '16px' }}>
        <div className="product-list-heading">
          <div>
            <span>SỔ NHẬT KÝ DÒNG TIỀN</span>
            <h2>Danh sách giao dịch thanh toán</h2>
          </div>
          <small>{filteredTxns.length} giao dịch</small>
        </div>

        <div className="table-scroll c-table-scroll" tabIndex="0" role="region" aria-label="Bảng giao dịch">
          <table className="c-table">
            <thead>
              <tr>
                <th>Mã giao dịch</th>
                <th>Đơn hàng</th>
                <th>Khách hàng</th>
                <th>Cổng thanh toán</th>
                <th>Tổng thanh toán</th>
                <th>Phí cổng</th>
                <th>Thực nhận</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '36px 20px', color: '#776c5b' }}>
                    Không tìm thấy giao dịch nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredTxns.map(t => (
                  <tr key={t.id}>
                    <td>
                      <strong style={{ fontFamily: 'monospace', color: '#885600', fontSize: '14px' }}>
                        {t.id}
                      </strong>
                    </td>
                    <td>
                      <Link to={`/commerce/orders?search=${encodeURIComponent(String(t.orderId).replace(/^#/, ''))}`} style={{ fontWeight: '700', textDecoration: 'underline' }}>
                        #{String(t.orderId).replace(/^#/, '')}
                      </Link>
                    </td>
                    <td><strong>{t.customer}</strong></td>
                    <td>
                      <span>{t.gateway} <small style={{ color: '#887d6d' }}>(••• {t.cardLast4 || '4242'})</small></span>
                    </td>
                    <td><strong>${Number(t.amount || 0).toFixed(2)}</strong></td>
                    <td><small style={{ color: '#887d6d' }}>${Number(t.fee || 0).toFixed(2)}</small></td>
                    <td>
                      <strong style={{ color: Number(t.net) > 0 ? '#10b981' : '#b23b3b' }}>
                        ${Number(t.net || 0).toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge badge-${t.statusClass || 'green'}`} style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
                        {t.statusText || t.status}
                      </span>
                    </td>
                    <td><small>{t.date}</small></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button 
                          type="button" 
                          className="secondary-button"
                          style={{ padding: '3px 8px', fontSize: '12px' }}
                          onClick={() => setViewingTxn(t)}
                        >
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          style={{ padding: '3px 8px', fontSize: '12px' }}
                          onClick={() => setReceiptTxn(t)}
                        >
                          Biên lai
                        </button>
                        {t.status === 'Succeeded' && (
                          <button 
                            type="button" 
                            className="secondary-button"
                            style={{ padding: '3px 8px', fontSize: '12px', color: '#b23b3b' }}
                            onClick={() => setRefundingTxn(t)}
                          >
                            Hoàn tiền
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

      {/* Modal: Biên lai thanh toán chuẩn có nút In */}
      <DialogModal
        isOpen={Boolean(receiptTxn)}
        onClose={() => setReceiptTxn(null)}
        title={receiptTxn ? `Biên lai thanh toán điện tử · ${receiptTxn.id}` : ''}
      >
        {receiptTxn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
            <div style={{ padding: '18px 20px', background: '#fff', borderRadius: '12px', border: '1.5px solid #e2d5c1', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed #d8cab3', paddingBottom: '12px' }}>
                <div>
                  <strong style={{ fontSize: '16px', color: '#272016', display: 'block' }}>VEYLIX COMMERCE STUDIO</strong>
                  <small style={{ color: '#776c5b' }}>Chứng từ xác nhận giao dịch thanh toán</small>
                </div>
                <span className={`badge badge-${receiptTxn.statusClass || 'green'}`} style={{ padding: '4px 10px', fontSize: '12px' }}>
                  {receiptTxn.statusText || receiptTxn.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <small style={{ color: '#776c5b', display: 'block' }}>Mã giao dịch</small>
                  <strong style={{ fontFamily: 'monospace' }}>{receiptTxn.id}</strong>
                </div>
                <div>
                  <small style={{ color: '#776c5b', display: 'block' }}>Thời gian ghi nhận</small>
                  <strong>{receiptTxn.date}</strong>
                </div>
                <div>
                  <small style={{ color: '#776c5b', display: 'block' }}>Khách hàng thanh toán</small>
                  <strong>{receiptTxn.customer}</strong>
                </div>
                <div>
                  <small style={{ color: '#776c5b', display: 'block' }}>Đơn hàng liên kết</small>
                  <strong>#{String(receiptTxn.orderId).replace(/^#/, '')}</strong>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <small style={{ color: '#776c5b', display: 'block' }}>Phương thức thanh toán</small>
                  <strong>{receiptTxn.gateway} · Thẻ/Tài khoản kết thúc •••• {receiptTxn.cardLast4 || '4242'}</strong>
                </div>
              </div>

              <div style={{ background: '#faf6ee', padding: '12px 14px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tổng tiền khách thanh toán:</span>
                  <strong>${Number(receiptTxn.amount || 0).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#776c5b' }}>
                  <span>Phí xử lý cổng ({receiptTxn.gateway}):</span>
                  <span>-${Number(receiptTxn.fee || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e6dac8', paddingTop: '6px', fontSize: '15px' }}>
                  <strong>Thực nhận đối soát (Net):</strong>
                  <strong style={{ color: Number(receiptTxn.net) >= 0 ? '#10b981' : '#b23b3b' }}>
                    ${Number(receiptTxn.net || 0).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setReceiptTxn(null)}>
                Đóng
              </button>
              <button type="button" className="primary-button" onClick={handlePrintReceipt}>
                🖨️ In biên lai
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* Modal: Chi tiết giao dịch */}
      <DialogModal
        isOpen={Boolean(viewingTxn)}
        onClose={() => setViewingTxn(null)}
        title={viewingTxn ? `Chi tiết giao dịch: ${viewingTxn.id}` : ''}
      >
        {viewingTxn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
            <div style={{ padding: '14px 18px', background: '#f6f0e4', borderRadius: '10px' }}>
              <p style={{ margin: '0 0 4px 0' }}><strong>Cổng thanh toán:</strong> {viewingTxn.gateway} (Thẻ kết thúc bằng ••• {viewingTxn.cardLast4 || '4242'})</p>
              <p style={{ margin: '0 0 4px 0' }}><strong>Đơn hàng liên kết:</strong> #{String(viewingTxn.orderId).replace(/^#/, '')}</p>
              <p style={{ margin: 0 }}><strong>Khách hàng:</strong> {viewingTxn.customer}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div style={{ padding: '10px', background: '#fff', borderRadius: '8px', border: '1px solid #ebdccb' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Tổng tiền thanh toán</small>
                <strong style={{ fontSize: '18px' }}>${Number(viewingTxn.amount || 0).toFixed(2)}</strong>
              </div>
              <div style={{ padding: '10px', background: '#fff', borderRadius: '8px', border: '1px solid #ebdccb' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Phí cổng dịch vụ</small>
                <strong style={{ fontSize: '18px', color: '#887d6d' }}>${Number(viewingTxn.fee || 0).toFixed(2)}</strong>
              </div>
              <div style={{ padding: '10px', background: '#fff', borderRadius: '8px', border: '1px solid #ebdccb' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Số tiền thực nhận</small>
                <strong style={{ fontSize: '18px', color: Number(viewingTxn.net) >= 0 ? '#10b981' : '#b23b3b' }}>${Number(viewingTxn.net || 0).toFixed(2)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  const t = viewingTxn;
                  setViewingTxn(null);
                  setReceiptTxn(t);
                }}
              >
                Xem biên lai in
              </button>
              <button type="button" className="primary-button" onClick={() => setViewingTxn(null)}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* Modal: Xác nhận hoàn tiền */}
      <DialogModal
        isOpen={Boolean(refundingTxn)}
        onClose={() => setRefundingTxn(null)}
        title="Xác nhận hoàn trả tiền"
      >
        {refundingTxn && (
          <div>
            <p style={{ lineHeight: '1.6', marginBottom: '16px' }}>
              Bạn có chắc chắn muốn phát lệnh hoàn trả số tiền <strong>${Number(refundingTxn.amount || 0).toFixed(2)}</strong> cho giao dịch <strong>{refundingTxn.id}</strong> của khách hàng <strong>{refundingTxn.customer}</strong> qua cổng {refundingTxn.gateway} không?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setRefundingTxn(null)}>
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="primary-button"
                disabled={isSubmitting}
                style={{ background: '#b23b3b', borderColor: '#b23b3b' }}
                onClick={handleConfirmRefund}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
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
