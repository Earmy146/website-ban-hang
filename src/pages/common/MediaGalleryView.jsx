import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import DialogModal from '../../components/ui/DialogModal';
import { request } from '../../services/api';
import {
  PageHeader,
  QuickGuideBanner,
  FilterPillTabs,
  ConfirmDialog,
  ToastStack,
  useToast,
  copyToClipboard,
  exportCsvFile,
  FIELD_INPUT_STYLE,
  FIELD_LABEL_STYLE,
} from './commonWidgets';

// 16 tài nguyên tĩnh có thật 100% trong public/assets/images/
const BUILTIN_MEDIA_ASSETS = [
  {
    id: 'static-prod-1',
    name: 'Áo thun Everyday Tee (Studio Shot)',
    code: 'IMG-VX-1001',
    url: '/assets/images/products/everyday-tee.png',
    assetGroup: 'product',
    format: 'PNG',
    sizeLabel: '21.0 KB',
    dimensions: '800 × 800 px',
    usedIn: 'Sản phẩm VX-1001',
    isStatic: true,
  },
  {
    id: 'static-prod-2',
    name: 'Balo tối giản Minimal Backpack',
    code: 'IMG-VX-1002',
    url: '/assets/images/products/minimal-backpack.png',
    assetGroup: 'product',
    format: 'PNG',
    sizeLabel: '38.1 KB',
    dimensions: '800 × 800 px',
    usedIn: 'Sản phẩm VX-1002 & OG SEO',
    isStatic: true,
  },
  {
    id: 'static-prod-3',
    name: 'Ly sứ thủ công Ceramic Mug',
    code: 'IMG-VX-1003',
    url: '/assets/images/products/ceramic-mug.png',
    assetGroup: 'product',
    format: 'PNG',
    sizeLabel: '22.5 KB',
    dimensions: '800 × 800 px',
    usedIn: 'Sản phẩm VX-1003',
    isStatic: true,
  },
  {
    id: 'static-prod-4',
    name: 'Túi vải Canvas Tote Bag',
    code: 'IMG-VX-1004',
    url: '/assets/images/products/canvas-tote-bag.png',
    assetGroup: 'product',
    format: 'PNG',
    sizeLabel: '34.5 KB',
    dimensions: '800 × 800 px',
    usedIn: 'Sản phẩm VX-1004',
    isStatic: true,
  },
  {
    id: 'static-prod-5',
    name: 'Chuột không dây Wireless Mouse',
    code: 'IMG-VX-1005',
    url: '/assets/images/products/wireless-mouse.png',
    assetGroup: 'product',
    format: 'PNG',
    sizeLabel: '20.3 KB',
    dimensions: '800 × 800 px',
    usedIn: 'Sản phẩm VX-1005',
    isStatic: true,
  },
  {
    id: 'static-prod-6',
    name: 'Bình giữ nhiệt Water Bottle',
    code: 'IMG-VX-1006',
    url: '/assets/images/products/water-bottle.png',
    assetGroup: 'product',
    format: 'PNG',
    sizeLabel: '18.7 KB',
    dimensions: '800 × 800 px',
    usedIn: 'Sản phẩm VX-1006',
    isStatic: true,
  },
  {
    id: 'static-prod-7',
    name: 'Bộ sổ tay cao cấp Notebook Set',
    code: 'IMG-VX-1007',
    url: '/assets/images/products/notebook-set.png',
    assetGroup: 'product',
    format: 'PNG',
    sizeLabel: '38.4 KB',
    dimensions: '800 × 800 px',
    usedIn: 'Sản phẩm VX-1007',
    isStatic: true,
  },
  {
    id: 'static-prod-8',
    name: 'Áo khoác Linen Overshirt',
    code: 'IMG-VX-1008',
    url: '/assets/images/products/linen-overshirt.png',
    assetGroup: 'product',
    format: 'PNG',
    sizeLabel: '202.6 KB',
    dimensions: '1024 × 1024 px',
    usedIn: 'Sản phẩm VX-1008',
    isStatic: true,
  },
  {
    id: 'static-prod-9',
    name: 'Khăn choàng Cotton Throw',
    code: 'IMG-VX-1009',
    url: '/assets/images/products/cotton-throw.png',
    assetGroup: 'product',
    format: 'PNG',
    sizeLabel: '13.6 KB',
    dimensions: '800 × 800 px',
    usedIn: 'Sản phẩm VX-1009',
    isStatic: true,
  },
  {
    id: 'static-prod-10',
    name: 'Túi phụ kiện du lịch Travel Pouch',
    code: 'IMG-VX-1010',
    url: '/assets/images/products/travel-pouch.png',
    assetGroup: 'product',
    format: 'PNG',
    sizeLabel: '12.3 KB',
    dimensions: '800 × 800 px',
    usedIn: 'Sản phẩm VX-1010',
    isStatic: true,
  },
  {
    id: 'static-prod-11',
    name: 'Khay gỗ bàn làm việc Desk Organizer',
    code: 'IMG-VX-1011',
    url: '/assets/images/products/desk-organizer.png',
    assetGroup: 'product',
    format: 'PNG',
    sizeLabel: '12.6 KB',
    dimensions: '800 × 800 px',
    usedIn: 'Sản phẩm VX-1011',
    isStatic: true,
  },
  {
    id: 'static-prod-12',
    name: 'Tô gốm mộc Stoneware Bowl',
    code: 'IMG-VX-1012',
    url: '/assets/images/products/stoneware-bowl.png',
    assetGroup: 'product',
    format: 'PNG',
    sizeLabel: '14.6 KB',
    dimensions: '800 × 800 px',
    usedIn: 'Sản phẩm VX-1012',
    isStatic: true,
  },
  {
    id: 'static-banner-wh',
    name: 'Ảnh Trung tâm Kho vận Veylix Fulfillment',
    code: 'BNR-WAREHOUSE',
    url: '/assets/images/warehouse.webp',
    assetGroup: 'banner',
    format: 'WEBP',
    sizeLabel: '154.8 KB',
    dimensions: '1600 × 900 px',
    usedIn: 'Banner Kho & Giới thiệu',
    isStatic: true,
  },
  {
    id: 'static-vec-logo',
    name: 'Logo chính thức Veylix Studio (Full Wordmark)',
    code: 'VEC-LOGO-FULL',
    url: '/assets/images/veylix-logo.svg',
    assetGroup: 'vector',
    format: 'SVG',
    sizeLabel: '1.2 KB',
    dimensions: 'Vector vô cực',
    usedIn: 'Header, Hóa đơn & Storefront',
    isStatic: true,
  },
  {
    id: 'static-vec-mark',
    name: 'Biểu tượng rút gọn Veylix Mark',
    code: 'VEC-MARK-ICON',
    url: '/assets/images/veylix-mark.svg',
    assetGroup: 'vector',
    format: 'SVG',
    sizeLabel: '0.4 KB',
    dimensions: 'Vector vô cực',
    usedIn: 'Sidebar & Favicon',
    isStatic: true,
  },
  {
    id: 'static-vec-map',
    name: 'Bản đồ Mạng lưới Giao nhận Quốc tế',
    code: 'VEC-WORLD-MAP',
    url: '/assets/images/world-map.svg',
    assetGroup: 'vector',
    format: 'SVG',
    sizeLabel: '379.8 KB',
    dimensions: 'Vector bản đồ',
    usedIn: 'Tổng quan & Vận chuyển',
    isStatic: true,
  },
];

const KNOWN_SAFE_IMAGE_PATHS = new Set(BUILTIN_MEDIA_ASSETS.map((a) => a.url));

function isRenderableSafeImage(url) {
  if (!url || typeof url !== 'string') return false;
  if (KNOWN_SAFE_IMAGE_PATHS.has(url)) return true;
  if (url.startsWith('data:image/')) return true;
  return false;
}

export default function MediaGalleryView({ slug, navInfo }) {
  const isFilesMode = slug === 'files';

  const [dbRecords, setDbRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [lightboxItem, setLightboxItem] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newAssetForm, setNewAssetForm] = useState({
    name: '',
    presetUrl: '/assets/images/products/minimal-backpack.png',
    category: isFilesMode ? 'Tài liệu hướng dẫn PDF' : 'Ảnh sản phẩm Studio',
    sizeLabel: isFilesMode ? '420 KB' : '38 KB',
    notes: '',
  });

  const { toasts, showToast } = useToast();

  const loadDbAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await request(`/modules/${encodeURIComponent(slug)}?title=${encodeURIComponent(navInfo.title)}`);
      if (Array.isArray(data)) {
        setDbRecords(data);
      }
    } catch {
      setDbRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [slug, navInfo.title]);

  useEffect(() => {
    setActiveTab('all');
    setSearchQuery('');
    setLightboxItem(null);
    loadDbAssets();
  }, [slug, loadDbAssets]);

  // Hợp nhất tài nguyên tĩnh có thật + bản ghi lưu trong MongoDB
  const allItems = useMemo(() => {
    const mappedDb = dbRecords.map((r, idx) => {
      const candidateUrl = r.meta?.url || r.subtitle || '';
      const safeImg = isRenderableSafeImage(candidateUrl)
        ? candidateUrl
        : !isFilesMode
          ? BUILTIN_MEDIA_ASSETS[idx % 12].url
          : '';
      const extMatch = String(r.category || r.name || '').toUpperCase();
      const format = extMatch.includes('PDF')
        ? 'PDF'
        : extMatch.includes('CSV') || extMatch.includes('XLS')
          ? 'XLSX'
          : safeImg.endsWith('.svg')
            ? 'SVG'
            : safeImg.endsWith('.webp')
              ? 'WEBP'
              : isFilesMode
                ? 'PDF'
                : 'PNG';

      return {
        id: r.id,
        name: r.name,
        code: r.code,
        url: safeImg || `/files/${(r.code || 'doc').toLowerCase()}.pdf`,
        previewImg: safeImg,
        assetGroup: 'uploaded',
        format,
        sizeLabel: r.value || '120 KB',
        dimensions: r.category || (isFilesMode ? 'Tài liệu nội bộ' : 'Ảnh thương mại'),
        usedIn: r.notes || r.subtitle || `Phụ trách: ${r.owner || 'Alex Chen'}`,
        isStatic: false,
        rawRecord: r,
      };
    });

    if (isFilesMode) {
      const brandVectors = BUILTIN_MEDIA_ASSETS.filter((a) => a.assetGroup === 'vector').map((a) => ({
        ...a,
        previewImg: a.url,
      }));
      return [...mappedDb, ...brandVectors];
    }

    const staticWithPreview = BUILTIN_MEDIA_ASSETS.map((a) => ({
      ...a,
      previewImg: a.url,
    }));
    return [...staticWithPreview, ...mappedDb];
  }, [dbRecords, isFilesMode]);

  const filterTabs = useMemo(() => {
    if (isFilesMode) {
      return [
        { id: 'all', label: 'Tất cả tệp tin', icon: '🗂️', count: allItems.length },
        { id: 'uploaded', label: 'Tài liệu & Biểu mẫu PDF', icon: '📄', count: allItems.filter((i) => i.assetGroup === 'uploaded').length },
        { id: 'vector', label: 'Bộ Logo & Vector gốc', icon: '🎨', count: allItems.filter((i) => i.assetGroup === 'vector').length },
      ];
    }
    return [
      { id: 'all', label: 'Tất cả tài nguyên', icon: '🖼️', count: allItems.length },
      { id: 'product', label: 'Ảnh sản phẩm (12)', icon: '👕', count: allItems.filter((i) => i.assetGroup === 'product').length },
      { id: 'banner', label: 'Banner & Kho vận', icon: '🏞️', count: allItems.filter((i) => i.assetGroup === 'banner').length },
      { id: 'vector', label: 'Logo & Vector SVG', icon: '✨', count: allItems.filter((i) => i.assetGroup === 'vector').length },
      { id: 'uploaded', label: 'Bản ghi bổ sung', icon: '☁️', count: allItems.filter((i) => i.assetGroup === 'uploaded').length },
    ];
  }, [allItems, isFilesMode]);

  const visibleItems = useMemo(() => {
    return allItems.filter((item) => {
      if (activeTab !== 'all' && item.assetGroup !== activeTab) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = `${item.name} ${item.code} ${item.url} ${item.format} ${item.usedIn}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allItems, activeTab, searchQuery]);

  const handleCopyUrl = async (item) => {
    await copyToClipboard(item.url);
    setCopiedId(item.id);
    showToast(`Đã sao chép đường dẫn: ${item.url}`);
    setTimeout(() => {
      setCopiedId((prev) => (prev === item.id ? null : prev));
    }, 2000);
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    if (!newAssetForm.name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const created = await request(`/modules/${encodeURIComponent(slug)}`, {
        method: 'POST',
        body: {
          name: newAssetForm.name.trim(),
          category: newAssetForm.category,
          subtitle: isFilesMode ? '' : newAssetForm.presetUrl,
          value: newAssetForm.sizeLabel || '45 KB',
          count: 1,
          status: 'Hoạt động',
          statusClass: 'green',
          notes: newAssetForm.notes.trim() || 'Đã sẵn sàng sử dụng trên Storefront & Admin',
          meta: { url: isFilesMode ? '' : newAssetForm.presetUrl },
        },
      });
      if (created && created.id) {
        setDbRecords((prev) => [created, ...prev]);
      } else {
        await loadDbAssets();
      }
      setIsAddOpen(false);
      setNewAssetForm({
        name: '',
        presetUrl: '/assets/images/products/minimal-backpack.png',
        category: isFilesMode ? 'Tài liệu hướng dẫn PDF' : 'Ảnh sản phẩm Studio',
        sizeLabel: isFilesMode ? '420 KB' : '38 KB',
        notes: '',
      });
      showToast(`Đã thêm "${newAssetForm.name.trim()}" vào thư viện!`);
    } catch (err) {
      showToast(err.message || 'Không thể lưu tài nguyên mới', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDbItem = async () => {
    if (!deletingItem || deletingItem.isStatic || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await request(`/modules/${encodeURIComponent(slug)}/${encodeURIComponent(deletingItem.id)}`, {
        method: 'DELETE',
      });
      setDbRecords((prev) => prev.filter((r) => r.id !== deletingItem.id));
      setDeletingItem(null);
      setLightboxItem(null);
      showToast(`Đã xóa "${deletingItem.name}" khỏi thư viện!`);
    } catch (err) {
      showToast(err.message || 'Không thể xóa mục này', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['Tên tài nguyên', 'Mã', 'Định dạng', 'Dung lượng', 'Đường dẫn URL', 'Đang sử dụng tại'];
    const rows = visibleItems.map((i) => [i.name, i.code, i.format, i.sizeLabel, i.url, i.usedIn]);
    exportCsvFile(`thu_vien_${slug}_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    showToast(`Đã xuất danh mục ${visibleItems.length} tệp ra file CSV!`);
  };

  return (
    <div className="general-commerce-page" style={{ paddingBottom: '40px' }}>
      <PageHeader
        navInfo={navInfo}
        subtitle={
          isFilesMode
            ? 'Lưu trữ tập trung bảng chọn size, chính sách PDF, hợp đồng đối tác và bộ nhận diện Vector gốc.'
            : 'Kho hình ảnh sản phẩm chuẩn Studio, Banner cửa hàng và Logo thương hiệu sẵn sàng sao chép URL trong 1 chạm.'
        }
      >
        <button type="button" className="secondary-button" onClick={handleExportCsv}>
          Xuất danh mục CSV
        </button>
        <button type="button" className="primary-button" onClick={() => setIsAddOpen(true)}>
          + {isFilesMode ? 'Thêm tệp tài liệu' : 'Thêm ảnh vào thư viện'}
        </button>
      </PageHeader>

      <QuickGuideBanner
        icon={isFilesMode ? '📂' : '🖼️'}
        title={
          isFilesMode
            ? 'Quản lý Tệp tin & Chứng từ dễ dàng:'
            : 'Cách lấy ảnh gắn vào Sản phẩm hoặc Banner cửa hàng:'
        }
        steps={[
          'Chọn nhóm ảnh/tệp ở thanh Tab bên dưới',
          'Bấm "🔍 Xem phóng to" để kiểm tra độ nét',
          'Bấm "📋 Sao chép URL" rồi dán thẳng vào Sản phẩm hoặc SEO/Banner',
        ]}
        rightSlot={
          <Link to="/commerce/products" className="secondary-button" style={{ fontSize: '12.5px', padding: '6px 12px' }}>
            Tới trang Sản phẩm →
          </Link>
        }
      />

      {/* 4 THẺ KPI */}
      <section className="order-summary-grid" style={{ marginBottom: '20px' }}>
        <div className="order-summary-card green">
          <div>
            <small>Tổng tài nguyên sẵn có</small>
            <strong>{allItems.length}</strong>
            <em>100% đường dẫn hoạt động ổn định</em>
          </div>
        </div>
        <div className="order-summary-card blue">
          <div>
            <small>Ảnh sản phẩm Studio</small>
            <strong>{BUILTIN_MEDIA_ASSETS.filter((a) => a.assetGroup === 'product').length}</strong>
            <em>Nền trong suốt chuẩn thương mại</em>
          </div>
        </div>
        <div className="order-summary-card amber">
          <div>
            <small>Logo & Vector thương hiệu</small>
            <strong>{BUILTIN_MEDIA_ASSETS.filter((a) => a.assetGroup === 'vector').length}</strong>
            <em>Định dạng SVG sắc nét mọi kích cỡ</em>
          </div>
        </div>
        <div className="order-summary-card purple">
          <div>
            <small>Bản ghi lưu trên CSDL</small>
            <strong>{dbRecords.length}</strong>
            <em>{isLoading ? 'Đang đồng bộ...' : 'Đồng bộ trực tiếp MongoDB'}</em>
          </div>
        </div>
      </section>

      {/* THANH LỌC TAB 1 CHẠM + TÌM KIẾM */}
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
            placeholder="Tìm tên ảnh, mã SKU, định dạng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Tìm kiếm tài nguyên"
          />
        </label>
      </section>

      {/* LƯỚI THẺ HÌNH ẢNH & TÀI NGUYÊN TRỰC QUAN */}
      {visibleItems.length === 0 ? (
        <section className="glass-card" style={{ padding: '44px 20px', textAlign: 'center', color: '#756a59' }}>
          Không tìm thấy tệp hoặc hình ảnh nào khớp với từ khóa tìm kiếm.
        </section>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(245px, 1fr))',
            gap: '16px',
          }}
        >
          {visibleItems.map((item) => {
            const isCopied = copiedId === item.id;
            return (
              <article
                key={item.id}
                className="glass-card"
                style={{
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'transform 0.16s ease, box-shadow 0.16s ease',
                }}
              >
                {/* Khung xem trước ảnh / biểu tượng tài liệu */}
                <div
                  onClick={() => setLightboxItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setLightboxItem(item)}
                  style={{
                    position: 'relative',
                    height: '168px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f5efe3 0%, #ebe1cf 100%)',
                    border: '1px solid rgba(195, 180, 155, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    padding: '12px',
                  }}
                >
                  {item.previewImg ? (
                    <img
                      src={item.previewImg}
                      alt={item.name}
                      loading="lazy"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: item.assetGroup === 'banner' ? 'cover' : 'contain',
                        borderRadius: item.assetGroup === 'banner' ? '8px' : 0,
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '42px', lineHeight: 1 }}>📄</div>
                      <strong style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: '#4d4233' }}>
                        {item.format} DOCUMENT
                      </strong>
                    </div>
                  )}

                  <span
                    className={`badge badge-${item.format === 'SVG' ? 'purple' : item.format === 'WEBP' ? 'amber' : item.format === 'PDF' ? 'red' : 'green'}`}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      fontSize: '10.5px',
                      padding: '2px 7px',
                      borderRadius: '6px',
                    }}
                  >
                    {item.format}
                  </span>

                  <span
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'rgba(37, 33, 29, 0.72)',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {item.sizeLabel}
                  </span>
                </div>

                {/* Thông tin */}
                <div style={{ flex: 1 }}>
                  <strong
                    style={{
                      fontSize: '13.5px',
                      color: '#272016',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={item.name}
                  >
                    {item.name}
                  </strong>
                  <small style={{ display: 'block', color: '#756a59', fontSize: '12px', marginTop: '2px' }}>
                    {item.dimensions} · {item.usedIn}
                  </small>
                  <code
                    style={{
                      display: 'block',
                      marginTop: '6px',
                      fontSize: '11px',
                      background: '#f6f0e4',
                      padding: '4px 7px',
                      borderRadius: '6px',
                      color: '#524636',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={item.url}
                  >
                    {item.url}
                  </code>
                </div>

                {/* Nút hành động trực tiếp */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ flex: 1, justifyContent: 'center', padding: '6px 8px', fontSize: '12px' }}
                    onClick={() => setLightboxItem(item)}
                  >
                    🔍 Xem lớn
                  </button>
                  <button
                    type="button"
                    className={isCopied ? 'primary-button' : 'secondary-button'}
                    style={{ flex: 1.2, justifyContent: 'center', padding: '6px 8px', fontSize: '12px' }}
                    onClick={() => handleCopyUrl(item)}
                  >
                    {isCopied ? '✓ Đã chép URL' : '📋 Sao chép URL'}
                  </button>
                  {!item.isStatic && (
                    <button
                      type="button"
                      className="secondary-button"
                      title="Xóa bản ghi"
                      style={{ padding: '6px 8px', fontSize: '12px', color: '#b23b3b' }}
                      onClick={() => setDeletingItem(item)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* MODAL LIGHTBOX XEM PHÓNG TO */}
      <DialogModal
        isOpen={Boolean(lightboxItem)}
        wide
        onClose={() => setLightboxItem(null)}
        title={lightboxItem ? `Chi tiết tài nguyên: ${lightboxItem.name}` : ''}
      >
        {lightboxItem && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', alignItems: 'center' }}>
            <div
              style={{
                background: '#f5efe3',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '260px',
                border: '1px solid #dfd3bd',
              }}
            >
              {lightboxItem.previewImg ? (
                <img
                  src={lightboxItem.previewImg}
                  alt={lightboxItem.name}
                  style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '64px' }}>📄</div>
                  <strong>{lightboxItem.format}</strong>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
              <div>
                <small style={{ color: '#756a59', display: 'block' }}>Tên tài nguyên</small>
                <strong style={{ fontSize: '16px', color: '#272016' }}>{lightboxItem.name}</strong>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '12px', background: '#f6f0e4', borderRadius: '10px' }}>
                <div>
                  <small style={{ color: '#756a59', display: 'block' }}>Mã định danh</small>
                  <strong>{lightboxItem.code}</strong>
                </div>
                <div>
                  <small style={{ color: '#756a59', display: 'block' }}>Định dạng & Dung lượng</small>
                  <strong>{lightboxItem.format} · {lightboxItem.sizeLabel}</strong>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <small style={{ color: '#756a59', display: 'block' }}>Kích thước / Phân loại</small>
                  <strong>{lightboxItem.dimensions}</strong>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <small style={{ color: '#756a59', display: 'block' }}>Vị trí sử dụng</small>
                  <span>{lightboxItem.usedIn}</span>
                </div>
              </div>

              <div>
                <small style={{ color: '#756a59', display: 'block', marginBottom: '4px' }}>Đường dẫn nhúng trực tiếp (URL):</small>
                <input
                  type="text"
                  readOnly
                  className="c-field"
                  style={FIELD_INPUT_STYLE}
                  value={lightboxItem.url}
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                {!lightboxItem.isStatic && (
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ color: '#b23b3b' }}
                    onClick={() => setDeletingItem(lightboxItem)}
                  >
                    Xóa tài nguyên
                  </button>
                )}
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handleCopyUrl(lightboxItem)}
                >
                  📋 Sao chép URL ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogModal>

      {/* MODAL THÊM TÀI NGUYÊN MỚI */}
      <DialogModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={isFilesMode ? 'Thêm tài liệu / biểu mẫu mới' : 'Đăng ký ảnh thương mại mới vào thư viện'}
      >
        <form onSubmit={handleCreateAsset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={FIELD_LABEL_STYLE}>Tên hiển thị của ảnh / tệp *</label>
            <input
              type="text"
              required
              className="c-field"
              style={FIELD_INPUT_STYLE}
              placeholder={isFilesMode ? 'VD: Bảng quy đổi kích cỡ Áo khoác 2026.pdf' : 'VD: Lookbook Mùa Thu — Minimal Backpack'}
              value={newAssetForm.name}
              onChange={(e) => setNewAssetForm({ ...newAssetForm, name: e.target.value })}
            />
          </div>

          {!isFilesMode && (
            <div>
              <label style={FIELD_LABEL_STYLE}>Chọn nguồn ảnh có sẵn trên CDN</label>
              <select
                className="c-field"
                style={FIELD_INPUT_STYLE}
                value={newAssetForm.presetUrl}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, presetUrl: e.target.value })}
              >
                {BUILTIN_MEDIA_ASSETS.map((a) => (
                  <option key={a.id} value={a.url}>
                    {a.name} ({a.url})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={FIELD_LABEL_STYLE}>Nhóm phân loại</label>
              <input
                type="text"
                className="c-field"
                style={FIELD_INPUT_STYLE}
                value={newAssetForm.category}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, category: e.target.value })}
              />
            </div>
            <div>
              <label style={FIELD_LABEL_STYLE}>Dung lượng ước tính</label>
              <input
                type="text"
                className="c-field"
                style={FIELD_INPUT_STYLE}
                value={newAssetForm.sizeLabel}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, sizeLabel: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={FIELD_LABEL_STYLE}>Ghi chú vị trí sử dụng</label>
            <textarea
              rows={2}
              className="c-field"
              style={FIELD_INPUT_STYLE}
              placeholder="VD: Dùng cho chiến dịch khuyến mãi trang chủ tháng 5..."
              value={newAssetForm.notes}
              onChange={(e) => setNewAssetForm({ ...newAssetForm, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="secondary-button" onClick={() => setIsAddOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu vào thư viện'}
            </button>
          </div>
        </form>
      </DialogModal>

      <ConfirmDialog
        isOpen={Boolean(deletingItem)}
        danger
        title="Xóa tài nguyên khỏi thư viện"
        message={deletingItem ? `Bạn có chắc chắn muốn xóa "${deletingItem.name}" khỏi danh sách lưu trữ?` : ''}
        confirmLabel="Xóa ngay"
        isSubmitting={isSubmitting}
        onConfirm={handleDeleteDbItem}
        onClose={() => setDeletingItem(null)}
      />

      <ToastStack toasts={toasts} />
    </div>
  );
}
