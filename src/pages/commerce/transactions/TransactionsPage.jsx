import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../../components/ui/DialogModal';

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
      status: 'Succeeded', // Succeeded, Pending, Refunded
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

  // Modals
  const [viewingTxn, setViewingTxn] = useState(null);
  const [refundingTxn, setRefundingTxn] = useState(null);

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
  const filteredTxns = useMemo(() => {
    return transactions.filter(t => {
      if (gatewayFilter !== 'all' && t.gateway !== gatewayFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = t.id.toLowerCase().includes(q);
        const matchOrd = t.orderId.toLowerCase().includes(q);
        const matchCust = t.customer.toLowerCase().includes(q);
        if (!matchId && !matchOrd && !matchCust) return false;
      }
      return true;
    });
  }, [transactions, gatewayFilter, statusFilter, searchQuery]);

  // Hoàn tiền
  const handleConfirmRefund = () => {
    if (!refundingTxn) return;
    setTransactions(prev => prev.map(t => t.id === refundingTxn.id ? { ...t, status: 'Refunded', statusText: 'Đã hoàn tiền', statusClass: 'red' } : t));
    showToast(`Đã hoàn tiền thành công cho giao dịch ${refundingTxn.id}!`);
    setRefundingTxn(null);
  };

  // Xuất file CSV
  const handleExport = () => {
    const headers = ['Mã giao dịch', 'Mã đơn hàng', 'Khách hàng', 'Cổng thanh toán', 'Số tiền ($)', 'Phí cổng ($)', 'Thực nhận ($)', 'Trạng thái', 'Thời gian'];
    const rows = filteredTxns.map(t => [
      `"${t.id}"`,
      `"#${t.orderId}"`,
      `"${t.customer}"`,
      `"${t.gateway}"`,
      t.amount.toFixed(2),
      t.fee.toFixed(2),
      t.net.toFixed(2),
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

  const totalSettled = transactions.filter(t => t.status === 'Succeeded').reduce((sum, t) => sum + t.net, 0);

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
      <section className="order-summary-grid" style={{ marginBottom: '20px' }}>
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
                      <Link to="/commerce/orders" style={{ fontWeight: '700', textDecoration: 'underline' }}>
                        #{t.orderId}
                      </Link>
                    </td>
                    <td><strong>{t.customer}</strong></td>
                    <td>
                      <span>{t.gateway} <small style={{ color: '#887d6d' }}>(••• {t.cardLast4})</small></span>
                    </td>
                    <td><strong>${t.amount.toFixed(2)}</strong></td>
                    <td><small style={{ color: '#887d6d' }}>${t.fee.toFixed(2)}</small></td>
                    <td>
                      <strong style={{ color: t.net > 0 ? '#10b981' : '#b23b3b' }}>
                        ${t.net.toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge badge-${t.statusClass}`} style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px' }}>
                        {t.statusText}
                      </span>
                    </td>
                    <td><small>{t.date}</small></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          type="button" 
                          className="secondary-button"
                          style={{ padding: '3px 8px', fontSize: '12px' }}
                          onClick={() => setViewingTxn(t)}
                        >
                          Chi tiết
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

      {/* Modal: Chi tiết giao dịch */}
      <DialogModal
        isOpen={Boolean(viewingTxn)}
        onClose={() => setViewingTxn(null)}
        title={viewingTxn ? `Chi tiết giao dịch: ${viewingTxn.id}` : ''}
      >
        {viewingTxn && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
            <div style={{ padding: '14px 18px', background: '#f6f0e4', borderRadius: '10px' }}>
              <p><strong>Cổng thanh toán:</strong> {viewingTxn.gateway} (Thẻ kết thúc bằng ••• {viewingTxn.cardLast4})</p>
              <p><strong>Đơn hàng liên kết:</strong> #{viewingTxn.orderId}</p>
              <p><strong>Khách hàng:</strong> {viewingTxn.customer}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div style={{ padding: '10px', background: '#fff', borderRadius: '8px', border: '1px solid #ebdccb' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Tổng tiền thanh toán</small>
                <strong style={{ fontSize: '18px' }}>${viewingTxn.amount.toFixed(2)}</strong>
              </div>
              <div style={{ padding: '10px', background: '#fff', borderRadius: '8px', border: '1px solid #ebdccb' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Phí cổng dịch vụ</small>
                <strong style={{ fontSize: '18px', color: '#887d6d' }}>${viewingTxn.fee.toFixed(2)}</strong>
              </div>
              <div style={{ padding: '10px', background: '#fff', borderRadius: '8px', border: '1px solid #ebdccb' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Số tiền thực nhận</small>
                <strong style={{ fontSize: '18px', color: '#10b981' }}>${viewingTxn.net.toFixed(2)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
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
              Bạn có chắc chắn muốn phát lệnh hoàn trả số tiền <strong>${refundingTxn.amount.toFixed(2)}</strong> cho giao dịch <strong>{refundingTxn.id}</strong> của khách hàng <strong>{refundingTxn.customer}</strong> qua cổng {refundingTxn.gateway} không?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="secondary-button" onClick={() => setRefundingTxn(null)}>
                Hủy bỏ
              </button>
              <button 
                type="button" 
                className="primary-button" 
                style={{ background: '#b23b3b', borderColor: '#b23b3b' }}
                onClick={handleConfirmRefund}
              >
                Xác nhận hoàn tiền
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
