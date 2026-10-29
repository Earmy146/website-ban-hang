import React, { useState } from 'react';
import StockRowMenu from './StockRowMenu';

export default function StockTable({
  stock,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onBulkTransfer,
  onClearSelection,
  onViewItem,
  onAdjustStock,
  onTransferItem
}) {
  const [sortField, setSortField] = useState('available');
  const [sortAsc, setSortAsc] = useState(false);

  const isAllSelected = stock.length > 0 && selectedIds.length === stock.length;

  const sortedStock = [...stock].sort((a, b) => {
    if (sortField === 'available') {
      return sortAsc ? a.available - b.available : b.available - a.available;
    }
    if (sortField === 'onHand') {
      return sortAsc ? a.onHand - b.onHand : b.onHand - a.onHand;
    }
    if (sortField === 'name') {
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    if (sortField === 'sku') {
      return sortAsc ? a.sku.localeCompare(b.sku) : b.sku.localeCompare(a.sku);
    }
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Healthy':
        return <span className="inventory-status green"><i></i>Kho ổn định</span>;
      case 'Low':
        return <span className="inventory-status amber"><i></i>Cảnh báo sắp hết</span>;
      case 'Out':
        return <span className="inventory-status red"><i></i>Hết hàng</span>;
      default:
        return <span className="inventory-status"><i></i>{status}</span>;
    }
  };

  return (
    <section className="glass-card c-resource inventory-resource">
      <div className="inventory-list-heading">
        <div>
          <span>KIỂM SOÁT TỒN KHO</span>
          <h2>Tồn kho & Khả dụng</h2>
          <p>Theo dõi hàng sẵn có, hàng giữ cho đơn và hàng đang nhập từ nhà cung cấp.</p>
        </div>
        <small>{stock.length} sản phẩm phù hợp</small>
      </div>

      <div id="resource-results">
        {selectedIds.length > 0 && (
          <div className="c-selection">
            <strong>{selectedIds.length} đã chọn</strong>
            <button 
              type="button" 
              className="secondary-button" 
              onClick={onBulkTransfer}
            >
              Chuyển kho hàng loạt
            </button>
            <button 
              type="button" 
              className="secondary-button" 
              onClick={onClearSelection}
            >
              Bỏ chọn
            </button>
          </div>
        )}

        <div className="table-scroll inventory-table-scroll" tabIndex="0" role="region" aria-label="Bảng tồn kho">
          <table className="c-table inventory-table">
            <thead>
              <tr>
                <th scope="col" className="c-check">
                  <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    onChange={e => onSelectAll(e.target.checked)}
                    aria-label="Chọn tất cả tồn kho"
                  />
                </th>
                <th scope="col">
                  <button type="button" onClick={() => handleSort('name')} className="sort-trigger">
                    Sản phẩm
                  </button>
                </th>
                <th scope="col">
                  <button type="button" onClick={() => handleSort('sku')} className="sort-trigger">
                    Mã SKU
                  </button>
                </th>
                <th scope="col">
                  <button type="button" onClick={() => handleSort('onHand')} className="sort-trigger">
                    SẴN CÓ
                  </button>
                </th>
                <th scope="col">ĐÃ ĐẶT</th>
                <th scope="col">ĐANG VỀ</th>
                <th scope="col">
                  <button type="button" onClick={() => handleSort('available')} className="sort-trigger">
                    KHẢ DỤNG
                  </button>
                </th>
                <th scope="col">ĐIỂM ĐẶT</th>
                <th scope="col">VỊ TRÍ KHO</th>
                <th scope="col">TÌNH TRẠNG</th>
                <th scope="col"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>

            <tbody>
              {sortedStock.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px 20px', color: '#776c5b' }}>
                    Không tìm thấy sản phẩm tồn kho nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                sortedStock.map((s) => {
                  const isChecked = selectedIds.includes(s.id);
                  return (
                    <tr key={s.id} className={isChecked ? 'selected' : ''}>
                      <td className="c-check">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => onToggleSelect(s.id)}
                          aria-label={`Chọn kho sản phẩm ${s.name}`}
                        />
                      </td>

                      <td>
                        <button 
                          type="button" 
                          className="c-record-name inventory-product-name"
                          onClick={() => onViewItem(s)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                        >
                          <span className="product-thumb product-static-image" aria-hidden="true">
                            <span style={{ fontSize: '18px' }}>📦</span>
                          </span>
                          <span>
                            <strong>{s.name}</strong>
                            <small>{s.category} · {s.brand}</small>
                          </span>
                        </button>
                      </td>

                      <td>
                        <span className="product-mono">{s.sku}</span>
                      </td>

                      <td>
                        <span className="inventory-quantity">
                          <strong>{s.onHand}</strong>
                          <small>món</small>
                        </span>
                      </td>

                      <td>
                        <span className="inventory-quantity reserved">
                          <strong>{s.committed}</strong>
                          <small>món</small>
                        </span>
                      </td>

                      <td>
                        <span className="inventory-quantity">
                          <strong>{s.incoming}</strong>
                          <small>món</small>
                        </span>
                      </td>

                      <td>
                        <span className="inventory-quantity sellable">
                          <strong>{s.available}</strong>
                          <small>món</small>
                        </span>
                      </td>

                      <td>
                        <span className="inventory-threshold">{s.reorderPoint}</span>
                      </td>

                      <td>
                        <div className="inventory-locations">
                          <span title="Kho Miền Bắc NY">
                            <strong>NY</strong>
                            <small>{s.locationNY}</small>
                          </span>
                          <span title="Kho Miền Trung CA">
                            <strong>CA</strong>
                            <small>{s.locationCA}</small>
                          </span>
                          <span title="Kho Miền Nam TX">
                            <strong>TX</strong>
                            <small>{s.locationTX}</small>
                          </span>
                        </div>
                      </td>

                      <td>
                        {getStatusBadge(s.status)}
                      </td>

                      <td className="inventory-actions-cell">
                        <StockRowMenu 
                          item={s}
                          onViewItem={onViewItem}
                          onAdjustStock={onAdjustStock}
                          onTransferItem={onTransferItem}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
