/**
 * Tiện ích chuẩn hóa dữ liệu trả về từ Mongoose theo Hợp đồng API (docs/API_CONTRACT.md)
 */

export function toVietnameseSlug(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function deriveInitials(name = '', fallback = 'KH') {
  const cleaned = String(name).trim();
  if (!cleaned) return fallback;
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function normalizeRecord(ret, { idField = null, mapCreatedAtFromLabel = false } = {}) {
  if (!ret || typeof ret !== 'object') return ret;

  if (idField && ret[idField]) {
    ret.id = String(ret[idField]);
  } else if (ret._id !== undefined && ret._id !== null) {
    ret.id = String(ret._id);
  }

  if (mapCreatedAtFromLabel && ret.createdAtLabel) {
    ret.createdAt = ret.createdAtLabel;
  }

  delete ret.__v;
  return ret;
}

/**
 * Áp dụng quy tắc chuẩn hóa `id` cho cả `toJSON`, `toObject` và truy vấn `.lean()`
 */
export function applyApiTransform(schema, options = {}) {
  const { idField = null, mapCreatedAtFromLabel = false } = options;

  schema.set('versionKey', false);

  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
      return normalizeRecord(ret, { idField, mapCreatedAtFromLabel });
    },
  });

  schema.set('toObject', {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
      return normalizeRecord(ret, { idField, mapCreatedAtFromLabel });
    },
  });

  // Hỗ trợ tự động gắn `id` chuẩn ngay cả khi controller gọi `.lean()`
  const normalizeLeanResult = function (result) {
    if (!result) return;
    if (Array.isArray(result)) {
      for (const item of result) {
        if (item && typeof item === 'object' && typeof item.toJSON !== 'function') {
          normalizeRecord(item, { idField, mapCreatedAtFromLabel });
        }
      }
    } else if (typeof result === 'object' && typeof result.toJSON !== 'function') {
      normalizeRecord(result, { idField, mapCreatedAtFromLabel });
    }
  };

  schema.post('find', normalizeLeanResult);
  schema.post('findOne', normalizeLeanResult);
  schema.post('findOneAndUpdate', normalizeLeanResult);
}
