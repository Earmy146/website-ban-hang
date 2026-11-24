import { Router } from 'express';
import {
  getStoreHome,
  getStoreProducts,
  getStoreProductDetail,
  validateStoreCoupon,
  storeCheckout,
  lookupStoreOrder,
  getCustomerStoreOrders,
  cancelStoreOrder,
  loginStoreCustomer,
  registerStoreCustomer,
  createStoreReview,
  getStoreChat,
  sendStoreChatMessage
} from '../controllers/storefrontController.js';

const router = Router();

// Khởi tạo trang chủ & danh mục sản phẩm Storefront
router.get('/home', getStoreHome);
router.get('/products', getStoreProducts);
router.get('/products/:idOrSku', getStoreProductDetail);

// Mã giảm giá & Đặt hàng (Checkout)
router.post('/validate-coupon', validateStoreCoupon);
router.post('/checkout', storeCheckout);

// Tra cứu, lịch sử & hủy đơn hàng của khách
router.get('/orders/lookup', lookupStoreOrder);
router.get('/customers/orders', getCustomerStoreOrders);
router.post('/orders/:id/cancel', cancelStoreOrder);

// Tài khoản khách hàng (Demo an toàn)
router.post('/auth/login', loginStoreCustomer);
router.post('/auth/register', registerStoreCustomer);

// Đánh giá sản phẩm & Live Chat khách hàng
router.post('/reviews', createStoreReview);
router.get('/chat', getStoreChat);
router.post('/chat', sendStoreChatMessage);

export default router;
