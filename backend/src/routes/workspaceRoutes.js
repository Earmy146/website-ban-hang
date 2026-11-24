import { Router } from 'express';
import {
  getVendors,
  createVendor,
  updateVendor,
  updateVendorStatus,
  deleteVendor,
  payoutVendor,
  getVendorReport,
  getConversations,
  createConversation,
  markConversationRead,
  sendConversationMessage,
  getAiWorkflows,
  createAiWorkflow,
  updateAiWorkflow,
  deleteAiWorkflow,
  toggleAiWorkflow,
  runAiWorkflow,
  generateAiContent,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getSettings,
  updateSettings,
  getModuleConfig,
  updateModuleConfig,
  getModuleRecords,
  createModuleRecord,
  updateModuleRecord,
  bulkDeleteModuleRecords,
  bulkUpdateModuleStatus,
  deleteModuleRecord
} from '../controllers/workspaceController.js';

const router = Router();

// 15. Đối tác sàn TMĐT (Vendors)
router.get('/vendors', getVendors);
router.post('/vendors', createVendor);
router.get('/vendors/:id/report', getVendorReport);
router.post('/vendors/:id/payout', payoutVendor);
router.patch('/vendors/:id/status', updateVendorStatus);
router.put('/vendors/:id', updateVendor);
router.delete('/vendors/:id', deleteVendor);

// 16. Hộp thư hỗ trợ CSKH (Conversations)
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.patch('/conversations/:id/read', markConversationRead);
router.post('/conversations/:id/messages', sendConversationMessage);

// 17. Quy trình AI tự động hóa & AI Studio
router.get('/ai-workflows', getAiWorkflows);
router.post('/ai-workflows', createAiWorkflow);
router.patch('/ai-workflows/:id/toggle', toggleAiWorkflow);
router.post('/ai-workflows/:id/run', runAiWorkflow);
router.put('/ai-workflows/:id', updateAiWorkflow);
router.delete('/ai-workflows/:id', deleteAiWorkflow);
router.post('/ai/generate', generateAiContent);

// 18. Thành viên nhóm & Phân quyền (Users)
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// 19. Cài đặt chung cửa hàng (Settings) & Cấu hình chuyên sâu (Module Configs)
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/module-configs/:slug', getModuleConfig);
router.put('/module-configs/:slug', updateModuleConfig);

// 20. Phân hệ nghiệp vụ mở rộng 45+ trang con (Dynamic Modules)
router.get('/modules/:slug', getModuleRecords);
router.post('/modules/:slug/bulk-delete', bulkDeleteModuleRecords);
router.post('/modules/:slug/bulk-status', bulkUpdateModuleStatus);
router.post('/modules/:slug', createModuleRecord);
router.put('/modules/:slug/:id', updateModuleRecord);
router.delete('/modules/:slug/:id', deleteModuleRecord);

export default router;
