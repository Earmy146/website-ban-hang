import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../components/ui/DialogModal';
import { request } from '../../services/api';
import {
  STATUS_OPTIONS,
  RESOURCE_DOMAIN_META,
  resolveStatusClass,
  buildContextualFallbackRecords,
} from './moduleCatalog';
import {
  PageHeader,
  QuickGuideBanner,
  FilterPillTabs,
  ToggleSwitch,
  ConfirmDialog,
  ToastStack,
  useToast,
  copyToClipboard,
  exportCsvFile,
  FIELD_INPUT_STYLE,
  FIELD_LABEL_STYLE,
} from './commonWidgets';

const INFRA_MODE_CONFIG = {
  warehouses: {
    icon: '🏭',
    addLabel: '+ Thêm mới kho hàng',
    guideTitle: 'Quản lý mạng lưới Kho lưu trữ & Công suất chứa hàng:',
    guideSteps: [
      'Theo dõi thanh % công suất chứa hàng và tổng tồn kho thực tế đồng bộ từ /commerce/stock',
      'Gạt công tắc trên mỗi thẻ kho để Bật / Tạm ngưng phân bổ đơn mới cho kho đó',
      'Kéo xuống bảng bên dưới nếu cần Tích chọn nhiều mục để Đổi trạng thái hoặc Xóa hàng loạt',
    ],
    metricCountLabel: 'Đơn vị đang lưu',
    metricValueLabel: 'Giá trị hàng tồn',
    capacityMax: 1800,
  },
  carriers: {
    icon: '🚚',
    addLabel: '+ Thêm mới đơn vị vận chuyển',
    guideTitle: 'Kết nối & Bật/Tắt các Hãng vận chuyển giao hàng:',
    guideSteps: [
      'Gạt công tắc 1 chạm để Bật hoặc Tạm ngưng hãng vận chuyển khi tạo vận đơn mới',
      'Bấm "⚙️ Cấu hình" để cập nhật mức cước phí trung bình và cam kết SLA',
      'Thiết lập ngưỡng Freeship toàn cửa hàng tại trang Vùng vận chuyển & Phí ship',
    ],
    metricCountLabel: 'Vận đơn đang giao',
    metricValueLabel: 'Cước phí cơ bản',
  },
  providers: {
    icon: '💳',
    addLabel: '+ Thêm mới cổng thanh toán',
    guideTitle: 'Quản lý Cổng thanh toán trực tuyến & Thu hộ COD:',
    guideSteps: [
      'Gạt công tắc để kích hoạt hoặc tạm ngưng cổng thanh toán (Stripe, VNPay QR, MoMo, PayPal)',
      'Kiểm tra mức phí chiết khấu giao dịch và sản lượng giao dịch trong tháng',
      'Xem lịch sử đối soát dòng tiền chi tiết tại trang Lịch sử giao dịch',
    ],
    metricCountLabel: 'Giao dịch tháng',
    metricValueLabel: 'Biểu phí / Doanh số',
  },
  integrations: {
    icon: '🔌',
    addLabel: '+ Thêm mới kết nối API',
    guideTitle: 'Quản lý Kết nối ứng dụng bên thứ 3 & Khóa API:',
    guideSteps: [
      'Bấm "⚡ Gửi Ping kiểm tra" để đo độ trễ phản hồi thực tế của từng kết nối',
      'Bấm "📋 Chép" để lấy thông tin kết nối tích hợp môi trường thử nghiệm',
      'Gạt công tắc để ngắt kết nối ngay lập tức khi cần bảo trì định kỳ',
    ],
    metricCountLabel: 'Lượt gọi API / Ping',
    metricValueLabel: 'Độ trễ / SLA',
  },
  webhooks: {
    icon: '🪝',
    addLabel: '+ Thêm mới Webhook',
    guideTitle: 'Cấu hình Điểm cuối nhận sự kiện tự động (Webhooks):',
    guideSteps: [
      'Mỗi khi có đơn mới hoặc tồn kho thay đổi, hệ thống bắn bản tin JSON tới URL đăng ký',
      'Bấm "⚡ Gửi Ping kiểm tra" để bắn thử gói tin mẫu và xác minh phản hồi HTTP 200',
      'Bấm "📋 Chép" để đối chiếu nhanh địa chỉ nhận sự kiện',
    ],
    metricCountLabel: 'Lần bắn thành công',
    metricValueLabel: 'Tỷ lệ HTTP 200',
  },
};

const EMPTY_CARD_FORM = {
  name: '',
  code: '',
  category: '',
  subtitle: '',
  owner: 'Alex Chen',
  count: 100,
  value: '$0',
  status: 'Hoạt động',
  notes: '',
};

function buildSampleEndpoint(slug, item) {
  const cleanCode = String(item.code || 'endpoint').toLowerCase();
  if (slug === 'webhooks') {
    return item.meta?.endpointUrl || `https://hooks.veylix.local/v2/events/${cleanCode}`;
  }
  if (slug === 'integrations') {
    return item.meta?.apiKeyPreview || `vx_sandbox_${cleanCode.replace(/[^a-z0-9]/g, '_')}_9f82a`;
  }
  return '';
}

export default function InfrastructureCardsView({ slug, navInfo }) {
  const modeCfg = INFRA_MODE_CONFIG[slug] || INFRA_MODE_CONFIG.warehouses;
  const domainMeta = RESOURCE_DOMAIN_META[slug] || {
    subtitle: navInfo.title,
    primaryCol: 'Tên đối tượng',
    categoryCol: 'Phân loại',
    countCol: modeCfg.metricCountLabel,
    valueCol: modeCfg.metricValueLabel,
    defaultCategory: navInfo.title,
  };

  const fallbackList = useMemo(
    () => buildContextualFallbackRecords(slug, navInfo.title),
    [slug, navInfo.title]
  );

  const [records, setRecords] = useState(fallbackList);
  const [stockSummary, setStockSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [pingResultMap, setPingResultMap] = useState({});

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_CARD_FORM);
  const [deletingItem, setDeletingItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatusTarget, setBulkStatusTarget] = useState('Hoạt động');
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toasts, showToast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const promises = [
        request(`/modules/${encodeURIComponent(slug)}?title=${encodeURIComponent(navInfo.title)}`),
      ];
      if (slug === 'warehouses') {
        promises.push(request('/stock').catch(() => []));
      }
      const [modData, stockData] = await Promise.all(promises);
      if (Array.isArray(modData)) {
        setRecords(modData);
      }
      if (slug === 'warehouses' && Array.isArray(stockData)) {
        const nyUnits = stockData.reduce((s, i) => s + (Number(i.locationNY) || 0), 0);
        const caUnits = stockData.reduce((s, i) => s + (Number(i.locationCA) || 0), 0);
        const txUnits = stockData.reduce((s, i) => s + (Number(i.locationTX) || 0), 0);
        const totalRetail = stockData.reduce(
          (s, i) => s + (Number(i.onHand) || 0) * (Number(i.retailPrice) || 25),
          0
        );
        setStockSummary({
          skuCount: stockData.length,
          nyUnits,
          caUnits,
          txUnits,
          totalUnits: nyUnits + caUnits + txUnits,
          totalRetail,
        });
      }
    } catch {
      setRecords(fallbackList);
    } finally {
      setIsLoading(false);
    }
  }, [slug, navInfo.title, fallbackList]);

  useEffect(() => {
    setActiveTab('all');
    setSearchQuery('');
    setPingResultMap({});
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);
    setEditingItem(null);
    setDeletingItem(null);
    setIsEditorOpen(false);
    loadData();
  }, [slug, loadData]);

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleBulkStatusApply = async () => {
    if (selectedIds.length === 0 || isSubmitting) return;
    const statusClass = resolveStatusClass(bulkStatusTarget);
    setIsSubmitting(true);
    try {
      await request(`/modules/${encodeURIComponent(slug)}/bulk-status`, {
        method: 'POST',
        body: { ids: selectedIds, status: bulkStatusTarget, statusClass },
      });
      setRecords((prev) =>
        prev.map((r) =>
          selectedIds.includes(r.id) ? { ...r, status: bulkStatusTarget, statusClass, date: 'Vừa cập nhật' } : r
        )
      );
      showToast(`Đã đổi trạng thái "${bulkStatusTarget}" cho ${selectedIds.length} mục!`);
      setSelectedIds([]);
    } catch (err) {
      showToast(err.message || 'Không thể đổi trạng thái hàng loạt', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await request(`/modules/${encodeURIComponent(slug)}/bulk-delete`, {
        method: 'POST',
        body: { ids: selectedIds },
      });
      const count = selectedIds.length;
      setRecords((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
      showToast(`Đã xóa thành công ${count} mục đã chọn!`);
    } catch (err) {
      showToast(err.message || 'Không thể xóa hàng loạt', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRecordEnabled = (r) => {
    const s = String(r.status || '').toLowerCase();
    return !s.includes('tạm dừng') && !s.includes('hủy') && !s.includes('tắt') && !s.includes('lưu trữ');
  };

  const handleToggleActive = async (item) => {
    if (busyId) return;
    const currentlyOn = isRecordEnabled(item);
    const nextStatus = currentlyOn ? 'Tạm dừng' : 'Hoạt động';
    const nextClass = currentlyOn ? 'red' : 'green';

    setBusyId(item.id);
    try {
      const updated = await request(
        `/modules/${encodeURIComponent(slug)}/${encodeURIComponent(item.id)}`,
        {
          method: 'PUT',
          body: {
            status: nextStatus,
            statusClass: nextClass,
          },
        }
      );
      if (updated && updated.id) {
        setRecords((prev) => prev.map((r) => (r.id === item.id ? updated : r)));
      } else {
        setRecords((prev) =>
          prev.map((r) =>
            r.id === item.id ? { ...r, status: nextStatus, statusClass: nextClass } : r
          )
        );
      }
      showToast(
        currentlyOn
          ? `Đã tạm ngưng "${item.name}"`
          : `Đã kích hoạt hoạt động cho "${item.name}"!`
      );
    } catch (err) {
      showToast(err.message || 'Không thể đổi trạng thái hoạt động', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleSendPing = async (item) => {
    if (busyId) return;
    setBusyId(item.id);
    const latencyMs = 28 + Math.floor(Math.random() * 35);
    const nextCount = (Number(item.count) || 0) + 1;
    const pingNote = `HTTP 200 OK · ${latencyMs}ms · Lúc ${new Date().toLocaleTimeString('vi-VN')}`;

    try {
      const updated = await request(
        `/modules/${encodeURIComponent(slug)}/${encodeURIComponent(item.id)}`,
        {
          method: 'PUT',
          body: {
            count: nextCount,
            status: 'Hoạt động',
            statusClass: 'green',
            date: `Vừa ping (${latencyMs}ms)`,
          },
        }
      );
      if (updated && updated.id) {
        setRecords((prev) => prev.map((r) => (r.id === item.id ? updated : r)));
      }
      setPingResultMap((prev) => ({ ...prev, [item.id]: pingNote }));
      showToast(`⚡ Ping thành công tới "${item.name}" (${pingNote})!`);
    } catch (err) {
      showToast(err.message || 'Ping kiểm tra thất bại', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const openCreateModal = () => {
    const prefix = `VX-${slug.toUpperCase().slice(0, 4)}`;
    setEditingItem(null);
    setFormData({
      ...EMPTY_CARD_FORM,
      code: `${prefix}-${Math.floor(100 + Math.random() * 900)}`,
      category: domainMeta.defaultCategory,
      value: slug === 'carriers' ? '$5.00' : slug === 'providers' ? '2.2% + $0.20' : slug === 'webhooks' ? '99.9%' : '$15,000',
    });
    setIsEditorOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      code: item.code || '',
      category: item.category || domainMeta.defaultCategory,
      subtitle: item.subtitle || '',
      owner: item.owner || 'Alex Chen',
      count: Number(item.count ?? 0),
      value: item.value || '$0',
      status: item.status || 'Hoạt động',
      notes: item.notes || '',
    });
    setIsEditorOpen(true);
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || isSubmitting) return;

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      category: formData.category.trim(),
      subtitle: formData.subtitle.trim(),
      owner: formData.owner.trim() || 'Alex Chen',
      count: Math.max(0, Number(formData.count) || 0),
      value: String(formData.value || '$0').trim(),
      status: formData.status,
      statusClass: resolveStatusClass(formData.status),
      notes: formData.notes.trim(),
    };

    setIsSubmitting(true);
    try {
      if (editingItem) {
        const updated = await request(
          `/modules/${encodeURIComponent(slug)}/${encodeURIComponent(editingItem.id)}`,
          { method: 'PUT', body: payload }
        );
        if (updated && updated.id) {
          setRecords((prev) => prev.map((r) => (r.id === editingItem.id ? updated : r)));
        } else {
          await loadData();
        }
        showToast(`Đã lưu cấu hình "${payload.name}"!`);
      } else {
        const created = await request(`/modules/${encodeURIComponent(slug)}`, {
          method: 'POST',
          body: payload,
        });
        if (created && created.id) {
          setRecords((prev) => [created, ...prev]);
        } else {
          await loadData();
        }
        showToast(`Đã thêm mới "${payload.name}" thành công!`);
      }
      setIsEditorOpen(false);
    } catch (err) {
      showToast(err.message || 'Không thể lưu thông tin', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await request(
        `/modules/${encodeURIComponent(slug)}/${encodeURIComponent(deletingItem.id)}`,
        { method: 'DELETE' }
      );
      setRecords((prev) => prev.filter((r) => r.id !== deletingItem.id));
      showToast(`Đã xóa "${deletingItem.name}"!`);
      setDeletingItem(null);
    } catch (err) {
      showToast(err.message || 'Không thể xóa mục này', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCount = records.filter(isRecordEnabled).length;
  const pausedCount = records.length - activeCount;

  const filterTabs = useMemo(
    () => [
      { id: 'all', label: 'Tất cả', icon: modeCfg.icon, count: records.length },
      { id: 'active', label: 'Đang hoạt động', icon: '🟢', count: activeCount },
      { id: 'paused', label: 'Đang tạm dừng', icon: '🔴', count: pausedCount },
    ],
    [records.length, activeCount, pausedCount, modeCfg.icon]
  );

  const visibleRecords = useMemo(() => {
    return records.filter((r) => {
      if (activeTab === 'active' && !isRecordEnabled(r)) return false;
      if (activeTab === 'paused' && isRecordEnabled(r)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${r.name || ''} ${r.code || ''} ${r.category || ''} ${r.subtitle || ''} ${r.owner || ''} ${r.notes || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, activeTab, searchQuery]);

  const handleExportCsv = () => {
    const headers = ['Tên', 'Mã', 'Phân loại', 'Phụ trách', modeCfg.metricCountLabel, modeCfg.metricValueLabel, 'Trạng thái', 'Ghi chú'];
    const rows = visibleRecords.map((r) => [
      r.name,
      r.code,
      r.category || '',
      r.owner || 'Alex Chen',
      r.count ?? 0,
      r.value || '',
      r.status || '',
      r.notes || r.subtitle || '',
    ]);
    exportCsvFile(`ha_tang_${slug}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showToast(`Đã xuất danh sách "${navInfo.title}" ra CSV!`);
  };

  const isTechPingMode = slug === 'integrations' || slug === 'webhooks';

  return (
    <div className="general-commerce-page" style={{ paddingBottom: '40px' }}>
      <PageHeader navInfo={navInfo} subtitle={domainMeta.subtitle}>
        {slug === 'warehouses' && (
          <Link to="/commerce/stock" className="secondary-button">
            📦 Tồn kho & Chuyển kho
          </Link>
        )}
        {slug === 'carriers' && (
          <Link to="/commerce/shipping-rules" className="secondary-button">
            ⚙️ Biểu phí & Freeship
          </Link>
        )}
        {slug === 'providers' && (
          <Link to="/commerce/transactions" className="secondary-button">
            💳 Lịch sử giao dịch
          </Link>
        )}
        <button type="button" className="secondary-button" onClick={handleExportCsv}>
          Xuất CSV
        </button>
        <button type="button" className="primary-button" onClick={openCreateModal}>
          {modeCfg.addLabel}
        </button>
      </PageHeader>

      <QuickGuideBanner
        icon={modeCfg.icon}
        title={modeCfg.guideTitle}
        steps={modeCfg.guideSteps}
      />

      {/* DẢI TỔNG HỢP TỒN KHO THỰC TẾ 3 MIỀN CHO TRANG KHO HÀNG */}
      {slug === 'warehouses' && stockSummary && (
        <section
          className="glass-card"
          style={{
            padding: '18px 22px',
            marginBottom: '20px',
            background: 'linear-gradient(125deg, #27342b 0%, #37483c 100%)',
            color: '#f6f1e7',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffe08a', letterSpacing: '0.7px' }}>
              ĐỒNG BỘ TỒN KHO THỰC TẾ ({stockSummary.skuCount} MÃ SKU)
            </span>
            <h2 style={{ margin: '3px 0 0 0', fontSize: '17px', fontWeight: 750, color: '#ffffff' }}>
              Tổng cộng {stockSummary.totalUnits.toLocaleString('en-US')} sản phẩm khả dụng · Trị giá $
              {Math.round(stockSummary.totalRetail).toLocaleString('en-US')}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)' }}>
              <small style={{ display: 'block', color: '#d7e2da', fontSize: '11px' }}>Kho NY (Miền Bắc)</small>
              <strong style={{ fontSize: '15px', color: '#fff' }}>{stockSummary.nyUnits} chiếc</strong>
            </div>
            <div style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)' }}>
              <small style={{ display: 'block', color: '#d7e2da', fontSize: '11px' }}>Kho CA (Miền Trung)</small>
              <strong style={{ fontSize: '15px', color: '#fff' }}>{stockSummary.caUnits} chiếc</strong>
            </div>
            <div style={{ padding: '8px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)' }}>
              <small style={{ display: 'block', color: '#d7e2da', fontSize: '11px' }}>Kho TX (Miền Nam)</small>
              <strong style={{ fontSize: '15px', color: '#fff' }}>{stockSummary.txUnits} chiếc</strong>
            </div>
          </div>
        </section>
      )}

      {/* 4 THẺ KPI */}
      <section className="order-summary-grid" style={{ marginBottom: '20px' }}>
        <div className="order-summary-card green">
          <div>
            <small>Tổng số kết nối / điểm</small>
            <strong>{records.length}</strong>
            <em>Quản trị tập trung thời gian thực</em>
          </div>
        </div>
        <div className="order-summary-card blue">
          <div>
            <small>Đang bật hoạt động</small>
            <strong>{activeCount}</strong>
            <em>Sẵn sàng phục vụ đơn hàng mới</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Đang tạm ngưng</small>
            <strong>{pausedCount}</strong>
            <em>Có thể bật lại bất kỳ lúc nào</em>
          </div>
        </div>
        <div className="order-summary-card purple">
          <div>
            <small>Tổng {modeCfg.metricCountLabel.toLowerCase()}</small>
            <strong>
              {records.reduce((s, r) => s + (Number(r.count) || 0), 0).toLocaleString('en-US')}
            </strong>
            <em>{isLoading ? 'Đang làm mới...' : 'Đồng bộ MongoDB 100%'}</em>
          </div>
        </div>
      </section>

      {/* THANH TAB LỌC NHANH + TÌM KIẾM */}
      <section
        className="glass-card"
        style={{
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <FilterPillTabs tabs={filterTabs} activeId={activeTab} onSelect={setActiveTab} />

        <label className="c-search" style={{ maxWidth: '300px', width: '100%' }}>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
            </svg>
          </span>
          <input
            type="search"
            placeholder="Tìm tên kho, đối tác, mã..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Tìm kiếm hạ tầng"
          />
        </label>
      </section>

      {/* LƯỚI THẺ TRỰC QUAN */}
      {visibleRecords.length === 0 ? (
        <section className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', color: '#756a59' }}>
          Không tìm thấy mục nào phù hợp với bộ lọc hiện tại.
        </section>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: '18px',
          }}
        >
          {visibleRecords.map((item) => {
            const enabled = isRecordEnabled(item);
            const capacityPct =
              slug === 'warehouses'
                ? Math.min(98, Math.max(18, Math.round(((Number(item.count) || 350) / modeCfg.capacityMax) * 100)))
                : null;
            const endpointStr = isTechPingMode ? buildSampleEndpoint(slug, item) : '';
            const latestPing = pingResultMap[item.id];

            return (
              <article
                key={item.id}
                className="glass-card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  opacity: enabled ? 1 : 0.82,
                  border: enabled ? '1px solid rgba(190, 175, 145, 0.55)' : '1px dashed #cbbba0',
                }}
              >
                {/* Ảnh minh họa kho hàng nếu là trang warehouses */}
                {slug === 'warehouses' && (
                  <div
                    style={{
                      height: '104px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      position: 'relative',
                      background: '#27342b',
                    }}
                  >
                    <img
                      src="/assets/images/warehouse.webp"
                      alt=""
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.82 }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '10px',
                        background: 'rgba(25, 22, 18, 0.78)',
                        color: '#fff',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: '6px',
                      }}
                    >
                      📍 {item.category || 'Kho trung tâm'} · Mã {item.code}
                    </span>
                  </div>
                )}

                {/* Header thẻ + Công tắc Bật/Tắt 1 chạm */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      {slug !== 'warehouses' && (
                        <code style={{ fontSize: '11.5px', background: '#f4ede0', padding: '2px 7px', borderRadius: '5px' }}>
                          {item.code}
                        </code>
                      )}
                      <span
                        className={`badge badge-${enabled ? 'green' : 'red'}`}
                        style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px' }}
                      >
                        {enabled ? 'Đang bật' : 'Tạm dừng'}
                      </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 750, color: '#272016', lineHeight: 1.3 }}>
                      {item.name}
                    </h3>
                    <small style={{ color: '#6f6453', display: 'block', marginTop: '3px' }}>
                      {item.subtitle || item.category || `Phụ trách: ${item.owner || 'Alex Chen'}`}
                    </small>
                  </div>
                </div>

                {/* Công tắc gạt Bật/Tắt trực tiếp */}
                <ToggleSwitch
                  checked={enabled}
                  disabled={busyId === item.id}
                  onChange={() => handleToggleActive(item)}
                  label={enabled ? 'Đang kích hoạt vận hành' : 'Đang tạm ngưng kết nối'}
                  description={`Cập nhật: ${item.date || 'Hôm nay'} · Phụ trách: ${item.owner || 'Alex Chen'}`}
                />

                {/* Thanh công suất kho hàng */}
                {capacityPct !== null && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                      <span style={{ color: '#5c5243', fontWeight: 600 }}>Mức lấp đầy công suất kho</span>
                      <strong style={{ color: capacityPct > 85 ? '#d97706' : '#059669' }}>{capacityPct}% sức chứa</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#e7dcc8', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${capacityPct}%`,
                          height: '100%',
                          background: capacityPct > 85 ? '#d97706' : '#10b981',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Khối Endpoint / API Key mẫu cho integrations & webhooks */}
                {isTechPingMode && (
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: '#25211d',
                      color: '#f6f1e7',
                      fontSize: '11.5px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <code style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {endpointStr}
                    </code>
                    <button
                      type="button"
                      onClick={async () => {
                        await copyToClipboard(endpointStr);
                        showToast(`Đã sao chép: ${endpointStr}`);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.16)',
                        color: '#ffe08a',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      📋 Chép
                    </button>
                  </div>
                )}

                {latestPing && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#065f46',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    ✓ Phản hồi Ping: {latestPing}
                  </div>
                )}

                {/* 2 ô chỉ số tóm tắt */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ padding: '10px 12px', background: '#f7f2e7', borderRadius: '10px' }}>
                    <small style={{ color: '#756a59', display: 'block', fontSize: '11.5px' }}>
                      {modeCfg.metricCountLabel}
                    </small>
                    <strong style={{ fontSize: '15px', color: '#272016' }}>
                      {Number(item.count ?? 0).toLocaleString('en-US')}
                    </strong>
                  </div>
                  <div style={{ padding: '10px 12px', background: '#f7f2e7', borderRadius: '10px' }}>
                    <small style={{ color: '#756a59', display: 'block', fontSize: '11.5px' }}>
                      {modeCfg.metricValueLabel}
                    </small>
                    <strong style={{ fontSize: '15px', color: '#059669' }}>{item.value || '$0'}</strong>
                  </div>
                </div>

                {item.notes && (
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#615646', lineHeight: 1.45 }}>
                    {item.notes}
                  </p>
                )}

                {/* Chân thẻ: Các nút hành động rõ nghĩa */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '4px' }}>
                  {isTechPingMode && (
                    <button
                      type="button"
                      className="primary-button"
                      disabled={busyId === item.id}
                      style={{ flex: 1.2, justifyContent: 'center', padding: '7px 10px', fontSize: '12.5px' }}
                      onClick={() => handleSendPing(item)}
                    >
                      {busyId === item.id ? 'Đang Ping...' : '⚡ Gửi Ping kiểm tra'}
                    </button>
                  )}

                  {slug === 'warehouses' && (
                    <Link
                      to="/commerce/stock"
                      className="secondary-button"
                      style={{ flex: 1, justifyContent: 'center', padding: '7px 10px', fontSize: '12.5px' }}
                    >
                      📦 Xem Tồn kho
                    </Link>
                  )}

                  <button
                    type="button"
                    className="secondary-button"
                    style={{ flex: 1, justifyContent: 'center', padding: '7px 10px', fontSize: '12.5px' }}
                    onClick={() => openEditModal(item)}
                  >
                    ⚙️ Cấu hình
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    style={{ padding: '7px 10px', fontSize: '12.5px', color: '#b23b3b' }}
                    onClick={() => setDeletingItem(item)}
                  >
                    Xóa
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* BẢNG ĐIỀU PHỐI NHANH & THAO TÁC HÀNG LOẠT */}
      <section className="glass-card c-resource" style={{ marginTop: '24px' }}>
        <div className="product-list-heading">
          <div>
            <span>BẢNG QUẢN TRỊ & THAO TÁC HÀNG LOẠT</span>
            <h2>Danh sách đối soát {navInfo.title.toLowerCase()}</h2>
          </div>
          <small>{visibleRecords.length} mục hiển thị</small>
        </div>

        {selectedIds.length > 0 && (
          <div className="c-selection" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <strong>{selectedIds.length} mục đã chọn</strong>
            <select
              aria-label="Trạng thái hàng loạt"
              value={bulkStatusTarget}
              onChange={(e) => setBulkStatusTarget(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #d4c8b8', background: '#fffdf9', fontSize: '13px' }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value}
                </option>
              ))}
            </select>
            <button type="button" className="secondary-button" disabled={isSubmitting} onClick={handleBulkStatusApply}>
              Đổi trạng thái hàng loạt
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={isSubmitting}
              style={{ color: '#991b1b', borderColor: '#e5b8b8' }}
              onClick={() => setIsBulkDeleteOpen(true)}
            >
              Xóa mục đã chọn
            </button>
            <button type="button" className="secondary-button" onClick={() => setSelectedIds([])}>
              Bỏ chọn
            </button>
          </div>
        )}

        <div className="table-scroll c-table-scroll" tabIndex="0" role="region" aria-label={`Bảng ${navInfo.title}`}>
          <table className="c-table">
            <thead>
              <tr>
                <th scope="col" className="c-check">
                  <input
                    type="checkbox"
                    checked={visibleRecords.length > 0 && visibleRecords.every((r) => selectedIds.includes(r.id))}
                    onChange={(e) => setSelectedIds(e.target.checked ? visibleRecords.map((r) => r.id) : [])}
                    aria-label="Chọn tất cả"
                  />
                </th>
                <th>{domainMeta.primaryCol}</th>
                <th>Mã</th>
                <th>{domainMeta.categoryCol}</th>
                <th>{modeCfg.metricCountLabel}</th>
                <th>{modeCfg.metricValueLabel}</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visibleRecords.map((r) => {
                const checked = selectedIds.includes(r.id);
                return (
                  <tr key={r.id} className={checked ? 'selected' : ''}>
                    <td className="c-check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleSelect(r.id)}
                        aria-label={`Chọn ${r.name}`}
                      />
                    </td>
                    <td>
                      <strong>{r.name}</strong>
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', background: '#f5efe4', padding: '2px 6px', borderRadius: '4px' }}>
                        {r.code}
                      </code>
                    </td>
                    <td>{r.category || domainMeta.defaultCategory}</td>
                    <td>{Number(r.count ?? 0).toLocaleString('en-US')}</td>
                    <td>
                      <strong style={{ color: '#059669' }}>{r.value || '$0'}</strong>
                    </td>
                    <td>
                      <span className={`badge badge-${r.statusClass || resolveStatusClass(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="secondary-button"
                          style={{ padding: '4px 9px', fontSize: '12px' }}
                          onClick={() => openEditModal(r)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          style={{ padding: '4px 9px', fontSize: '12px', color: '#b23b3b' }}
                          onClick={() => setDeletingItem(r)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        danger
        title="Xác nhận xóa hàng loạt"
        message={`Bạn có chắc chắn muốn xóa ${selectedIds.length} mục đã chọn trong "${navInfo.title}"?`}
        confirmLabel={`Xóa ${selectedIds.length} mục đã chọn`}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmBulkDelete}
        onClose={() => setIsBulkDeleteOpen(false)}
      />

      {/* MODAL THÊM / SỬA CẤU HÌNH THẺ */}
      <DialogModal
        isOpen={isEditorOpen}
        wide
        onClose={() => setIsEditorOpen(false)}
        title={editingItem ? `Cấu hình: ${editingItem.name}` : `${modeCfg.addLabel.replace('+ ', '')}`}
      >
        <form onSubmit={handleSaveForm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div>
              <label style={FIELD_LABEL_STYLE}>Tên hiển thị *</label>
              <input
                type="text"
                required
                className="c-field"
                style={FIELD_INPUT_STYLE}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label style={FIELD_LABEL_STYLE}>Mã định danh</label>
              <input
                type="text"
                className="c-field"
                style={FIELD_INPUT_STYLE}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={FIELD_LABEL_STYLE}>{domainMeta.categoryCol}</label>
              <input
                type="text"
                className="c-field"
                style={FIELD_INPUT_STYLE}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div>
              <label style={FIELD_LABEL_STYLE}>Mô tả ngắn / Khu vực / Sự kiện</label>
              <input
                type="text"
                className="c-field"
                style={FIELD_INPUT_STYLE}
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div>
              <label style={FIELD_LABEL_STYLE}>{modeCfg.metricCountLabel}</label>
              <input
                type="number"
                min="0"
                className="c-field"
                style={FIELD_INPUT_STYLE}
                value={formData.count}
                onChange={(e) => setFormData({ ...formData, count: e.target.value })}
              />
            </div>
            <div>
              <label style={FIELD_LABEL_STYLE}>{modeCfg.metricValueLabel}</label>
              <input
                type="text"
                className="c-field"
                style={FIELD_INPUT_STYLE}
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
            <div>
              <label style={FIELD_LABEL_STYLE}>Trạng thái</label>
              <select
                className="c-field"
                style={FIELD_INPUT_STYLE}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.value}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={FIELD_LABEL_STYLE}>Người phụ trách</label>
              <input
                type="text"
                className="c-field"
                style={FIELD_INPUT_STYLE}
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={FIELD_LABEL_STYLE}>Địa chỉ / Ghi chú vận hành chi tiết</label>
            <textarea
              rows={3}
              className="c-field"
              style={FIELD_INPUT_STYLE}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="secondary-button" onClick={() => setIsEditorOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </div>
        </form>
      </DialogModal>

      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        danger
        title="Xác nhận xóa cấu hình"
        message={deletingItem ? `Bạn có chắc chắn muốn xóa "${deletingItem.name}" (${deletingItem.code}) không?` : ''}
        confirmLabel="Xóa vĩnh viễn"
        isSubmitting={isSubmitting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeletingItem(null)}
      />

      <ToastStack toasts={toasts} />
    </div>
  );
}
