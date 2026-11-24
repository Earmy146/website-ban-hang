import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { storeApi, normalizeFaq } from './storeApi';

const StoreContext = createContext(null);

const STORAGE_KEYS = {
  CART: 'veylix_sf_cart_v1',
  WISHLIST: 'veylix_sf_wishlist_v1',
  CUSTOMER: 'veylix_sf_customer_v1',
  COPIED_COUPON: 'veylix_sf_coupon_v1',
  RECENT_ORDERS: 'veylix_sf_recent_orders_v1',
  UI_PREFS: 'veylix_sf_ui_prefs_v4',
};

const VALID_STYLES = ['veylix', 'glass', 'liquid-glass', 'flat'];
const VALID_THEMES = ['veylix', 'xanh-rung', 'xanh-duong', 'hong', 'tim', 'cam'];
const VALID_MODES = ['light', 'dark'];

function readStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

function sanitizePrefs(raw = {}) {
  return {
    uiStyle: VALID_STYLES.includes(raw.uiStyle) ? raw.uiStyle : 'veylix',
    colorTheme: VALID_THEMES.includes(raw.colorTheme) ? raw.colorTheme : 'veylix',
    colorMode: VALID_MODES.includes(raw.colorMode) ? raw.colorMode : 'light',
    userCustomized: Boolean(raw.userCustomized),
  };
}

export function StoreProvider({ children }) {
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeData, setHomeData] = useState({
    settings: {
      storeName: 'Veylix Store',
      tagline: 'Mua sắm thông minh & dễ dàng',
      supportEmail: 'support@veylix.vn',
      supportPhone: '+84 28 3822 1234',
      taxRate: 8,
      address: 'Tầng 12, Tòa nhà Bitexco, Quận 1',
      city: 'TP. Hồ Chí Minh',
      country: 'Việt Nam',
    },
    storefrontConfig: {},
    maintenance: { settings: { enabled: false } },
    shippingConfig: {},
    categories: [],
    featuredProducts: [],
    activeCoupons: [],
    reviews: [],
    faqs: [],
  });

  const [uiPrefs, setUiPrefs] = useState(() =>
    sanitizePrefs(
      readStorage(STORAGE_KEYS.UI_PREFS, {
        uiStyle: 'veylix',
        colorTheme: 'veylix',
        colorMode: 'light',
        userCustomized: false,
      })
    )
  );

  const [cart, setCart] = useState(() => readStorage(STORAGE_KEYS.CART, []));
  const [wishlist, setWishlist] = useState(() => readStorage(STORAGE_KEYS.WISHLIST, []));
  const [customer, setCustomer] = useState(() => readStorage(STORAGE_KEYS.CUSTOMER, null));
  const [savedCoupon, setSavedCoupon] = useState(() => readStorage(STORAGE_KEYS.COPIED_COUPON, ''));
  const [recentOrders, setRecentOrders] = useState(() => readStorage(STORAGE_KEYS.RECENT_ORDERS, []));

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isStylePanelOpen, setIsStylePanelOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  const refreshHome = useCallback(async () => {
    try {
      setHomeLoading(true);
      const data = await storeApi.getHome();
      if (data) {
        setHomeData((prev) => ({
          settings: { ...prev.settings, ...(data.settings || {}) },
          storefrontConfig: data.storefrontConfig || {},
          maintenance: data.maintenance || { settings: { enabled: false } },
          shippingConfig: data.shippingConfig || {},
          categories: Array.isArray(data.categories) ? data.categories : [],
          featuredProducts: Array.isArray(data.featuredProducts) ? data.featuredProducts : [],
          activeCoupons: Array.isArray(data.activeCoupons) ? data.activeCoupons : [],
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
          faqs: Array.isArray(data.faqs) ? data.faqs.map(normalizeFaq) : [],
        }));

        const sfSettings = data.storefrontConfig?.settings || data.storefrontConfig || {};
        setUiPrefs((prev) => {
          if (prev.userCustomized) return prev;
          return sanitizePrefs({
            uiStyle: sfSettings.defaultUiStyle || 'veylix',
            colorTheme: sfSettings.defaultColorTheme || 'veylix',
            colorMode: sfSettings.defaultColorMode || 'light',
            userCustomized: false,
          });
        });
      }
    } catch {
      // Fallback gracefully
    } finally {
      setHomeLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHome();
  }, [refreshHome]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.UI_PREFS, uiPrefs);
  }, [uiPrefs]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.CART, cart);
  }, [cart]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.WISHLIST, wishlist);
  }, [wishlist]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.CUSTOMER, customer);
  }, [customer]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.COPIED_COUPON, savedCoupon);
  }, [savedCoupon]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.RECENT_ORDERS, recentOrders);
  }, [recentOrders]);

  const setUiStyle = useCallback((style) => {
    if (!VALID_STYLES.includes(style)) return;
    setUiPrefs((prev) => ({ ...prev, uiStyle: style, userCustomized: true }));
  }, []);

  const setColorTheme = useCallback((theme) => {
    if (!VALID_THEMES.includes(theme)) return;
    setUiPrefs((prev) => ({ ...prev, colorTheme: theme, userCustomized: true }));
  }, []);

  const setColorMode = useCallback((mode) => {
    if (!VALID_MODES.includes(mode)) return;
    setUiPrefs((prev) => ({ ...prev, colorMode: mode, userCustomized: true }));
  }, []);

  const resetUiPreferences = useCallback(() => {
    const sfSettings = homeData.storefrontConfig?.settings || homeData.storefrontConfig || {};
    const defaults = sanitizePrefs({
      uiStyle: sfSettings.defaultUiStyle || 'veylix',
      colorTheme: sfSettings.defaultColorTheme || 'veylix',
      colorMode: sfSettings.defaultColorMode || 'light',
      userCustomized: false,
    });
    setUiPrefs(defaults);
    showToast('Đã khôi phục giao diện về chuẩn Veylix Kem Ấm mặc định!');
  }, [homeData.storefrontConfig, showToast]);

  const freeShippingThreshold = useMemo(() => {
    const sfSettings = homeData.storefrontConfig?.settings || homeData.storefrontConfig || {};
    const shipSettings = homeData.shippingConfig?.settings || homeData.shippingConfig || {};
    const val = Number(
      shipSettings.freeShippingThreshold ??
      shipSettings.minFreeShipping ??
      sfSettings.freeShippingThreshold ??
      75
    );
    return val > 0 ? val : 75;
  }, [homeData.storefrontConfig, homeData.shippingConfig]);

  const addToCart = useCallback((product, quantity = 1, variant = 'Tiêu chuẩn', openDrawer = true) => {
    if (!product) return false;
    const maxStock = Number(product.inventory ?? 99);
    if (maxStock <= 0 || product.status === 'Out of stock') {
      showToast('Món này hiện đang tạm hết hàng', 'error');
      return false;
    }

    const cartKey = `${product.sku || product.id}::${variant}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.cartKey === cartKey);
      const currentQtyForSku = prev
        .filter((item) => (item.sku || item.productId) === (product.sku || product.id))
        .reduce((sum, item) => sum + item.quantity, 0);

      const allowedAdd = Math.max(0, maxStock - currentQtyForSku);
      if (allowedAdd <= 0) {
        showToast(`Trong kho chỉ còn tối đa ${maxStock} món`, 'error');
        return prev;
      }

      const finalAdd = Math.min(Number(quantity) || 1, allowedAdd);

      if (existing) {
        return prev.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + finalAdd, maxStock }
            : item
        );
      }

      return [
        ...prev,
        {
          cartKey,
          productId: product.id || product._id,
          sku: product.sku,
          name: product.name,
          price: Number(product.price || 0),
          image: product.image,
          category: product.category,
          variant,
          quantity: finalAdd,
          maxStock,
        },
      ];
    });

    showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
    if (openDrawer) {
      setIsCartOpen(true);
    }
    return true;
  }, [showToast]);

  const updateCartQty = useCallback((cartKey, nextQty) => {
    const parsed = Number(nextQty);
    if (parsed <= 0) {
      setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartKey !== cartKey) return item;
        const limit = Number(item.maxStock || 99);
        const clamped = Math.min(parsed, limit);
        if (parsed > limit) {
          showToast(`Chỉ còn ${limit} món sẵn có trong kho`, 'error');
        }
        return { ...item, quantity: clamped };
      })
    );
  }, [showToast]);

  const removeFromCart = useCallback((cartKey) => {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
    showToast('Đã bỏ món này khỏi giỏ hàng');
  }, [showToast]);

  const clearCart = useCallback((silent = false) => {
    setCart([]);
    if (!silent) {
      showToast('Đã dọn trống giỏ hàng');
    }
  }, [showToast]);

  const isWishlisted = useCallback(
    (product) => {
      if (!product) return false;
      const key = product.sku || product.id;
      return wishlist.some((w) => (w.sku || w.id) === key);
    },
    [wishlist]
  );

  const toggleWishlist = useCallback((product) => {
    if (!product) return;
    const key = product.sku || product.id;
    setWishlist((prev) => {
      const exists = prev.some((w) => (w.sku || w.id) === key);
      if (exists) {
        showToast(`Đã bỏ "${product.name}" khỏi Yêu thích`);
        return prev.filter((w) => (w.sku || w.id) !== key);
      }
      showToast(`Đã lưu "${product.name}" vào mục Yêu thích`);
      return [
        {
          id: product.id || product._id,
          sku: product.sku,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          brand: product.brand,
          rating: product.rating,
          inventory: product.inventory,
          sales: product.sales,
          status: product.status,
          desc: product.desc,
        },
        ...prev,
      ];
    });
  }, [showToast]);

  const copyCouponCode = useCallback((code) => {
    const clean = String(code || '').trim().toUpperCase();
    if (!clean) return;
    setSavedCoupon(clean);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(clean).catch(() => {});
    }
    showToast(`Đã lưu mã giảm giá ${clean}! Sẽ hiện sẵn ở bước Thanh toán.`);
  }, [showToast]);

  const recordPlacedOrder = useCallback((orderInfo) => {
    if (!orderInfo?.orderCode) return;
    setRecentOrders((prev) => {
      const filtered = prev.filter((o) => o.orderCode !== orderInfo.orderCode);
      return [orderInfo, ...filtered].slice(0, 8);
    });
  }, []);

  const loginCustomer = useCallback(async (email) => {
    const res = await storeApi.loginCustomer(email);
    const cust = res?.customer || res;
    setCustomer(cust);
    showToast(`Xin chào ${cust?.name || email}!`);
    return cust;
  }, [showToast]);

  const registerCustomer = useCallback(async (payload) => {
    const res = await storeApi.registerCustomer(payload);
    const cust = res?.customer || res;
    setCustomer(cust);
    showToast(`Đăng ký thành công! Chào mừng ${cust?.name || payload.name}`);
    return cust;
  }, [showToast]);

  const logoutCustomer = useCallback(() => {
    setCustomer(null);
    showToast('Đã đăng xuất tài khoản khách hàng');
  }, [showToast]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      homeLoading,
      homeData,
      refreshHome,
      freeShippingThreshold,
      uiStyle: uiPrefs.uiStyle,
      colorTheme: uiPrefs.colorTheme,
      colorMode: uiPrefs.colorMode,
      setUiStyle,
      setColorTheme,
      setColorMode,
      resetUiPreferences,
      isStylePanelOpen,
      setIsStylePanelOpen,
      cart,
      cartCount,
      cartSubtotal,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      wishlist,
      isWishlisted,
      toggleWishlist,
      customer,
      setCustomer,
      loginCustomer,
      registerCustomer,
      logoutCustomer,
      savedCoupon,
      setSavedCoupon,
      copyCouponCode,
      recentOrders,
      recordPlacedOrder,
      isCartOpen,
      setIsCartOpen,
      quickViewProduct,
      setQuickViewProduct,
      toasts,
      showToast,
    }),
    [
      homeLoading,
      homeData,
      refreshHome,
      freeShippingThreshold,
      uiPrefs,
      setUiStyle,
      setColorTheme,
      setColorMode,
      resetUiPreferences,
      isStylePanelOpen,
      cart,
      cartCount,
      cartSubtotal,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      wishlist,
      isWishlisted,
      toggleWishlist,
      customer,
      loginCustomer,
      registerCustomer,
      logoutCustomer,
      savedCoupon,
      copyCouponCode,
      recentOrders,
      recordPlacedOrder,
      isCartOpen,
      quickViewProduct,
      toasts,
      showToast,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return ctx;
}
