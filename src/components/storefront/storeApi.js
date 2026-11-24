import { request } from '../../services/api';

export const FALLBACK_PRODUCT_IMAGE = '/assets/images/products/everyday-tee.png';

export function formatMoney(amount) {
  const num = Number(amount || 0);
  if (Number.isNaN(num)) return '$0.00';
  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function extractArray(res, key) {
  if (Array.isArray(res)) return res;
  if (key && Array.isArray(res?.[key])) return res[key];
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.records)) return res.records;
  if (Array.isArray(res?.orders)) return res.orders;
  if (Array.isArray(res?.products)) return res.products;
  return [];
}

export function normalizeFaq(item, index = 0) {
  const question =
    item?.question ||
    item?.name ||
    item?.title ||
    `Câu hỏi thường gặp #${index + 1}`;

  let combinedFromRecord = '';
  if (item?.subtitle && item?.notes && item.subtitle !== item.notes) {
    combinedFromRecord = `${item.subtitle} ${item.notes}`;
  } else {
    combinedFromRecord = item?.notes || item?.subtitle || '';
  }

  const answer =
    item?.answer ||
    item?.meta?.answer ||
    combinedFromRecord ||
    item?.description ||
    'Veylix Studio hỗ trợ đổi trả miễn phí trong vòng 30 ngày kể từ ngày nhận hàng, miễn phí vận chuyển cho đơn đủ điều kiện và bảo hành chính hãng trên toàn quốc.';
  const category = item?.category || item?.meta?.category || 'Chính sách & Hỗ trợ';
  return {
    id: item?.id || item?._id || `faq-${index}`,
    question,
    answer,
    category,
  };
}

function buildStoreQuery(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'all' && v !== false) {
      sp.append(k, String(v));
    }
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const storeApi = {
  getHome: () => request('/store/home'),

  getProducts: async (params = {}) => {
    const res = await request(`/store/products${buildStoreQuery(params)}`);
    return extractArray(res, 'products');
  },

  getProductDetail: async (idOrSku) => {
    const res = await request(`/store/products/${encodeURIComponent(idOrSku)}`);
    if (res?.product) {
      return {
        product: res.product,
        stock: res.stock || null,
        reviews: extractArray(res.reviews, 'reviews'),
        relatedProducts: extractArray(res.relatedProducts, 'products'),
      };
    }
    return {
      product: res,
      stock: null,
      reviews: [],
      relatedProducts: [],
    };
  },

  validateCoupon: (code, subtotal) =>
    request('/store/validate-coupon', {
      method: 'POST',
      body: { code: String(code || '').trim().toUpperCase(), subtotal: Number(subtotal || 0) },
    }),

  checkout: (payload) =>
    request('/store/checkout', {
      method: 'POST',
      body: payload,
      notifyTopbar: true,
    }),

  lookupOrder: (orderCode, email = '') => {
    const cleanCode = String(orderCode || '').replace(/^#/, '').trim();
    return request(`/store/orders/lookup${buildStoreQuery({ orderCode: cleanCode, email: email.trim() })}`);
  },

  getCustomerOrders: async (email) => {
    const res = await request(`/store/customers/orders${buildStoreQuery({ email: String(email || '').trim() })}`);
    return extractArray(res, 'orders');
  },

  cancelOrder: (orderId, reason = '') => {
    const cleanId = String(orderId || '').replace(/^#/, '').trim();
    return request(`/store/orders/${encodeURIComponent(cleanId)}/cancel`, {
      method: 'POST',
      body: { reason },
      notifyTopbar: true,
    });
  },

  loginCustomer: (email) =>
    request('/store/auth/login', {
      method: 'POST',
      body: { email: String(email || '').trim() },
    }),

  registerCustomer: (payload) =>
    request('/store/auth/register', {
      method: 'POST',
      body: payload,
    }),

  submitReview: (payload) =>
    request('/store/reviews', {
      method: 'POST',
      body: payload,
      notifyTopbar: true,
    }),

  getChat: (customer = '', email = '') =>
    request(`/store/chat${buildStoreQuery({ customer, email })}`),

  sendChatMessage: (payload) =>
    request('/store/chat', {
      method: 'POST',
      body: payload,
      notifyTopbar: true,
    }),

  submitContactMessage: (payload) =>
    request('/modules/contacts', {
      method: 'POST',
      body: payload,
    }),
};
