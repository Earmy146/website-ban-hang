import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../components/ui/DialogModal';
import { request } from '../../services/api';
import {
  PERMISSION_ROLES,
  PERMISSION_RESOURCES,
  PERMISSION_ACTIONS,
  createDefaultPermissionMatrix,
  normalizePermissionMatrix,
  resolveStatusClass,
} from './moduleCatalog';
import {
  PageHeader,
  QuickGuideBanner,
  FilterPillTabs,
  ConfirmDialog,
  ToastStack,
  useToast,
  exportCsvFile,
} from './commonWidgets';
import ResourceModuleView from './ResourceModuleView';

function PermissionsMatrixPage({ navInfo }) {
  const [matrix, setMatrix] = useState(() => createDefaultPermissionMatrix());
  const [rawSettings, setRawSettings] = useState({});
  const [resourceFilter, setResourceFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [lastSavedText, setLastSavedText] = useState('Đồng bộ trực tiếp với CSDL');

  const { toasts, showToast } = useToast();

  const loadPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await request('/module-configs/permissions');
      const incoming = data?.settings && typeof data.settings === 'object' ? data.settings : {};
      setRawSettings(incoming);
      setMatrix(normalizePermissionMatrix(incoming));
    } catch {
      setMatrix(createDefaultPermissionMatrix());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const persistMatrix = useCallback(
    async (nextMatrix, showSuccessToast = true) => {
      setIsSaving(true);
      try {
        const payloadSettings = {
          ...rawSettings,
          version: 2,
          matrix: nextMatrix,
        };
        const res = await request('/module-configs/permissions', {
          method: 'PUT',
          body: {
            title: navInfo.title,
            group: navInfo.parent,
            settings: payloadSettings,
          },
        });
        if (res?.settings) {
          setRawSettings(res.settings);
        }
        setLastSavedText(`Đã lưu lúc ${new Date().toLocaleTimeString('vi-VN')}`);
        if (showSuccessToast) {
          showToast('Đã lưu ma trận phân quyền hệ thống thành công!');
        }
      } catch (err) {
        showToast(err.message || 'Không thể lưu ma trận phân quyền', 'error');
      } finally {
        setIsSaving(false);
      }
    },
    [rawSettings, navInfo.title, navInfo.parent, showToast]
  );

  const handleToggleCell = (resourceId, actionId, roleId) => {
    setMatrix((prev) => {
      const nextVal = !prev[resourceId]?.[actionId]?.[roleId];
      const nextMatrix = {
        ...prev,
        [resourceId]: {
          ...prev[resourceId],
          [actionId]: {
            ...prev[resourceId][actionId],
            [roleId]: nextVal,
          },
        },
      };
      // Lưu bền vững ngay lập tức vào MongoDB để kể cả reload trang ngay vẫn giữ nguyên trạng thái
      persistMatrix(nextMatrix, false);
      return nextMatrix;
    });
  };

  const handleGrantRowViewAll = (resourceId) => {
    setMatrix((prev) => {
      const nextView = {};
      for (const r of PERMISSION_ROLES) {
        nextView[r.id] = true;
      }
      const nextMatrix = {
        ...prev,
        [resourceId]: {
          ...prev[resourceId],
          view: nextView,
        },
      };
      persistMatrix(nextMatrix, false);
      return nextMatrix;
    });
    showToast('Đã cấp quyền Xem cho toàn bộ vai trò ở phân hệ này!');
  };

  const handleResetDefaults = async () => {
    const defaults = createDefaultPermissionMatrix();
    setMatrix(defaults);
    setIsResetOpen(false);
    await persistMatrix(defaults, false);
    showToast('Đã khôi phục ma trận phân quyền tiêu chuẩn!');
  };

  const stats = useMemo(() => {
    let granted = 0;
    let total = 0;
    for (const res of PERMISSION_RESOURCES) {
      for (const act of PERMISSION_ACTIONS) {
        for (const role of PERMISSION_ROLES) {
          total += 1;
          if (matrix[res.id]?.[act.id]?.[role.id]) granted += 1;
        }
      }
    }
    return { granted, total };
  }, [matrix]);

  const visibleResources = useMemo(() => {
    if (resourceFilter === 'all') return PERMISSION_RESOURCES;
    return PERMISSION_RESOURCES.filter((r) => r.id === resourceFilter);
  }, [resourceFilter]);

  return (
    <div className="general-commerce-page" style={{ paddingBottom: '40px' }}>
      <PageHeader
        navInfo={navInfo}
        subtitle="Kiểm soát chi tiết quyền Xem, Thêm, Sửa, Xóa trên từng phân hệ nghiệp vụ cho 5 nhóm vai trò nhân sự."
      >
        <button
          type="button"
          className="secondary-button"
          disabled={isSaving || isLoading}
          onClick={() => setIsResetOpen(true)}
        >
          Khôi phục mặc định
        </button>
        <button
          type="button"
          className="primary-button"
          disabled={isSaving || isLoading}
          onClick={() => persistMatrix(matrix, true)}
        >
          {isSaving ? 'Đang lưu...' : 'Lưu phân quyền'}
        </button>
      </PageHeader>

      <section className="order-summary-grid" style={{ marginBottom: '20px' }}>
        <div className="order-summary-card green">
          <div>
            <small>Vai trò hệ thống</small>
            <strong>{PERMISSION_ROLES.length}</strong>
            <em>Owner, Kho, CSKH, Tiếp thị, Kế toán</em>
          </div>
        </div>
        <div className="order-summary-card blue">
          <div>
            <small>Quyền nghiệp vụ</small>
            <strong>{PERMISSION_RESOURCES.length * PERMISSION_ACTIONS.length}</strong>
            <em>6 phân hệ × 4 cấp thao tác</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Ô quyền đang cấp</small>
            <strong>
              {stats.granted}/{stats.total}
            </strong>
            <em>{lastSavedText}</em>
          </div>
        </div>
        <div className="order-summary-card purple">
          <div>
            <small>Chế độ kiểm soát</small>
            <strong>RBAC V2</strong>
            <em>Tự động ghi nhận vào Nhật ký Audit</em>
          </div>
        </div>
      </section>

      <QuickGuideBanner
        icon="🔐"
        title="Cách phân quyền nhân sự trực quan:"
        steps={[
          'Mỗi cột là một vai trò nhân sự, mỗi dòng là quyền Xem / Thêm / Sửa / Xóa',
          'Tích hoặc bỏ tích ô vuông để cấp hoặc thu hồi quyền (tự động lưu ngay vào CSDL)',
          'Dùng thanh Tab phân hệ bên dưới để lọc gọn khu vực cần kiểm tra',
        ]}
      />

      <section
        className="glass-card"
        style={{
          padding: '14px 18px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <FilterPillTabs
          activeId={resourceFilter}
          onSelect={setResourceFilter}
          tabs={[
            { id: 'all', label: 'Tất cả 6 phân hệ', icon: '🛡️' },
            ...PERMISSION_RESOURCES.map((r) => ({ id: r.id, label: r.label })),
          ]}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link to="/commerce/users" className="secondary-button" style={{ fontSize: '12.5px', padding: '6px 12px' }}>
            Quản lý thành viên →
          </Link>
          <Link to="/commerce/audit" className="secondary-button" style={{ fontSize: '12.5px', padding: '6px 12px' }}>
            Nhật ký phân quyền →
          </Link>
        </div>
      </section>

      <section className="glass-card c-resource">
        <div className="product-list-heading">
          <div>
            <span>MA TRẬN PHÂN QUYỀN TRỰC QUAN</span>
            <h2>Bảng phân quyền vai trò theo chức năng</h2>
          </div>
          <small>{isLoading ? 'Đang tải...' : 'Bật/tắt ô kiểm để cấp hoặc thu hồi quyền tức thì'}</small>
        </div>

        <div className="table-scroll c-table-scroll" tabIndex="0" role="region" aria-label="Ma trận phân quyền">
          <table className="c-table">
            <thead>
              <tr>
                <th style={{ minWidth: '210px' }}>Phân hệ nghiệp vụ</th>
                <th style={{ minWidth: '110px' }}>Quyền hạn</th>
                {PERMISSION_ROLES.map((role) => (
                  <th key={role.id} style={{ textAlign: 'center', minWidth: '120px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <span className={`badge badge-${role.badge}`} style={{ fontSize: '11.5px', padding: '3px 9px', borderRadius: '999px' }}>
                        {role.label}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleResources.map((res) =>
                PERMISSION_ACTIONS.map((act, actIdx) => (
                  <tr
                    key={`${res.id}-${act.id}`}
                    style={
                      actIdx === 0
                        ? { borderTop: '2px solid rgba(190, 175, 145, 0.45)' }
                        : undefined
                    }
                  >
                    <td>
                      {actIdx === 0 ? (
                        <div>
                          <strong style={{ fontSize: '14px', color: '#272016', display: 'block' }}>
                            {res.label}
                          </strong>
                          <small style={{ color: '#756a59', display: 'block', marginBottom: '4px' }}>
                            {res.desc}
                          </small>
                          <button
                            type="button"
                            onClick={() => handleGrantRowViewAll(res.id)}
                            style={{
                              fontSize: '11.5px',
                              color: '#8a5a00',
                              fontWeight: 700,
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                          >
                            + Cho phép tất cả Xem
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#9c9180', fontSize: '12.5px' }}>↳ {res.label}</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge badge-${
                          act.id === 'delete'
                            ? 'red'
                            : act.id === 'view'
                              ? 'green'
                              : act.id === 'create'
                                ? 'blue'
                                : 'amber'
                        }`}
                        style={{ fontSize: '12px', padding: '3px 9px', borderRadius: '6px' }}
                      >
                        {act.label} {res.label.toLowerCase()}
                      </span>
                    </td>
                    {PERMISSION_ROLES.map((role) => {
                      const isChecked = Boolean(matrix[res.id]?.[act.id]?.[role.id]);
                      return (
                        <td key={role.id} style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            data-testid={`perm-${res.id}-${act.id}-${role.id}`}
                            aria-label={`${role.fullName} - ${act.label} ${res.label}`}
                            checked={isChecked}
                            onChange={() => handleToggleCell(res.id, act.id, role.id)}
                            style={{
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                              accentColor: '#27342b',
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        isOpen={isResetOpen}
        title="Khôi phục ma trận phân quyền mặc định"
        message="Toàn bộ thiết lập phân quyền của 5 vai trò sẽ trở về cấu hình chuẩn ban đầu của Veylix. Bạn có muốn tiếp tục?"
        confirmLabel="Khôi phục ngay"
        isSubmitting={isSaving}
        onConfirm={handleResetDefaults}
        onClose={() => setIsResetOpen(false)}
      />

      <ToastStack toasts={toasts} />
    </div>
  );
}

function AuditLogPage({ navInfo }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingLog, setViewingLog] = useState(null);

  const { toasts, showToast } = useToast();

  const loadAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await request(`/modules/audit?title=${encodeURIComponent(navInfo.title)}`);
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      showToast(err.message || 'Không thể tải nhật ký hoạt động hệ thống', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [navInfo.title, showToast]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const classifyLogType = (log) => {
    const text = `${log.category || ''} ${log.name || ''} ${log.code || ''}`.toLowerCase();
    if (text.includes('cấu hình') || text.includes('config') || text.includes('settings') || text.includes('seo') || text.includes('store')) {
      return 'config';
    }
    if (text.includes('quyền') || text.includes('permission') || text.includes('bảo mật') || text.includes('user') || text.includes('role')) {
      return 'security';
    }
    if (text.includes('đơn') || text.includes('order') || text.includes('hoàn') || text.includes('thanh toán')) {
      return 'order';
    }
    return 'data';
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      if (actionFilter !== 'all' && classifyLogType(item) !== actionFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${item.name || ''} ${item.code || ''} ${item.owner || ''} ${item.category || ''} ${item.subtitle || ''} ${item.notes || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [logs, actionFilter, searchQuery]);

  const handleExportAudit = () => {
    const headers = ['Thời gian', 'Mã sự kiện', 'Nội dung thao tác', 'Phân loại', 'Người thực hiện', 'Trạng thái', 'Ghi chú chi tiết'];
    const rows = filteredLogs.map((l) => [
      l.date || 'Vừa xong',
      l.code || '',
      l.name || '',
      l.category || 'Hệ thống',
      l.owner || 'Alex Chen',
      l.status || 'Đã hoàn tất',
      l.notes || l.subtitle || '',
    ]);
    exportCsvFile(`nhat_ky_he_thong_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showToast('Đã xuất file CSV nhật ký hoạt động thành công!');
  };

  return (
    <div className="general-commerce-page" style={{ paddingBottom: '40px' }}>
      <PageHeader
        navInfo={navInfo}
        subtitle="Theo dõi minh bạch toàn bộ thao tác thay đổi cấu hình, phân quyền, đơn hàng và dữ liệu quản trị theo thời gian thực."
      >
        <button type="button" className="secondary-button" disabled={isLoading} onClick={loadAuditLogs}>
          {isLoading ? 'Đang làm mới...' : 'Làm mới nhật ký'}
        </button>
        <button type="button" className="primary-button" onClick={handleExportAudit}>
          Xuất nhật ký CSV
        </button>
      </PageHeader>

      <section className="order-summary-grid" style={{ marginBottom: '20px' }}>
        <div className="order-summary-card green">
          <div>
            <small>Tổng bản ghi nhật ký</small>
            <strong>{logs.length}</strong>
            <em>Lưu vết bất biến trên MongoDB</em>
          </div>
        </div>
        <div className="order-summary-card blue">
          <div>
            <small>Thay đổi cấu hình</small>
            <strong>{logs.filter((l) => classifyLogType(l) === 'config').length}</strong>
            <em>Cài đặt cửa hàng & chính sách</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Phân quyền & Bảo mật</small>
            <strong>{logs.filter((l) => classifyLogType(l) === 'security').length}</strong>
            <em>Tài khoản, vai trò & RBAC</em>
          </div>
        </div>
        <div className="order-summary-card purple">
          <div>
            <small>Nghiệp vụ vận hành</small>
            <strong>{logs.filter((l) => ['order', 'data'].includes(classifyLogType(l))).length}</strong>
            <em>Sản phẩm, kho hàng & đơn hàng</em>
          </div>
        </div>
      </section>

      <QuickGuideBanner
        icon="📜"
        title="Tra cứu Nhật ký hoạt động quản trị:"
        steps={[
          'Mọi thao tác Lưu cấu hình, Phân quyền và Vận hành đều tự động ghi lại tại đây',
          'Bấm các nút Tab bên dưới để lọc nhanh theo nhóm Cấu hình, Bảo mật hoặc Đơn hàng',
          'Bấm "Xem chi tiết" ở cuối dòng để kiểm tra người thực hiện và thời điểm chính xác',
        ]}
      />

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
          activeId={actionFilter}
          onSelect={setActionFilter}
          tabs={[
            { id: 'all', label: 'Tất cả sự kiện', icon: '📋', count: logs.length },
            { id: 'config', label: 'Cấu hình & Cài đặt', icon: '⚙️', count: logs.filter((l) => classifyLogType(l) === 'config').length },
            { id: 'security', label: 'Phân quyền & Bảo mật', icon: '🔐', count: logs.filter((l) => classifyLogType(l) === 'security').length },
            { id: 'order', label: 'Đơn hàng & Thanh toán', icon: '🛍️', count: logs.filter((l) => classifyLogType(l) === 'order').length },
            { id: 'data', label: 'Danh mục & Kho', icon: '🗂️', count: logs.filter((l) => classifyLogType(l) === 'data').length },
          ]}
        />

        <div className="c-toolbar-search" style={{ minWidth: '250px', flex: '0 1 300px' }}>
          <label className="c-search">
            <span className="icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
              </svg>
            </span>
            <input
              type="search"
              placeholder="Tìm thao tác, người thực hiện, mã..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Tìm kiếm nhật ký"
            />
          </label>
        </div>
      </section>

      <section className="glass-card c-resource" style={{ marginTop: '16px' }}>
        <div className="product-list-heading">
          <div>
            <span>NHẬT KÝ HỆ THỐNG (AUDIT TRAIL)</span>
            <h2>Lịch sử hoạt động quản trị</h2>
          </div>
          <small>{filteredLogs.length} bản ghi phù hợp</small>
        </div>

        <div className="table-scroll c-table-scroll" tabIndex="0" role="region" aria-label="Bảng nhật ký hoạt động">
          <table className="c-table">
            <thead>
              <tr>
                <th>Thời điểm</th>
                <th>Sự kiện / Hành động</th>
                <th>Mã nhật ký</th>
                <th>Nhóm nghiệp vụ</th>
                <th>Người thực hiện</th>
                <th>Trạng thái</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px 20px', color: '#776c5b' }}>
                    Không tìm thấy bản ghi nhật ký nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <small style={{ fontWeight: 600, color: '#5c5243' }}>{log.date || 'Hôm nay'}</small>
                    </td>
                    <td>
                      <strong style={{ fontSize: '13.5px', color: '#272016', display: 'block' }}>{log.name}</strong>
                      {(log.subtitle || log.notes) && (
                        <small style={{ color: '#756a59' }}>{log.subtitle || log.notes}</small>
                      )}
                    </td>
                    <td>
                      <code style={{ fontSize: '12px', background: '#f5efe4', padding: '2px 7px', borderRadius: '5px' }}>
                        {log.code}
                      </code>
                    </td>
                    <td>{log.category || 'Quản trị hệ thống'}</td>
                    <td>
                      <strong>{log.owner || 'Alex Chen'}</strong>
                    </td>
                    <td>
                      <span
                        className={`badge badge-${log.statusClass || resolveStatusClass(log.status)}`}
                        style={{ fontSize: '12px', padding: '3px 9px', borderRadius: '6px' }}
                      >
                        {log.status || 'Đã ghi nhận'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        onClick={() => setViewingLog(log)}
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <DialogModal
        isOpen={Boolean(viewingLog)}
        onClose={() => setViewingLog(null)}
        title={viewingLog ? `Chi tiết nhật ký: ${viewingLog.code}` : ''}
      >
        {viewingLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
            <div style={{ padding: '14px 16px', background: '#f6f0e4', borderRadius: '12px', display: 'grid', gap: '8px' }}>
              <div><strong>Sự kiện:</strong> {viewingLog.name}</div>
              <div><strong>Mã định danh:</strong> {viewingLog.id} ({viewingLog.code})</div>
              <div><strong>Người thực hiện:</strong> {viewingLog.owner || 'Alex Chen (Quản trị viên)'}</div>
              <div><strong>Thời gian ghi nhận:</strong> {viewingLog.date || 'Vừa xong'}</div>
              <div><strong>Phân loại:</strong> {viewingLog.category || 'Cấu hình hệ thống'}</div>
              {viewingLog.subtitle && <div><strong>Tóm tắt:</strong> {viewingLog.subtitle}</div>}
              {viewingLog.notes && <div><strong>Chi tiết kỹ thuật:</strong> {viewingLog.notes}</div>}
            </div>

            {viewingLog.meta && Object.keys(viewingLog.meta).length > 0 && (
              <div>
                <strong style={{ display: 'block', marginBottom: '6px' }}>Dữ liệu đính kèm (Metadata JSON):</strong>
                <pre
                  style={{
                    background: '#25211d',
                    color: '#f6f1e7',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    overflowX: 'auto',
                  }}
                >
                  {JSON.stringify(viewingLog.meta, null, 2)}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="primary-button" onClick={() => setViewingLog(null)}>
                Đóng cửa sổ
              </button>
            </div>
          </div>
        )}
      </DialogModal>

      <ToastStack toasts={toasts} />
    </div>
  );
}

export default function AccessAuditView({ slug, navInfo }) {
  if (slug === 'permissions') {
    return <PermissionsMatrixPage navInfo={navInfo} />;
  }
  if (slug === 'audit') {
    return <AuditLogPage navInfo={navInfo} />;
  }

  // Với roles và teams: kết hợp lối tắt nhanh sang Ma trận phân quyền / Thành viên nhóm + Bảng quản trị chuyên sâu
  return (
    <div>
      <ResourceModuleView
        slug={slug}
        navInfo={navInfo}
        topSlot={
          <div
            className="glass-card"
            style={{
              padding: '14px 20px',
              marginBottom: '18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ fontSize: '13.5px', color: '#4d4335' }}>
              <strong>Liên kết nhanh Phân quyền & Nhân sự:</strong> Thiết lập quyền hạn chi tiết cho từng vai trò hoặc gán nhân sự vào đội nhóm vận hành.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/commerce/permissions" className="secondary-button" style={{ padding: '6px 12px', fontSize: '12.5px' }}>
                Ma trận phân quyền →
              </Link>
              <Link to="/commerce/users" className="secondary-button" style={{ padding: '6px 12px', fontSize: '12.5px' }}>
                Danh sách thành viên →
              </Link>
            </div>
          </div>
        }
      />
    </div>
  );
}
