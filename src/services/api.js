const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export const TOPBAR_REFRESH_EVENT = 'veylix:topbar-refresh';
export const PERIOD_CHANGE_EVENT = 'veylix:period-change';

let currentGlobalPeriod = '30';

export function getGlobalPeriod() {
  return currentGlobalPeriod;
}

export function setGlobalPeriod(periodId) {
  currentGlobalPeriod = String(periodId || '30');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PERIOD_CHANGE_EVENT, { detail: { period: currentGlobalPeriod } }));
  }
}

export function emitTopbarRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TOPBAR_REFRESH_EVENT));
  }
}

function buildQuery(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      sp.append(key, String(value));
    }
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export async function request(path, options = {}) {
  const { method = 'GET', body, headers = {}, signal, notifyTopbar = false } = options;

  const fetchOptions = {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    signal,
  };

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, fetchOptions);
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new Error('Lỗi kết nối máy chủ');
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok || json?.success === false) {
    throw new Error(json?.error?.message || 'Lỗi kết nối máy chủ');
  }

  if (notifyTopbar) {
    emitTopbarRefresh();
  }

  return json?.data !== undefined ? json.data : json;
}

export const api = {
  // 0. Health Check
  getHealth: () => request('/health'),

  // 1. Topbar, Notifications & Quick Search
  getTopbarSummary: () => request('/topbar/summary'),
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'PATCH' }),
  quickSearch: (q = '', signal) => request(`/search?q=${encodeURIComponent(q)}`, { signal }),

  // 2. Overview Dashboard
  getOverview: (params = {}) => request(`/overview${buildQuery(params)}`),

  // 3. Products
  getProducts: (params = {}) => {
    const sp = new URLSearchParams();
    if (params.search) sp.append('search', params.search);
    if (params.category) sp.append('category', params.category);
    if (params.status) sp.append('status', params.status);
    if (params.includeDeleted !== undefined) {
      sp.append('includeDeleted', String(Boolean(params.includeDeleted)));
    }
    const qs = sp.toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },
  createProduct: (payload) => request('/products', { method: 'POST', body: payload, notifyTopbar: true }),
  updateProduct: (id, payload) => request(`/products/${encodeURIComponent(id)}`, { method: 'PUT', body: payload, notifyTopbar: true }),
  deleteProduct: (id) => request(`/products/${encodeURIComponent(id)}`, { method: 'DELETE', notifyTopbar: true }),
  duplicateProduct: (id) => request(`/products/${encodeURIComponent(id)}/duplicate`, { method: 'POST', notifyTopbar: true }),
  bulkArchiveProducts: (ids) => request('/products/bulk-archive', { method: 'POST', body: { ids }, notifyTopbar: true }),
  importProducts: (products) => request('/products/import', { method: 'POST', body: { products }, notifyTopbar: true }),

  // 4. Categories
  getCategories: (params = {}) => request(`/categories${buildQuery(params)}`),
  createCategory: (payload) => request('/categories', { method: 'POST', body: payload }),
  updateCategory: (id, payload) => request(`/categories/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteCategory: (id) => request(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // 5. Brands
  getBrands: (params = {}) => request(`/brands${buildQuery(params)}`),
  createBrand: (payload) => request('/brands', { method: 'POST', body: payload }),
  updateBrand: (id, payload) => request(`/brands/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteBrand: (id) => request(`/brands/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // 6. Orders
  getOrders: (params = {}) => request(`/orders${buildQuery(params)}`),
  getOrder: (id) => request(`/orders/${encodeURIComponent(id)}`),
  createOrder: (payload) => request('/orders', { method: 'POST', body: payload, notifyTopbar: true }),
  updateOrderStatus: (id, payload) => request(`/orders/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: payload, notifyTopbar: true }),
  deleteOrder: (id) => request(`/orders/${encodeURIComponent(id)}`, { method: 'DELETE', notifyTopbar: true }),
  bulkCancelOrders: (ids) => request('/orders/bulk-cancel', { method: 'POST', body: { ids }, notifyTopbar: true }),

  // 7. Shipments / Fulfillment
  getShipments: (params = {}) => request(`/shipments${buildQuery(params)}`),
  createShipment: (payload) => request('/shipments', { method: 'POST', body: payload, notifyTopbar: true }),
  advanceShipment: (id) => request(`/shipments/${encodeURIComponent(id)}/advance`, { method: 'PATCH', notifyTopbar: true }),
  bulkAdvanceShipments: (ids) => request('/shipments/bulk-advance', { method: 'POST', body: { ids }, notifyTopbar: true }),

  // 8. Stock / Inventory
  getStock: (params = {}) => request(`/stock${buildQuery(params)}`),
  transferStock: (payload) => request('/stock/transfer', { method: 'POST', body: payload, notifyTopbar: true }),
  bulkTransferStock: (payload) => request('/stock/bulk-transfer', { method: 'POST', body: payload, notifyTopbar: true }),
  receiveStock: (payload) => request('/stock/receive', { method: 'POST', body: payload, notifyTopbar: true }),
  adjustStock: (id, payload) => request(`/stock/${encodeURIComponent(id)}/adjust`, { method: 'PATCH', body: payload, notifyTopbar: true }),

  // 9. Customers
  getCustomers: (params = {}) => request(`/customers${buildQuery(params)}`),
  createCustomer: (payload) => request('/customers', { method: 'POST', body: payload }),
  updateCustomer: (id, payload) => request(`/customers/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteCustomer: (id) => request(`/customers/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  bulkDeleteCustomers: (ids) => request('/customers/bulk-delete', { method: 'POST', body: { ids } }),
  bulkEmailCustomers: (payload) => request('/customers/bulk-email', { method: 'POST', body: payload }),

  // 10. Customer Segments
  getSegments: () => request('/segments'),
  createSegment: (payload) => request('/segments', { method: 'POST', body: payload }),
  updateSegment: (id, payload) => request(`/segments/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteSegment: (id) => request(`/segments/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  sendSegmentOffer: (id, payload) => request(`/segments/${encodeURIComponent(id)}/send-offer`, { method: 'POST', body: payload }),

  // 11. Coupons
  getCoupons: (params = {}) => request(`/coupons${buildQuery(params)}`),
  createCoupon: (payload) => request('/coupons', { method: 'POST', body: payload }),
  updateCoupon: (id, payload) => request(`/coupons/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteCoupon: (id) => request(`/coupons/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  bulkDeleteCoupons: (ids) => request('/coupons/bulk-delete', { method: 'POST', body: { ids } }),

  // 12. Reviews
  getReviews: (params = {}) => request(`/reviews${buildQuery(params)}`),
  updateReviewStatus: (id, status) => request(`/reviews/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } }),
  replyReview: (id, response) => request(`/reviews/${encodeURIComponent(id)}/reply`, { method: 'PATCH', body: { response } }),
  deleteReview: (id) => request(`/reviews/${encodeURIComponent(id)}`, { method: 'DELETE', notifyTopbar: true }),

  // 13. Transactions
  getTransactions: (params = {}) => request(`/transactions${buildQuery(params)}`),
  refundTransaction: (id) => request(`/transactions/${encodeURIComponent(id)}/refund`, { method: 'POST', notifyTopbar: true }),

  // 14. Reports (hỗ trợ cả getReports('30'), getReports('30', 'products') và getReports({ range, type }))
  getReports: (rangeOrParams = '30', type) => {
    if (typeof rangeOrParams === 'object' && rangeOrParams !== null) {
      return request(`/reports${buildQuery(rangeOrParams)}`);
    }
    return request(`/reports${buildQuery({ range: rangeOrParams, type })}`);
  },

  // 15. Marketplace Vendors
  getVendors: () => request('/vendors'),
  createVendor: (payload) => request('/vendors', { method: 'POST', body: payload }),
  updateVendor: (id, payload) => request(`/vendors/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteVendor: (id) => request(`/vendors/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  updateVendorStatus: (id, status) => request(`/vendors/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: typeof status === 'object' && status !== null ? status : { status } }),
  getVendorReport: (id) => request(`/vendors/${encodeURIComponent(id)}/report`),
  payoutVendor: (id) => request(`/vendors/${encodeURIComponent(id)}/payout`, { method: 'POST' }),

  // 16. Support Chat Conversations
  getConversations: (params = {}) => request(`/conversations${buildQuery(params)}`),
  createConversation: (payload) => request('/conversations', { method: 'POST', body: payload }),
  markConversationRead: (id) => request(`/conversations/${encodeURIComponent(id)}/read`, { method: 'PATCH' }),
  sendMessage: (id, text, sender = 'shop') => request(`/conversations/${encodeURIComponent(id)}/messages`, { method: 'POST', body: { text, sender } }),

  // 17. AI Workflows & AI Studio
  getAiWorkflows: () => request('/ai-workflows'),
  createAiWorkflow: (payload) => request('/ai-workflows', { method: 'POST', body: payload }),
  updateAiWorkflow: (id, payload) => request(`/ai-workflows/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteAiWorkflow: (id) => request(`/ai-workflows/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  toggleAiWorkflow: (id) => request(`/ai-workflows/${encodeURIComponent(id)}/toggle`, { method: 'PATCH' }),
  runAiWorkflow: (id) => request(`/ai-workflows/${encodeURIComponent(id)}/run`, { method: 'POST' }),
  generateAiContent: (payload) => request('/ai/generate', { method: 'POST', body: payload }),

  // 18. Team Members / Users
  getUsers: () => request('/users'),
  createUser: (payload) => request('/users', { method: 'POST', body: payload }),
  updateUser: (id, payload) => request(`/users/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteUser: (id) => request(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // 19. General Store Settings
  getSettings: () => request('/settings'),
  updateSettings: (payload) => request('/settings', { method: 'PUT', body: payload, notifyTopbar: true }),

  // 20. Sub-modules & Deep Module Configs (GeneralCommercePage V2)
  getModuleRecords: (slug, params = {}) => request(`/modules/${encodeURIComponent(slug)}${buildQuery(params)}`),
  createModuleRecord: (slug, payload) => request(`/modules/${encodeURIComponent(slug)}`, { method: 'POST', body: payload }),
  updateModuleRecord: (slug, id, payload) => request(`/modules/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`, { method: 'PUT', body: payload }),
  deleteModuleRecord: (slug, id) => request(`/modules/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  bulkDeleteModuleRecords: (slug, ids) => request(`/modules/${encodeURIComponent(slug)}/bulk-delete`, { method: 'POST', body: { ids } }),
  bulkStatusModuleRecords: (slug, payload) => request(`/modules/${encodeURIComponent(slug)}/bulk-status`, { method: 'POST', body: payload }),
  getModuleConfig: (slug) => request(`/module-configs/${encodeURIComponent(slug)}`),
  updateModuleConfig: (slug, payload) => request(`/module-configs/${encodeURIComponent(slug)}`, { method: 'PUT', body: payload }),

  // 21. Customer Storefront (/api/store/*)
  getStoreHome: () => request('/store/home'),
  getStoreProducts: (params = {}) => request(`/store/products${buildQuery(params)}`),
  getStoreProductDetail: (idOrSku) => request(`/store/products/${encodeURIComponent(idOrSku)}`),
  validateStoreCoupon: (payload) => request('/store/validate-coupon', { method: 'POST', body: payload }),
  checkoutStoreOrder: (payload) => request('/store/checkout', { method: 'POST', body: payload, notifyTopbar: true }),
  lookupStoreOrder: (params = {}) => request(`/store/orders/lookup${buildQuery(params)}`),
  getStoreCustomerOrders: (email) => request(`/store/customers/orders${buildQuery({ email })}`),
  cancelStoreOrder: (id) => request(`/store/orders/${encodeURIComponent(id)}/cancel`, { method: 'POST', notifyTopbar: true }),
  storeLogin: (payload) => request('/store/auth/login', { method: 'POST', body: payload }),
  storeRegister: (payload) => request('/store/auth/register', { method: 'POST', body: payload }),
  createStoreReview: (payload) => request('/store/reviews', { method: 'POST', body: payload, notifyTopbar: true }),
  getStoreChat: (params = {}) => request(`/store/chat${buildQuery(params)}`),
  sendStoreChat: (payload) => request('/store/chat', { method: 'POST', body: payload, notifyTopbar: true }),
};

export default api;
