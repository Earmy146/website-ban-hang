import mongoose from 'mongoose';

/**
 * Thoát các ký tự đặc biệt trong chuỗi tìm kiếm RegExp để tránh lỗi cú pháp / ReDoS
 */
export function escapeRegex(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tạo đường dẫn slug chuẩn từ chuỗi tiếng Việt
 */
export function slugifyVi(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
}

/**
 * Sinh chữ cái viết tắt avatar từ họ tên (VD: "Nguyễn Văn A" -> "NA" hoặc "NV")
 */
export function makeAvatarInitials(name = '', fallback = 'KH') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Định dạng ngày ngắn gọn tiếng Việt (VD: "24 Thg 11, 2026")
 */
export function formatViDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${day} Thg ${month}, ${year}`;
}

/**
 * Định dạng giờ phút hiện tại (VD: "14:30")
 */
export function formatViTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Tìm bản ghi theo mã nghiệp vụ (orderCode / trackingCode / txnCode) hoặc ObjectId _id
 */
export async function findByCodeOrId(Model, rawId, codeField) {
  const cleanId = String(rawId || '').trim().replace(/^#/, '');
  if (!cleanId) return null;

  if (codeField) {
    if (mongoose.isValidObjectId(cleanId)) {
      return Model.findOne({
        $or: [{ _id: cleanId }, { [codeField]: cleanId }]
      });
    }
    return Model.findOne({ [codeField]: cleanId });
  }

  return Model.findById(cleanId);
}

/**
 * Tính trạng thái tồn kho cho StockItem dựa trên available và reorderPoint
 */
export function computeStockStatus(available, reorderPoint = 15) {
  if (available <= 0) return 'Out';
  if (available <= reorderPoint) return 'Low';
  return 'Healthy';
}

/**
 * Tính trạng thái kinh doanh của Product dựa trên số lượng tồn kho (nếu không phải Draft)
 */
export function computeProductStatusFromInventory(inventory, currentStatus = 'Active', reorderPoint = 15) {
  if (currentStatus === 'Draft') return 'Draft';
  if (inventory <= 0) return 'Out of stock';
  if (inventory <= reorderPoint) return 'Low stock';
  return 'Active';
}
