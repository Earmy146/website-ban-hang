import React, { useState, useMemo } from 'react';
import StockHeading from '../../../components/commerce/inventory/StockHeading';
import StockSummaryCards from '../../../components/commerce/inventory/StockSummaryCards';
import StockToolbar from '../../../components/commerce/inventory/StockToolbar';
import StockTable from '../../../components/commerce/inventory/StockTable';
import DialogModal from '../../../components/ui/DialogModal';
import { initialStock } from '../../../data/mockStock';

export default function StockPage() {
  const [stock, setStock] = useState(initialStock);
  const [selectedIds, setSelectedIds] = useState([]);

  // Bộ lọc
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [adjustingItem, setAdjustingItem] = useState(null);

  // Form Chuyển kho
  const [transferData, setTransferData] = useState({
    sku: 'VX-1001',
    fromLoc: 'NY',
    toLoc: 'CA',
    quantity: 10
  });

  // Form Nhập thêm hàng
  const [receiveData, setReceiveData] = useState({
    sku: 'VX-1001',
    quantity: 50,
    targetLoc: 'NY'
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
  const filteredStock = useMemo(() => {
    return stock.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchSku = s.sku.toLowerCase().includes(q);
        const matchCat = s.category.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchCat) return false;
      }
      return true;
    });
  }, [stock, statusFilter, categoryFilter, searchQuery]);

  // Checkbox handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredStock.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkTransfer = () => {
    showToast(`Đã mở lệnh điều chuyển kho cho ${selectedIds.length} mặt hàng!`);
    setSelectedIds([]);
  };

  // Xuất file CSV
  const handleExport = () => {
    const headers = ['Sản phẩm', 'Mã SKU', 'Danh mục', 'Sẵn có', 'Đã đặt', 'Đang về', 'Khả dụng', 'Ngưỡng đặt', 'Kho NY', 'Kho CA', 'Kho TX', 'Tình trạng'];
    const rows = filteredStock.map(s => [
      `"${s.name}"`,
      `"${s.sku}"`,
      `"${s.category}"`,
      s.onHand,
      s.committed,
      s.incoming,
      s.available,
      s.reorderPoint,
      s.locationNY,
      s.locationCA,
      s.locationTX,
      `"${s.status}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ton_kho_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file dữ liệu tồn kho thành công!');
  };

  // Thực hiện chuyển kho
  const handleExecuteTransfer = (e) => {
    e.preventDefault();
    const qty = parseInt(transferData.quantity, 10) || 0;
    if (qty <= 0) {
      showToast('Số lượng điều chuyển phải lớn hơn 0!', 'error');
      return;
    }
    if (transferData.fromLoc === transferData.toLoc) {
      showToast('Kho xuất và kho nhận không được trùng nhau!', 'error');
      return;
    }

    setStock(prev => prev.map(s => {
      if (s.sku === transferData.sku) {
        const fromKey = transferData.fromLoc === 'NY' ? 'locationNY' : transferData.fromLoc === 'CA' ? 'locationCA' : 'locationTX';
        const toKey = transferData.toLoc === 'NY' ? 'locationNY' : transferData.toLoc === 'CA' ? 'locationCA' : 'locationTX';
        return {
          ...s,
          [fromKey]: Math.max(0, s[fromKey] - qty),
          [toKey]: s[toKey] + qty
        };
      }
      return s;
    }));

    setIsTransferModalOpen(false);
    showToast(`Đã điều chuyển ${qty} đơn vị SKU ${transferData.sku} từ kho ${transferData.fromLoc} sang kho ${transferData.toLoc}!`);
  };

  // Thực hiện nhập thêm hàng
  const handleExecuteReceive = (e) => {
    e.preventDefault();
    const qty = parseInt(receiveData.quantity, 10) || 0;
    if (qty <= 0) {
      showToast('Số lượng nhập hàng phải lớn hơn 0!', 'error');
      return;
    }

    setStock(prev => prev.map(s => {
      if (s.sku === receiveData.sku) {
        const locKey = receiveData.targetLoc === 'NY' ? 'locationNY' : receiveData.targetLoc === 'CA' ? 'locationCA' : 'locationTX';
        const newOnHand = s.onHand + qty;
        const newAvailable = s.available + qty;
        return {
          ...s,
          onHand: newOnHand,
          available: newAvailable,
          [locKey]: s[locKey] + qty,
          status: newAvailable > s.reorderPoint ? 'Healthy' : 'Low'
        };
      }
      return s;
    }));

    setIsReceiveModalOpen(false);
    showToast(`Đã nhập thêm ${qty} đơn vị SKU ${receiveData.sku} vào kho ${receiveData.targetLoc}!`);
  };

  // Lưu điều chỉnh số lượng
  const handleSaveAdjust = (e) => {
    e.preventDefault();
    if (!adjustingItem) return;
    const newAvail = Math.max(0, adjustingItem.onHand - adjustingItem.committed);
    const updated = {
      ...adjustingItem,
      available: newAvail,
      status: newAvail === 0 ? 'Out' : newAvail <= adjustingItem.reorderPoint ? 'Low' : 'Healthy'
    };
    setStock(prev => prev.map(s => s.id === updated.id ? updated : s));
    setAdjustingItem(null);
    showToast(`Đã điều chỉnh tồn kho cho ${updated.name}!`);
  };

  return (
    <div className="stock-page" style={{ paddingBottom: '32px' }}>
      <StockHeading 
        onExport={handleExport}
        onTransfer={() => setIsTransferModalOpen(true)}
        onReceiveStock={() => setIsReceiveModalOpen(true)}
      />

      <StockSummaryCards stock={stock} />

      <StockToolbar 
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <StockTable 
        stock={filteredStock}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onBulkTransfer={handleBulkTransfer}
        onClearSelection={handleClearSelection}
        onViewItem={setViewingItem}
        onAdjustStock={setAdjustingItem}
        onTransferItem={(item) => {
          setTransferData({ ...transferData, sku: item.sku });
          setIsTransferModalOpen(true);
        }}
      />

      {/* Modal: Chuyển kho */}
      <DialogModal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)}
        title="Lập lệnh chuyển kho nội bộ"
      >
        <form onSubmit={handleExecuteTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Chọn sản phẩm (Mã SKU)
            </label>
            <select 
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={transferData.sku}
              onChange={e => setTransferData({ ...transferData, sku: e.target.value })}
            >
              {stock.map(s => (
                <option key={s.id} value={s.sku}>
                  {s.sku} - {s.name} (Sẵn có: {s.onHand})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Kho xuất
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={transferData.fromLoc}
                onChange={e => setTransferData({ ...transferData, fromLoc: e.target.value })}
              >
                <option value="NY">Kho Miền Bắc (NY)</option>
                <option value="CA">Kho Miền Trung (CA)</option>
                <option value="TX">Kho Miền Nam (TX)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Kho nhận
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={transferData.toLoc}
                onChange={e => setTransferData({ ...transferData, toLoc: e.target.value })}
              >
                <option value="CA">Kho Miền Trung (CA)</option>
                <option value="NY">Kho Miền Bắc (NY)</option>
                <option value="TX">Kho Miền Nam (TX)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Số lượng điều chuyển *
            </label>
            <input 
              type="number" 
              required
              min="1"
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={transferData.quantity}
              onChange={e => setTransferData({ ...transferData, quantity: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button 
              type="button" 
              className="secondary-button"
              onClick={() => setIsTransferModalOpen(false)}
            >
              Hủy
            </button>
            <button type="submit" className="primary-button">
              Xác nhận chuyển kho
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Nhập thêm hàng */}
      <DialogModal 
        isOpen={isReceiveModalOpen} 
        onClose={() => setIsReceiveModalOpen(false)}
        title="Nhập thêm hàng vào kho"
      >
        <form onSubmit={handleExecuteReceive} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
              Sản phẩm nhập kho
            </label>
            <select 
              className="c-field"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
              value={receiveData.sku}
              onChange={e => setReceiveData({ ...receiveData, sku: e.target.value })}
            >
              {stock.map(s => (
                <option key={s.id} value={s.sku}>
                  {s.sku} - {s.name} (Hiện tại: {s.onHand})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Kho lưu trữ
              </label>
              <select 
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={receiveData.targetLoc}
                onChange={e => setReceiveData({ ...receiveData, targetLoc: e.target.value })}
              >
                <option value="NY">Kho Miền Bắc (NY)</option>
                <option value="CA">Kho Miền Trung (CA)</option>
                <option value="TX">Kho Miền Nam (TX)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Số lượng nhập thêm *
              </label>
              <input 
                type="number" 
                required
                min="1"
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={receiveData.quantity}
                onChange={e => setReceiveData({ ...receiveData, quantity: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button 
              type="button" 
              className="secondary-button"
              onClick={() => setIsReceiveModalOpen(false)}
            >
              Hủy
            </button>
            <button type="submit" className="primary-button">
              Lưu phiếu nhập kho
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Modal: Xem chi tiết tồn kho */}
      <DialogModal 
        isOpen={Boolean(viewingItem)} 
        onClose={() => setViewingItem(null)}
        title={viewingItem ? `Chi tiết tồn kho: ${viewingItem.name}` : ''}
        wide={true}
      >
        {viewingItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '14px', color: '#3c352a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', background: '#f5efe4', borderRadius: '12px' }}>
              <div>
                <strong>Mã SKU:</strong> {viewingItem.sku} | <strong>Danh mục:</strong> {viewingItem.category}
              </div>
              <div>
                <strong>Thương hiệu:</strong> {viewingItem.brand}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', textAlign: 'center' }}>
              <div style={{ padding: '12px', background: '#fff', borderRadius: '10px', border: '1px solid #ebdccb' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Hàng sẵn có</small>
                <strong style={{ fontSize: '20px' }}>{viewingItem.onHand}</strong>
              </div>
              <div style={{ padding: '12px', background: '#fff', borderRadius: '10px', border: '1px solid #ebdccb' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Đã giữ cho đơn</small>
                <strong style={{ fontSize: '20px', color: '#b23b3b' }}>{viewingItem.committed}</strong>
              </div>
              <div style={{ padding: '12px', background: '#fff', borderRadius: '10px', border: '1px solid #ebdccb' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Đang nhập về</small>
                <strong style={{ fontSize: '20px', color: '#2b6e41' }}>{viewingItem.incoming}</strong>
              </div>
              <div style={{ padding: '12px', background: '#fff', borderRadius: '10px', border: '1px solid #ebdccb' }}>
                <small style={{ color: '#776c5b', display: 'block' }}>Có thể bán ngay</small>
                <strong style={{ fontSize: '20px', color: '#1f5f3e' }}>{viewingItem.available}</strong>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #e2d9cd', paddingTop: '14px' }}>
              <strong>Phân bổ theo vị trí kho:</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '10px' }}>
                <div style={{ padding: '12px', background: '#faf6ee', borderRadius: '8px' }}>
                  <strong>Kho Miền Bắc (NY):</strong> {viewingItem.locationNY} đơn vị
                </div>
                <div style={{ padding: '12px', background: '#faf6ee', borderRadius: '8px' }}>
                  <strong>Kho Miền Trung (CA):</strong> {viewingItem.locationCA} đơn vị
                </div>
                <div style={{ padding: '12px', background: '#faf6ee', borderRadius: '8px' }}>
                  <strong>Kho Miền Nam (TX):</strong> {viewingItem.locationTX} đơn vị
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                className="secondary-button"
                onClick={() => setViewingItem(null)}
              >
                Đóng
              </button>
              <button 
                type="button" 
                className="primary-button"
                onClick={() => {
                  setAdjustingItem(viewingItem);
                  setViewingItem(null);
                }}
              >
                Điều chỉnh số lượng
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* Modal: Điều chỉnh số lượng */}
      <DialogModal 
        isOpen={Boolean(adjustingItem)} 
        onClose={() => setAdjustingItem(null)}
        title={adjustingItem ? `Điều chỉnh tồn kho: ${adjustingItem.name}` : ''}
      >
        {adjustingItem && (
          <form onSubmit={handleSaveAdjust} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Số lượng sẵn có (On Hand)
              </label>
              <input 
                type="number" 
                required
                min="0"
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={adjustingItem.onHand}
                onChange={e => setAdjustingItem({ ...adjustingItem, onHand: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                Ngưỡng cảnh báo đặt hàng (Reorder Point)
              </label>
              <input 
                type="number" 
                required
                min="0"
                className="c-field"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4c8b8' }}
                value={adjustingItem.reorderPoint}
                onChange={e => setAdjustingItem({ ...adjustingItem, reorderPoint: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button 
                type="button" 
                className="secondary-button"
                onClick={() => setAdjustingItem(null)}
              >
                Hủy
              </button>
              <button type="submit" className="primary-button">
                Lưu số lượng mới
              </button>
            </div>
          </form>
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
