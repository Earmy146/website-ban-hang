import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../../services/api';
import {
  PageHeader,
  QuickGuideBanner,
  ToastStack,
  useToast,
  copyToClipboard,
  FIELD_INPUT_STYLE,
  FIELD_LABEL_STYLE,
} from './commonWidgets';
import ResourceModuleView from './ResourceModuleView';

const AI_TASKS = [
  {
    id: 'seo',
    label: 'Viết mô tả sản phẩm chuẩn SEO',
    icon: '🔍',
    placeholder: 'VD: Nhấn mạnh chất vải thoáng khí, chống nhăn, phù hợp đi làm và dạo phố cuối tuần...',
    samplePrompts: [
      'Tối ưu từ khóa thời trang công sở tối giản, chất liệu bền vững thân thiện môi trường',
      'Nhấn mạnh khả năng chống nước IPX4 và ngăn chống sốc laptop 15.6 inch cho dân văn phòng',
    ],
  },
  {
    id: 'email',
    label: 'Soạn Email khuyến mãi',
    icon: '✉️',
    placeholder: 'VD: Giới thiệu ưu đãi mở bán bộ sưu tập mới kèm mã giảm giá HELLO10 cho khách VIP...',
    samplePrompts: [
      'Gửi thư tri ân khách hàng thân thiết tặng mã HELLO10 giảm 10% nhân dịp ra mắt mùa mới',
      'Khôi phục giỏ hàng bỏ quên tinh tế, nhắc ưu đãi miễn phí vận chuyển toàn quốc',
    ],
  },
  {
    id: 'reply',
    label: 'Trả lời khiếu nại CSKH',
    icon: '💬',
    placeholder: 'VD: Khách báo bưu kiện giao chậm 1 ngày do mưa lớn và muốn kiểm tra hành trình đơn...',
    samplePrompts: [
      'Xin lỗi khách vì đơn vận chuyển trễ 1 ngày do thời tiết và gửi tặng voucher ưu đãi lần sau',
      'Hướng dẫn khách quy trình đổi size áo miễn phí tại nhà trong vòng 30 ngày',
    ],
  },
  {
    id: 'social',
    label: 'Bài đăng Social Media',
    icon: '✨',
    placeholder: 'VD: Bài đăng Instagram / Facebook ngắn gọn kèm hashtag giới thiệu góc làm việc tối giản...',
    samplePrompts: [
      'Bài viết truyền cảm hứng sống tối giản buổi sáng cùng sản phẩm chủ đạo của Veylix Studio',
      'Thông báo Flash Sale cuối tuần giới hạn số lượng kèm lời kêu gọi hành động cuốn hút',
    ],
  },
];

const TONE_OPTIONS = [
  'Sang trọng & Tinh tế',
  'Chuyên nghiệp & Đáng tin cậy',
  'Thân thiện & Gần gũi',
  'Thuyết phục & Thúc đẩy chuyển đổi',
  'Đồng cảm & Tận tâm (CSKH)',
];

function AiStudioInteractivePage({ navInfo }) {
  const [taskType, setTaskType] = useState('seo');
  const [productName, setProductName] = useState('Balo tối giản Minimal Backpack');
  const [promptText, setPromptText] = useState(
    'Nhấn mạnh thiết kế tối giản chuẩn Bắc Âu, chống nước IPX4 và ngăn chống sốc laptop 15.6 inch'
  );
  const [tone, setTone] = useState(TONE_OPTIONS[0]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);

  const { toasts, showToast } = useToast();

  const loadContextData = useCallback(async () => {
    const [prods, hist] = await Promise.all([
      request('/products').catch(() => []),
      request('/modules/ai-history?title=Lịch sử AI').catch(() => []),
    ]);
    if (Array.isArray(prods)) {
      const active = prods.filter((p) => !p.isDeleted);
      setCatalogProducts(active);
    }
    if (Array.isArray(hist)) {
      setHistoryItems(hist);
    }
  }, []);

  useEffect(() => {
    loadContextData();
  }, [loadContextData]);

  const currentTaskMeta = AI_TASKS.find((t) => t.id === taskType) || AI_TASKS[0];

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!promptText.trim() && !productName.trim()) {
      showToast('Vui lòng nhập tên sản phẩm hoặc yêu cầu nội dung cho AI!', 'error');
      return;
    }
    if (isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await request('/ai/generate', {
        method: 'POST',
        body: {
          type: taskType,
          productName: productName.trim(),
          prompt: promptText.trim() || productName.trim(),
          tone,
        },
      });

      setResultData(res);
      if (res?.historyRecord) {
        setHistoryItems((prev) => [res.historyRecord, ...prev.filter((h) => h.id !== res.historyRecord.id)]);
      } else {
        const refreshed = await request('/modules/ai-history?title=Lịch sử AI').catch(() => null);
        if (Array.isArray(refreshed)) setHistoryItems(refreshed);
      }
      showToast('Đã tạo nội dung bằng AI và lưu vào lịch sử thành công!');
    } catch (err) {
      showToast(err.message || 'Không thể sinh nội dung AI lúc này', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (content, label = 'nội dung AI') => {
    if (!content) return;
    await copyToClipboard(content);
    showToast(`Đã sao chép ${label} vào bộ nhớ tạm!`);
  };

  return (
    <div className="general-commerce-page" style={{ paddingBottom: '40px' }}>
      <PageHeader
        navInfo={navInfo}
        subtitle="Không gian sáng tạo nội dung thương mại thông minh dựa trên dữ liệu sản phẩm thật trong kho Veylix."
      >
        <Link to="/commerce/prompts" className="secondary-button">
          Thư viện Prompts
        </Link>
        <Link to="/commerce/ai-history" className="secondary-button">
          Lịch sử AI ({historyItems.length})
        </Link>
      </PageHeader>

      <QuickGuideBanner
        icon="🪄"
        title="Soạn nội dung bán hàng bằng AI chỉ trong 10 giây:"
        steps={[
          'Chọn 1 trong 4 tác vụ (Mô tả SEO, Email ưu đãi, Phản hồi CSKH, Bài đăng Social)',
          'Chọn sản phẩm có sẵn trong kho hoặc bấm chip Mẫu gợi ý để điền nhanh yêu cầu',
          'Bấm "✨ Tạo nội dung bằng AI" rồi bấm "📋 Sao chép nội dung" để sử dụng ngay',
        ]}
      />

      {/* Chọn tác vụ AI 4 thẻ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        {AI_TASKS.map((t) => {
          const active = taskType === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTaskType(t.id)}
              className="glass-card"
              style={{
                padding: '15px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                border: active ? '2px solid #27342b' : '1px solid rgba(212, 200, 184, 0.7)',
                background: active ? '#f2ece0' : undefined,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '22px' }}>{t.icon}</span>
              <div>
                <strong style={{ display: 'block', fontSize: '13.5px', color: '#272016' }}>{t.label}</strong>
                <small style={{ color: '#756a59', fontSize: '11.5px' }}>
                  {active ? 'Đang chọn tác vụ này' : 'Nhấn để chuyển tác vụ'}
                </small>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', alignItems: 'start' }}>
        {/* CỘT NHẬP THÔNG TIN ĐẦU VÀO */}
        <form onSubmit={handleGenerate} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#8a5a00', letterSpacing: '0.6px' }}>
              THIẾT LẬP ĐẦU VÀO CHO AI
            </span>
            <h2 style={{ margin: '2px 0 0 0', fontSize: '17.5px', fontWeight: 750 }}>
              {currentTaskMeta.icon} {currentTaskMeta.label}
            </h2>
          </div>

          <div>
            <label style={FIELD_LABEL_STYLE}>Chọn nhanh sản phẩm từ danh mục hoặc tự nhập tên *</label>
            {catalogProducts.length > 0 && (
              <select
                className="c-field"
                style={{ ...FIELD_INPUT_STYLE, marginBottom: '8px' }}
                value={catalogProducts.some((p) => p.name === productName) ? productName : ''}
                onChange={(e) => {
                  if (e.target.value) setProductName(e.target.value);
                }}
                aria-label="Chọn sản phẩm có sẵn"
              >
                <option value="">-- Chọn sản phẩm thực tế trong kho để nạp thông số --</option>
                {catalogProducts.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.sku} · ${p.price})
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              required
              className="c-field"
              style={FIELD_INPUT_STYLE}
              placeholder="Nhập tên sản phẩm hoặc chủ đề..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div>
            <label style={FIELD_LABEL_STYLE}>Giọng văn thương hiệu (Brand Tone)</label>
            <select
              className="c-field"
              style={FIELD_INPUT_STYLE}
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              {TONE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={FIELD_LABEL_STYLE}>Yêu cầu chi tiết / Điểm nhấn cần truyền tải *</label>
            <textarea
              rows={4}
              required
              className="c-field"
              style={FIELD_INPUT_STYLE}
              placeholder={currentTaskMeta.placeholder}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {currentTaskMeta.samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPromptText(sp)}
                  style={{
                    fontSize: '11.5px',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    border: '1px solid #d7cbb8',
                    background: '#faf6ee',
                    color: '#524738',
                    cursor: 'pointer',
                  }}
                >
                  💡 Mẫu gợi ý #{idx + 1}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={isGenerating}
            style={{ justifyContent: 'center', padding: '11px 20px', fontSize: '14px' }}
          >
            {isGenerating ? '✨ AI đang biên soạn nội dung...' : '✨ Tạo nội dung bằng AI'}
          </button>
        </form>

        {/* CỘT KẾT QUẢ SINH NỘI DUNG */}
        <section className="glass-card" style={{ padding: '24px', minHeight: '410px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', letterSpacing: '0.6px' }}>
                KẾT QUẢ ĐẦU RA TỪ VEYLIX AI
              </span>
              <h2 style={{ margin: '2px 0 0 0', fontSize: '17px', fontWeight: 750 }}>
                {resultData?.title || 'Bản thảo nội dung thương mại'}
              </h2>
            </div>

            {resultData?.content && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => handleCopy(resultData.content, 'kết quả AI')}
              >
                📋 Sao chép nội dung
              </button>
            )}
          </div>

          {resultData?.content ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  flex: 1,
                  whiteSpace: 'pre-wrap',
                  padding: '18px',
                  borderRadius: '14px',
                  background: '#fffdf9',
                  border: '1px solid #dfd3bd',
                  fontSize: '13.5px',
                  lineHeight: 1.65,
                  color: '#25211d',
                }}
              >
                {resultData.content}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#756a59' }}>
                <span>
                  Giọng văn: <strong>{resultData.tone}</strong> · Độ dài: <strong>{resultData.content.length} ký tự</strong>
                </span>
                <span>Đã lưu tự động vào Lịch sử AI</span>
              </div>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '32px 20px',
                background: 'rgba(246, 240, 228, 0.55)',
                borderRadius: '14px',
                border: '1px dashed #d4c6b0',
                color: '#6e6353',
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🪄</div>
              <strong style={{ fontSize: '15px', color: '#272016', marginBottom: '6px' }}>
                Sẵn sàng khởi tạo nội dung chuẩn thương hiệu
              </strong>
              <p style={{ margin: 0, fontSize: '13px', maxWidth: '360px', lineHeight: 1.55 }}>
                Chọn loại tác vụ, sản phẩm mục tiêu và bấm <strong>"Tạo nội dung bằng AI"</strong> để nhận ngay bản viết hoàn chỉnh gắn thông số sản phẩm thực tế.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* LỊCH SỬ TẠO NỘI DUNG GẦN ĐÂY */}
      <section className="glass-card c-resource" style={{ marginTop: '20px' }}>
        <div className="product-list-heading">
          <div>
            <span>LƯU TRỮ TỰ ĐỘNG</span>
            <h2>Lịch sử nội dung AI vừa khởi tạo</h2>
          </div>
          <small>{historyItems.length} bản ghi lịch sử</small>
        </div>

        <div className="table-scroll c-table-scroll" tabIndex="0" role="region" aria-label="Lịch sử AI">
          <table className="c-table">
            <thead>
              <tr>
                <th>Tiêu đề bản thảo</th>
                <th>Loại tác vụ</th>
                <th>Ngữ cảnh & Giọng văn</th>
                <th>Thời gian</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {historyItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: '#776c5b' }}>
                    Chưa có bản ghi lịch sử nào. Hãy bấm tạo nội dung đầu tiên ở trên!
                  </td>
                </tr>
              ) : (
                historyItems.slice(0, 8).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong style={{ fontSize: '13.5px', color: '#272016' }}>{item.name}</strong>
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '11.5px', padding: '3px 8px', borderRadius: '6px' }}>
                        {item.value || item.category || 'AI'}
                      </span>
                    </td>
                    <td>
                      <small style={{ color: '#5c5243' }}>{item.subtitle || 'Veylix AI Studio'}</small>
                    </td>
                    <td>
                      <small>{item.date || 'Vừa xong'}</small>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="secondary-button"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          onClick={() =>
                            setResultData({
                              title: item.name,
                              content: item.notes || item.subtitle || item.name,
                              tone: item.subtitle || 'Sang trọng & Tinh tế',
                            })
                          }
                        >
                          Xem lại
                        </button>
                        {item.notes && (
                          <button
                            type="button"
                            className="secondary-button"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => handleCopy(item.notes, `"${item.name}"`)}
                          >
                            Sao chép
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

      <ToastStack toasts={toasts} />
    </div>
  );
}

export default function AiWorkspaceView({ slug, navInfo }) {
  if (slug === 'ai-studio') {
    return <AiStudioInteractivePage navInfo={navInfo} />;
  }

  // Các phân hệ con của Trợ lý AI (ai-voice, prompts, knowledge, automations, ai-history):
  // Tích hợp thanh điều hướng nhanh tới AI Studio + Quản trị danh sách chuyên sâu
  return (
    <ResourceModuleView
      slug={slug}
      navInfo={navInfo}
      topSlot={
        <div
          className="glass-card"
          style={{
            padding: '15px 20px',
            marginBottom: '18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'linear-gradient(120deg, #faf5ea 0%, #f3ead8 100%)',
          }}
        >
          <div style={{ fontSize: '13.5px', color: '#3b3123' }}>
            <strong>✨ Không gian Trợ lý AI Thương mại:</strong> Mọi mẫu câu lệnh, nguồn tri thức và quy tắc dưới đây được liên kết trực tiếp với trình sinh nội dung AI Studio.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/commerce/ai-studio" className="primary-button" style={{ padding: '7px 14px', fontSize: '12.5px' }}>
              Mở AI Studio soạn nội dung →
            </Link>
            <Link to="/commerce/ai-workflows" className="secondary-button" style={{ padding: '7px 14px', fontSize: '12.5px' }}>
              Quy trình tự động
            </Link>
          </div>
        </div>
      }
    />
  );
}
