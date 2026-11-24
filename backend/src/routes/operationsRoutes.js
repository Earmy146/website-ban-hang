import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  bulkCancelOrders,
  getShipments,
  createShipment,
  advanceShipment,
  bulkAdvanceShipments
} from '../controllers/orderController.js';
import {
  getStock,
  transferStock,
  bulkTransferStock,
  receiveStock,
  adjustStock
} from '../controllers/stockController.js';

const router = Router();

// 6. Đơn hàng (Orders) - Đặt bulk-cancel trước /:id
router.get('/orders', getOrders);
router.post('/orders', createOrder);
router.post('/orders/bulk-cancel', bulkCancelOrders);
router.get('/orders/:id', getOrderById);
router.patch('/orders/:id/status', updateOrderStatus);
router.delete('/orders/:id', cancelOrder);

// 7. Vận đơn & Giao nhận (Shipments)
router.get('/shipments', getShipments);
router.post('/shipments/bulk-advance', bulkAdvanceShipments);
router.post('/shipments', createShipment);
router.patch('/shipments/:id/advance', advanceShipment);

// 8. Tồn kho & Khả dụng (Stock)
router.get('/stock', getStock);
router.post('/stock/transfer', transferStock);
router.post('/stock/bulk-transfer', bulkTransferStock);
router.post('/stock/receive', receiveStock);
router.patch('/stock/:id/adjust', adjustStock);

export default router;
