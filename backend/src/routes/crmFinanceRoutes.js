import { Router } from 'express';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkDeleteCustomers,
  bulkEmailCustomers,
  getSegments,
  createSegment,
  updateSegment,
  sendSegmentOffer,
  deleteSegment
} from '../controllers/customerController.js';
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  bulkDeleteCoupons,
  getReviews,
  updateReviewStatus,
  replyReview,
  deleteReview,
  getTransactions,
  refundTransaction
} from '../controllers/marketingFinanceController.js';

const router = Router();

// 9. Khách hàng (Customers)
router.get('/customers', getCustomers);
router.post('/customers', createCustomer);
router.post('/customers/bulk-delete', bulkDeleteCustomers);
router.post('/customers/bulk-email', bulkEmailCustomers);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

// 10. Phân khúc khách hàng (Segments)
router.get('/segments', getSegments);
router.post('/segments', createSegment);
router.post('/segments/:id/send-offer', sendSegmentOffer);
router.put('/segments/:id', updateSegment);
router.delete('/segments/:id', deleteSegment);

// 11. Mã giảm giá (Coupons)
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.post('/coupons/bulk-delete', bulkDeleteCoupons);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// 12. Đánh giá & Xếp hạng (Reviews)
router.get('/reviews', getReviews);
router.patch('/reviews/:id/status', updateReviewStatus);
router.patch('/reviews/:id/reply', replyReview);
router.delete('/reviews/:id', deleteReview);

// 13. Giao dịch & Dòng tiền (Transactions)
router.get('/transactions', getTransactions);
router.post('/transactions/:id/refund', refundTransaction);

export default router;
