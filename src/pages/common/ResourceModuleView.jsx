import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  ConfirmDialog,
  ToastStack,
  useToast,
  exportCsvFile,
  FIELD_INPUT_STYLE,
  FIELD_LABEL_STYLE,
} from './commonWidgets';

const EMPTY_FORM = {
  name: '',
  code: '',
  category: '',
  subtitle: '',
  owner: 'Alex Chen',
  count: 1,
  value: '$0',
  status: 'Hoạt động',
  notes: '',
};

const QUICK_STATUS_CYCLE = {
  'Hoạt động': 'Tạm dừng',
  'Đang xử lý': 'Hoạt động',
  'Tạm dừng': 'Hoạt động',
  'Đã hoàn tất': 'Lưu trữ',
  'Lưu trữ': 'Hoạt động',
};

export default function ResourceModuleView({ slug, navInfo, topSlot = null }) {
  const domainMeta = useMemo(() => {
    return (
      RESOURCE_DOMAIN_META[slug] || {
        subtitle: `Quản lý danh sách bản ghi, trạng thái vận hành và dữ liệu chi tiết của ${navInfo.title.toLowerCase()}.`,
        primaryCol: 'Tên định danh',
        categoryCol: 'Phân loại',
        countCol: 'Số lượng',
        valueCol: 'Giá trị',
        defaultCategory: navInfo.title,
      }
    );
  }, [slug, navInfo.title]);

  const fallbackRecords = useMemo(
    () => buildContextualFallbackRecords(slug, navInfo.title),
    [slug, navInfo.title]
  );

  const [records, setRecords] = useState(fallbackRecords);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatusTarget, setBulkStatusTarget] = useState('Hoạt động');

  // Modals: Thêm/Sửa, Xem chi tiết, Xóa lẻ, Xóa hàng loạt
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toasts, showToast } = useToast();

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await request(
        `/modules/${encodeURIComponent(slug)}?title=${encodeURIComponent(navInfo.title)}`
      );
      if (Array.isArray(data)) {
        setRecords(data);
      }
    } catch {
      setRecords(fallbackRecords);
    } finally {
      setIsLoading(false);
    }
  }, [slug, navInfo.title, fallbackRecords]);

  useEffect(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedIds([]);
    setViewingRecord(null);
    setEditingRecord(null);
    setDeletingRecord(null);
    setIsEditorOpen(false);
    setIsBulkDeleteOpen(false);
    loadRecords();
  }, [slug, navInfo.title, loadRecords]);

  const availableStatuses = useMemo(() => {
    const baseSet = new Set(STATUS_OPTIONS.map((s) => s.value));
    for (const r of records) {
      if (r.status) baseSet.add(r.status);
    }
    return Array.from(baseSet);
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${r.name || ''} ${r.code || ''} ${r.category || ''} ${r.subtitle || ''} ${r.owner || ''} ${r.notes || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, statusFilter, searchQuery]);

  const isAllSelected =
    filteredRecords.length > 0 && filteredRecords.every((r) => selectedIds.includes(r.id));

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredRecords.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const openCreateModal = () => {
    const codePrefix = `VX-${slug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'MOD'}`;
    setEditingRecord(null);
    setFormData({
      ...EMPTY_FORM,
      code: `${codePrefix}-${Math.floor(100 + Math.random() * 900)}`,
      category: domainMeta.defaultCategory,
    });
    setIsEditorOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setFormData({
      name: record.name || '',
      code: record.code || '',
      category: record.category || domainMeta.defaultCategory,
      subtitle: record.subtitle || '',
      owner: record.owner || 'Alex Chen',
      count: Number(record.count ?? 0),
      value: record.value || '$0',
      status: record.status || 'Hoạt động',
      notes: record.notes || '',
    });
    setIsEditorOpen(true);
  };

  const handleSaveRecord = async (e) => {
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
      if (editingRecord) {
        const updated = await request(
          `/modules/${encodeURIComponent(slug)}/${encodeURIComponent(editingRecord.id)}`,
          {
            method: 'PUT',
            body: payload,
          }
        );
        if (updated && updated.id) {
          setRecords((prev) => prev.map((item) => (item.id === editingRecord.id ? updated : item)));
        } else {
          await loadRecords();
        }
        showToast(`Đã cập nhật "${payload.name}" thành công!`);
      } else {
        const created = await request(`/modules/${encodeURIComponent(slug)}`, {
          method: 'POST',
          body: payload,
        });
        if (created && created.id) {
          setRecords((prev) => [created, ...prev]);
        } else {
          await loadRecords();
        }
        showToast(`Đã thêm mới "${payload.name}" thành công!`);
      }
      setIsEditorOpen(false);
      setEditingRecord(null);
    } catch (err) {
      showToast(err.message || 'Không thể lưu bản ghi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickCycleStatus = async (record) => {
    if (isSubmitting) return;
    const nextStatus = QUICK_STATUS_CYCLE[record.status] || 'Hoạt động';
    const nextClass = resolveStatusClass(nextStatus);

    setIsSubmitting(true);
    try {
      const updated = await request(
        `/modules/${encodeURIComponent(slug)}/${encodeURIComponent(record.id)}`,
        {
          method: 'PUT',
          body: {
            status: nextStatus,
            statusClass: nextClass,
          },
        }
      );
      if (updated && updated.id) {
        setRecords((prev) => prev.map((item) => (item.id === record.id ? updated : item)));
      } else {
        setRecords((prev) =>
          prev.map((item) =>
            item.id === record.id
              ? { ...item, status: nextStatus, statusClass: nextClass, date: 'Vừa cập nhật' }
              : item
          )
        );
      }
      showToast(`Đã chuyển "${record.name}" sang trạng thái "${nextStatus}"`);
    } catch (err) {
      showToast(err.message || 'Không thể đổi nhanh trạng thái', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteSingle = async () => {
    if (!deletingRecord || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await request(
        `/modules/${encodeURIComponent(slug)}/${encodeURIComponent(deletingRecord.id)}`,
        { method: 'DELETE' }
      );
      setRecords((prev) => prev.filter((item) => item.id !== deletingRecord.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deletingRecord.id));
      showToast(`Đã xóa "${deletingRecord.name}" khỏi hệ thống!`);
      setDeletingRecord(null);
    } catch (err) {
      showToast(err.message || 'Không thể xóa bản ghi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkStatusApply = async () => {
    if (selectedIds.length === 0 || isSubmitting) return;
    const statusClass = resolveStatusClass(bulkStatusTarget);
    setIsSubmitting(true);
    try {
      await request(`/modules/${encodeURIComponent(slug)}/bulk-status`, {
        method: 'POST',
        body: {
          ids: selectedIds,
          status: bulkStatusTarget,
          statusClass,
        },
      });
      setRecords((prev) =>
        prev.map((r) =>
          selectedIds.includes(r.id)
            ? { ...r, status: bulkStatusTarget, statusClass, date: 'Vừa cập nhật' }
            : r
        )
      );
      showToast(`Đã cập nhật trạng thái "${bulkStatusTarget}" cho ${selectedIds.length} mục!`);
      setSelectedIds([]);
    } catch (err) {
      showToast(err.message || 'Không thể cập nhật trạng thái hàng loạt', 'error');
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
      showToast(err.message || 'Không thể xóa hàng loạt các mục đã chọn', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Mã hệ thống',
      'Mã tham chiếu',
      domainMeta.primaryCol,
      domainMeta.categoryCol,
      'Mô tả / Phụ đề',
      'Phụ trách',
      domainMeta.countCol,
      domainMeta.valueCol,
      'Trạng thái',
      'Cập nhật',
      'Ghi chú chi tiết',
    ];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.code,
      r.name,
      r.category || domainMeta.defaultCategory,
      r.subtitle || '',
      r.owner || 'Alex Chen',
      r.count ?? 0,
      r.value || '$0',
      r.status || 'Hoạt động',
      r.date || '',
      r.notes || '',
    ]);
    exportCsvFile(
      `veylix_${slug}_${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
    showToast(`Đã xuất ${filteredRecords.length} dòng dữ liệu "${navInfo.title}" ra file CSV!`);
  };

  const activeCount = records.filter(
    (r) => resolveStatusClass(r.status) === 'green'
  ).length;
  const pendingCount = records.filter(
    (r) => resolveStatusClass(r.status) === 'amber'
  ).length;
  const totalQuantity = records.reduce((sum, r) => sum + (Number(r.count) || 0), 0);

  return (
    <div className="general-commerce-page" style={{ paddingBottom: '40px' }}>
      <PageHeader navInfo={navInfo} subtitle={domainMeta.subtitle}>
        <button type="button" className="secondary-button" onClick={handleExportCsv}>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z"></path>
            </svg>
          </span>
          Xuất CSV
        </button>

        <button type="button" className="primary-button" onClick={openCreateModal}>
          <span className="icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
              <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
            </svg>
          </span>
          + Thêm mới
        </button>
      </PageHeader>

      {topSlot}

      <QuickGuideBanner
        icon="🧭"
        title={`Hướng dẫn thao tác nhanh trên trang "${navInfo.title}":`}
        steps={[
          'Bấm các nút Tab trạng thái bên dưới để lọc danh sách trong 1 chạm',
          'Tích ô vuông đầu dòng để mở thanh Đổi trạng thái hoặc Xóa hàng loạt',
          'Bấm trực tiếp vào tên mục để xem chi tiết hoặc bấm "Sửa" để cập nhật ngay',
        ]}
      />

      {/* 4 THẺ KPI TỔNG QUAN */}
      <section className="order-summary-grid" style={{ marginBottom: '20px' }}>
        <div className="order-summary-card green">
          <div>
            <small>Tổng số bản ghi</small>
            <strong>{records.length}</strong>
            <em>Đang lưu trữ trong phân hệ</em>
          </div>
        </div>
        <div className="order-summary-card blue">
          <div>
            <small>Đang hoạt động</small>
            <strong>{activeCount}</strong>
            <em>Sẵn sàng vận hành 100%</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Chờ duyệt / Xử lý</small>
            <strong>{pendingCount}</strong>
            <em>Cần rà soát theo tiến độ</em>
          </div>
        </div>
        <div className="order-summary-card purple">
          <div>
            <small>Tổng {domainMeta.countCol.toLowerCase()}</small>
            <strong>{totalQuantity.toLocaleString('en-US')}</strong>
            <em>Đồng bộ trực tiếp với CSDL</em>
          </div>
        </div>
      </section>

      {/* THANH CÔNG CỤ LỌC TAB 1 CHẠM + TÌM KIẾM */}
      <section
        className="glass-card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <FilterPillTabs
          activeId={statusFilter}
          onSelect={setStatusFilter}
          tabs={[
            { id: 'all', label: 'Tất cả', icon: '📋', count: records.length },
            ...availableStatuses.map((st) => {
              const cls = resolveStatusClass(st);
              const icon =
                cls === 'green'
                  ? '🟢'
                  : cls === 'amber'
                    ? '🟡'
                    : cls === 'blue'
                      ? '🔵'
                      : cls === 'red'
                        ? '🔴'
                        : '🟣';
              return {
                id: st,
                label: st,
                icon,
                count: records.filter((r) => r.status === st).length,
              };
            }),
          ]}
        />

        <div className="c-toolbar-search" style={{ minWidth: '260px', flex: '0 1 320px' }}>
          <label className="c-search">
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </span>
            <input
              type="search"
              placeholder="Tìm tên, mã, phân loại, phụ trách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm bản ghi"
            />
          </label>
        </div>
      </section>

      {/* BẢNG DỮ LIỆU + THANH THAO TÁC HÀNG LOẠT (.c-selection) */}
      <section className="glass-card c-resource" style={{ marginTop: '16px' }}>
        <div className="product-list-heading">
          <div>
            <span>DỮ LIỆU NGHIỆP VỤ CHUYÊN SÂU</span>
            <h2>Danh sách {navInfo.title.toLowerCase()}</h2>
          </div>
          <small>
            {isLoading ? 'Đang tải dữ liệu...' : `${filteredRecords.length} mục phù hợp`}
          </small>
        </div>

        {selectedIds.length > 0 && (
          <div
            className="c-selection"
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <strong>{selectedIds.length} mục đã chọn</strong>

            <select
              aria-label="Chọn trạng thái hàng loạt"
              value={bulkStatusTarget}
              onChange={(e) => setBulkStatusTarget(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #d4c8b8',
                background: '#fffdf9',
                fontSize: '13px',
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Trạng thái: {opt.value}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="secondary-button"
              disabled={isSubmitting}
              onClick={handleBulkStatusApply}
            >
              Đổi trạng thái hàng loạt
            </button>

            <button
              type="button"
              className="secondary-button"
              disabled={isSubmitting}
              onClick={() => setIsBulkDeleteOpen(true)}
              style={{ color: '#991b1b', borderColor: '#e5b8b8' }}
            >
              Xóa mục đã chọn
            </button>

            <button
              type="button"
              className="secondary-button"
              disabled={isSubmitting}
              onClick={() => setSelectedIds([])}
            >
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
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Chọn tất cả bản ghi"
                  />
                </th>
                <th>{domainMeta.primaryCol}</th>
                <th>Mã tham chiếu</th>
                <th>{domainMeta.categoryCol}</th>
                <th>{domainMeta.countCol}</th>
                <th>{domainMeta.valueCol}</th>
                <th>Trạng thái</th>
                <th>Cập nhật</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: '#776c5b' }}>
                    Không tìm thấy bản ghi nào khớp với tiêu chí lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isChecked = selectedIds.includes(r.id);
                  const badgeTone = r.statusClass || resolveStatusClass(r.status);
                  return (
                    <tr key={r.id} className={isChecked ? 'selected' : ''}>
                      <td className="c-check">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(r.id)}
                          aria-label={`Chọn ${r.name}`}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setViewingRecord(r)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          <strong style={{ fontSize: '13.5px', color: '#272016', display: 'block' }}>
                            {r.name}
                          </strong>
                          {(r.subtitle || r.owner) && (
                            <small style={{ color: '#756a59', fontSize: '12px' }}>
                              {r.subtitle ? r.subtitle : `Phụ trách: ${r.owner}`}
                            </small>
                          )}
                        </button>
                      </td>
                      <td>
                        <code
                          style={{
                            fontSize: '12px',
                            background: '#f5efe4',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            color: '#3c3122',
                          }}
                        >
                          {r.code}
                        </code>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: '#4d4233' }}>
                          {r.category || domainMeta.defaultCategory}
                        </span>
                      </td>
                      <td>
                        <strong>{Number(r.count ?? 0).toLocaleString('en-US')}</strong>
                      </td>
                      <td>
                        <strong style={{ color: '#059669' }}>{r.value || '$0'}</strong>
                      </td>
                      <td>
                        <span
                          className={`badge badge-${badgeTone}`}
                          style={{ fontSize: '12px', padding: '3px 9px', borderRadius: '6px' }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <small style={{ color: '#6b6050' }}>{r.date || 'Hôm nay'}</small>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'nowrap' }}>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => setViewingRecord(r)}
                          >
                            Chi tiết
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => openEditModal(r)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={isSubmitting}
                            title="Đổi nhanh trạng thái"
                            style={{ padding: '4px 8px', fontSize: '12px', color: '#8a5a00' }}
                            onClick={() => handleQuickCycleStatus(r)}
                          >
                            Đổi TT
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={isSubmitting}
                            style={{ padding: '4px 8px', fontSize: '12px', color: '#b23b3b' }}
                            onClick={() => setDeletingRecord(r)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL THÊM MỚI / CHỈNH SỬA ĐẦY ĐỦ CÁC TRƯỜNG */}
      <DialogModal
        isOpen={isEditorOpen}
        wide
        onClose={() => setIsEditorOpen(false)}
        title={editingRecord ? `Chỉnh sửa: ${editingRecord.name}` : `Thêm mới — ${navInfo.title}`}
      >
        <form onSubmit={handleSaveRecord} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
            <div>
              <label style={FIELD_LABEL_STYLE}>{domainMeta.primaryCol} *</label>
              <input
                type="text"
                required
                className="c-field"
                style={FIELD_INPUT_STYLE}
                placeholder={`Nhập ${domainMeta.primaryCol.toLowerCase()}...`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label style={FIELD_LABEL_STYLE}>Mã tham chiếu</label>
              <input
                type="text"
                className="c-field"
                style={FIELD_INPUT_STYLE}
                placeholder="Tự sinh nếu để trống"
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
              <label style={FIELD_LABEL_STYLE}>Phụ đề / Mô tả ngắn</label>
              <input
                type="text"
                className="c-field"
                style={FIELD_INPUT_STYLE}
                placeholder="Thông tin tóm tắt hiển thị dưới tên..."
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div>
              <label style={FIELD_LABEL_STYLE}>{domainMeta.countCol}</label>
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
              <label style={FIELD_LABEL_STYLE}>{domainMeta.valueCol}</label>
              <input
                type="text"
                className="c-field"
                style={FIELD_INPUT_STYLE}
                placeholder="$0"
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
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value}
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
            <label style={FIELD_LABEL_STYLE}>Ghi chú nghiệp vụ chi tiết</label>
            <textarea
              rows={3}
              className="c-field"
              style={FIELD_INPUT_STYLE}
              placeholder="Ghi chú hướng dẫn vận hành, điều kiện áp dụng hoặc thông tin đối tác..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              className="secondary-button"
              disabled={isSubmitting}
              onClick={() => setIsEditorOpen(false)}
            >
              Hủy bỏ
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting
                ? 'Đang lưu...'
                : editingRecord
                  ? 'Lưu thay đổi'
                  : 'Tạo bản ghi mới'}
            </button>
          </div>
        </form>
      </DialogModal>

      {/* MODAL XEM CHI TIẾT */}
      <DialogModal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title={viewingRecord ? `Chi tiết: ${viewingRecord.name}` : ''}
      >
        {viewingRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
            <div
              style={{
                padding: '16px',
                background: '#f6f0e4',
                borderRadius: '12px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              <div>
                <small style={{ color: '#756a59', display: 'block' }}>Mã tham chiếu</small>
                <strong>{viewingRecord.code}</strong>
              </div>
              <div>
                <small style={{ color: '#756a59', display: 'block' }}>Trạng thái</small>
                <span className={`badge badge-${viewingRecord.statusClass || resolveStatusClass(viewingRecord.status)}`}>
                  {viewingRecord.status}
                </span>
              </div>
              <div>
                <small style={{ color: '#756a59', display: 'block' }}>{domainMeta.categoryCol}</small>
                <strong>{viewingRecord.category || domainMeta.defaultCategory}</strong>
              </div>
              <div>
                <small style={{ color: '#756a59', display: 'block' }}>Người phụ trách</small>
                <strong>{viewingRecord.owner || 'Alex Chen'}</strong>
              </div>
              <div>
                <small style={{ color: '#756a59', display: 'block' }}>{domainMeta.countCol}</small>
                <strong>{Number(viewingRecord.count ?? 0).toLocaleString('en-US')}</strong>
              </div>
              <div>
                <small style={{ color: '#756a59', display: 'block' }}>{domainMeta.valueCol}</small>
                <strong style={{ color: '#059669' }}>{viewingRecord.value || '$0'}</strong>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <small style={{ color: '#756a59', display: 'block' }}>Cập nhật gần nhất</small>
                <span>{viewingRecord.date || 'Hôm nay'} (ID: {viewingRecord.id})</span>
              </div>
            </div>

            {(viewingRecord.subtitle || viewingRecord.notes) && (
              <div style={{ padding: '14px 16px', background: '#fffdf9', border: '1px solid #e3d6c1', borderRadius: '12px' }}>
                {viewingRecord.subtitle && (
                  <p style={{ margin: '0 0 6px 0' }}>
                    <strong>Tóm tắt:</strong> {viewingRecord.subtitle}
                  </p>
                )}
                {viewingRecord.notes && (
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                    <strong>Ghi chú chi tiết:</strong> {viewingRecord.notes}
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  const target = viewingRecord;
                  setViewingRecord(null);
                  openEditModal(target);
                }}
              >
                Chỉnh sửa bản ghi
              </button>
              <button type="button" className="primary-button" onClick={() => setViewingRecord(null)}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      {/* MODAL XÁC NHẬN XÓA ĐƠN LẺ */}
      <ConfirmDialog
        isOpen={Boolean(deletingRecord)}
        danger
        title="Xác nhận xóa bản ghi"
        message={
          deletingRecord
            ? `Bạn có chắc chắn muốn xóa vĩnh viễn "${deletingRecord.name}" (${deletingRecord.code}) khỏi phân hệ "${navInfo.title}" không?`
            : ''
        }
        confirmLabel="Xóa bản ghi"
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmDeleteSingle}
        onClose={() => setDeletingRecord(null)}
      />

      {/* MODAL XÁC NHẬN XÓA HÀNG LOẠT */}
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        danger
        title="Xác nhận xóa hàng loạt"
        message={`Bạn đang chọn xóa ${selectedIds.length} bản ghi trong phân hệ "${navInfo.title}". Thao tác này không thể hoàn tác. Bạn có chắc chắn tiếp tục?`}
        confirmLabel={`Xóa ${selectedIds.length} mục đã chọn`}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmBulkDelete}
        onClose={() => setIsBulkDeleteOpen(false)}
      />

      <ToastStack toasts={toasts} />
    </div>
  );
}
