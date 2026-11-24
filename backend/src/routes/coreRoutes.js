import { Router } from 'express';
import {
  getHealth,
  getTopbarSummary,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  globalSearch
} from '../controllers/topbarController.js';
import { getOverview, getReports } from '../controllers/overviewController.js';

const router = Router();

// 0. Health Check
router.get('/health', getHealth);

// 1. Topbar, Thông báo & Tìm kiếm nhanh
router.get('/topbar/summary', getTopbarSummary);
router.get('/notifications', getNotifications);
router.patch('/notifications/read-all', markAllNotificationsRead);
router.patch('/notifications/:id/read', markNotificationRead);
router.get('/search', globalSearch);

// 2 & 14. Tổng quan & Báo cáo phân tích
router.get('/overview', getOverview);
router.get('/reports', getReports);

export default router;
