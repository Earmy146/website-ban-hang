import React, { useState, useMemo } from 'react';
import { SfIcon } from '../../components/storefront/StoreIcons';
import { useStore } from '../../components/storefront/StoreContext';
import { storeApi } from '../../components/storefront/storeApi';

const FALLBACK_FAQS = [
  {
    id: 'default-1',
    question: 'Chính sách đổi trả 30 ngày tại Veylix Studio áp dụng như thế nào?',
    answer:
      'Mọi sản phẩm còn nguyên tem mác, chưa qua giặt ủi hoặc sử dụng đều được hỗ trợ đổi size, đổi mẫu hoặc hoàn tiền 100% trong vòng 30 ngày kể từ ngày nhận hàng.',
    category: 'Đổi trả & Hoàn tiền',
  },
  {
    id: 'default-2',
    question: 'Đơn hàng bao nhiêu thì được Miễn phí vận chuyển?',
    answer:
      'Hệ thống tự động miễn phí vận chuyển tiêu chuẩn trên toàn quốc cho đơn hàng từ $90 trở lên, hoặc khi bạn áp dụng mã ưu đãi miễn phí vận chuyển hợp lệ.',
    category: 'Vận chuyển',
  },
  {
    id: 'default-3',
    question: 'Làm sao để kiểm tra tiến độ giao hàng sau khi đặt?',
    answer:
      'Sau khi đặt hàng thành công, bạn nhận ngay mã đơn #SFxxxxx và mã vận đơn TRK-xxxxx. Chỉ cần mở mục "Tra cứu đơn" trên thanh menu để theo dõi trực tiếp 4 bước giao nhận.',
    category: 'Đơn hàng',
  },
  {
    id: 'default-4',
    question: 'Cửa hàng hỗ trợ những phương thức thanh toán nào?',
    answer:
      'Veylix Studio hỗ trợ đầy đủ Thanh toán khi nhận hàng (COD), Quét mã VNPay QR, Ví điện tử MoMo và Thẻ quốc tế Visa/Mastercard qua cổng Stripe bảo mật.',
    category: 'Thanh toán',
  },
];

export default function StoreSupportPage() {
  const { homeData, customer, showToast } = useStore();
  const settings = homeData.settings || {};

  const faqs = useMemo(() => {
    return homeData.faqs?.length > 0 ? homeData.faqs : FALLBACK_FAQS;
  }, [homeData.faqs]);

  const [openFaqId, setOpenFaqId] = useState(() => faqs[0]?.id || null);
  const [faqQuery, setFaqQuery] = useState('');

  const [contactForm, setContactForm] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    subject: 'Tư vấn sản phẩm & Đơn hàng',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const filteredFaqs = useMemo(() => {
    const q = faqQuery.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter(
      (f) =>
        String(f.question || '').toLowerCase().includes(q) ||
        String(f.answer || '').toLowerCase().includes(q)
    );
  }, [faqs, faqQuery]);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim() || sending) {
      showToast('Vui lòng điền đầy đủ Họ tên, Email và Nội dung tin nhắn', 'error');
      return;
    }

    try {
      setSending(true);
      await storeApi.submitContactMessage({
        name: `${contactForm.name.trim()} — ${contactForm.subject}`,
        subtitle: contactForm.email.trim(),
        category: contactForm.subject,
        owner: contactForm.phone.trim() || contactForm.email.trim(),
        status: 'Mới tiếp nhận',
        statusClass: 'amber',
        count: 1,
        value: contactForm.email.trim(),
        notes: contactForm.message.trim(),
        meta: {
          customerName: contactForm.name.trim(),
          email: contactForm.email.trim(),
          phone: contactForm.phone.trim(),
          subject: contactForm.subject,
          message: contactForm.message.trim(),
        },
      });
      setSentSuccess(true);
      setContactForm((prev) => ({ ...prev, message: '' }));
      showToast('Tin nhắn của bạn đã được gửi tới bộ phận CSKH Veylix!');
    } catch (err) {
      showToast(err.message || 'Không thể gửi liên hệ lúc này', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="sf-container">
      <div style={{ marginTop: '28px' }}>
        <span className="sf-eyebrow">Trung tâm chăm sóc khách hàng</span>
        <h1 className="sf-section-title">Hỗ trợ & Câu hỏi thường gặp (FAQ)</h1>
        <p className="sf-section-sub">
          Giải đáp tức thì mọi thắc mắc về vận chuyển, đổi trả, bảo hành hoặc gửi yêu cầu trực tiếp tới đội ngũ quản trị cửa hàng.
        </p>
      </div>

      {/* Contact Channels Strip */}
      <section className="sf-trust-strip">
        <div className="sf-trust-item">
          <span className="sf-trust-icon">📞</span>
          <div>
            <strong>Hotline CSKH</strong>
            <small>{settings.supportPhone || '+84 28 3822 1234'}</small>
          </div>
        </div>
        <div className="sf-trust-item">
          <span className="sf-trust-icon">✉️</span>
          <div>
            <strong>Email Hỗ trợ</strong>
            <small>{settings.supportEmail || 'support@veylix.vn'}</small>
          </div>
        </div>
        <div className="sf-trust-item">
          <span className="sf-trust-icon">📍</span>
          <div>
            <strong>Showroom Chính</strong>
            <small>{settings.city || 'Quận 1, TP. Hồ Chí Minh'}</small>
          </div>
        </div>
        <div className="sf-trust-item">
          <span className="sf-trust-icon">🕒</span>
          <div>
            <strong>Giờ làm việc</strong>
            <small>08:30 – 21:30 (Thứ 2 – CN)</small>
          </div>
        </div>
      </section>

      <div className="sf-checkout-grid" style={{ marginTop: '32px' }}>
        {/* Left: FAQ Accordion */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '21px', fontWeight: 800 }}>Câu hỏi thường gặp ({filteredFaqs.length})</h2>
            <input
              type="search"
              className="sf-input"
              style={{ maxWidth: '240px', padding: '8px 12px' }}
              placeholder="Tìm nhanh câu hỏi..."
              value={faqQuery}
              onChange={(e) => setFaqQuery(e.target.value)}
            />
          </div>

          <div className="sf-faq-list">
            {filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className="sf-faq-item">
                  <button
                    type="button"
                    className="sf-faq-trigger"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  >
                    <span>{faq.question}</span>
                    <span
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                        display: 'inline-flex',
                      }}
                    >
                      <SfIcon name="chevron-down" size={18} />
                    </span>
                  </button>
                  {isOpen && <div className="sf-faq-answer">{faq.answer}</div>}
                </div>
              );
            })}
          </div>
        </section>

        {/* Right: Direct Contact Form -> POST /api/modules/contacts */}
        <section className="sf-card">
          <h2>Gửi tin nhắn liên hệ</h2>
          <p style={{ fontSize: '13.5px', color: 'var(--sf-text-muted)', marginBottom: '18px' }}>
            Yêu cầu của bạn được chuyển thẳng vào hộp thư <strong>Tin nhắn liên hệ</strong> của bộ phận Quản trị và phản hồi trong vòng 2 giờ làm việc.
          </p>

          {sentSuccess && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--sf-success-soft)',
                color: 'var(--sf-success)',
                fontSize: '13.5px',
                fontWeight: 700,
              }}
            >
              ✓ Đã ghi nhận tin nhắn liên hệ của bạn! Đội ngũ CSKH sẽ phản hồi sớm nhất qua email.
            </div>
          )}

          <form onSubmit={handleContactSubmit} style={{ display: 'grid', gap: '14px' }}>
            <div className="sf-field">
              <label htmlFor="sf-ct-name">Họ và tên *</label>
              <input
                id="sf-ct-name"
                className="sf-input"
                placeholder="Nhập họ tên của bạn"
                value={contactForm.name}
                onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div className="sf-form-grid">
              <div className="sf-field">
                <label htmlFor="sf-ct-email">Email phản hồi *</label>
                <input
                  id="sf-ct-email"
                  type="email"
                  className="sf-input"
                  placeholder="ban@example.com"
                  value={contactForm.email}
                  onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="sf-field">
                <label htmlFor="sf-ct-phone">Số điện thoại / Mã đơn</label>
                <input
                  id="sf-ct-phone"
                  className="sf-input"
                  placeholder="VD: SF83291"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="sf-field">
              <label htmlFor="sf-ct-subject">Chủ đề cần hỗ trợ</label>
              <select
                id="sf-ct-subject"
                className="sf-select"
                value={contactForm.subject}
                onChange={(e) => setContactForm((f) => ({ ...f, subject: e.target.value }))}
              >
                <option value="Tư vấn sản phẩm & Đơn hàng">Tư vấn sản phẩm & Đơn hàng</option>
                <option value="Đổi trả & Bảo hành 30 ngày">Đổi trả & Bảo hành 30 ngày</option>
                <option value="Hợp tác Doanh nghiệp / Quà tặng B2B">Hợp tác Doanh nghiệp / Quà tặng B2B</option>
                <option value="Góp ý chất lượng dịch vụ">Góp ý chất lượng dịch vụ</option>
              </select>
            </div>

            <div className="sf-field">
              <label htmlFor="sf-ct-message">Nội dung chi tiết *</label>
              <textarea
                id="sf-ct-message"
                rows={4}
                className="sf-textarea"
                placeholder="Mô tả chi tiết yêu cầu của bạn..."
                value={contactForm.message}
                onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                required
              />
            </div>

            <button type="submit" className="sf-btn sf-btn-primary sf-btn-block" disabled={sending}>
              <SfIcon name="send" size={16} />
              <span>{sending ? 'Đang gửi yêu cầu...' : 'Gửi tin nhắn cho Cửa hàng'}</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
