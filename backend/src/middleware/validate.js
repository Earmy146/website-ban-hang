import { AppError } from '../utils/apiResponse.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requireNonEmptyString(value, fieldLabel, fieldName = '') {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(
      `Vui lòng nhập ${fieldLabel} hợp lệ.`,
      400,
      'VALIDATION_ERROR',
      fieldName ? [{ field: fieldName, message: `${fieldLabel} không được để trống` }] : []
    );
  }
  return value.trim();
}

export function requireValidEmail(value, fieldLabel = 'địa chỉ email', fieldName = 'email') {
  const str = requireNonEmptyString(value, fieldLabel, fieldName).toLowerCase();
  if (!EMAIL_REGEX.test(str)) {
    throw new AppError(
      `Định dạng ${fieldLabel} không hợp lệ.`,
      400,
      'VALIDATION_ERROR',
      [{ field: fieldName, message: `${fieldLabel} không đúng định dạng` }]
    );
  }
  return str;
}

export function requireNumber(value, fieldLabel, { min = undefined, max = undefined, fieldName = '' } = {}) {
  if (value === undefined || value === null || value === '') {
    throw new AppError(
      `Vui lòng nhập ${fieldLabel}.`,
      400,
      'VALIDATION_ERROR',
      fieldName ? [{ field: fieldName, message: `${fieldLabel} là bắt buộc` }] : []
    );
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new AppError(
      `${fieldLabel} phải là một số hợp lệ.`,
      400,
      'VALIDATION_ERROR',
      fieldName ? [{ field: fieldName, message: `${fieldLabel} phải là số` }] : []
    );
  }
  if (min !== undefined && num < min) {
    throw new AppError(
      `${fieldLabel} phải lớn hơn hoặc bằng ${min}.`,
      400,
      'VALIDATION_ERROR',
      fieldName ? [{ field: fieldName, message: `${fieldLabel} tối thiểu là ${min}` }] : []
    );
  }
  if (max !== undefined && num > max) {
    throw new AppError(
      `${fieldLabel} không được vượt quá ${max}.`,
      400,
      'VALIDATION_ERROR',
      fieldName ? [{ field: fieldName, message: `${fieldLabel} tối đa là ${max}` }] : []
    );
  }
  return num;
}

export function optionalNumber(value, defaultValue = 0, { min = undefined, max = undefined, fieldLabel = 'Giá trị', fieldName = '' } = {}) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return requireNumber(value, fieldLabel, { min, max, fieldName });
}

export function requireEnum(value, allowedValues, fieldLabel, fieldName = '') {
  if (!allowedValues.includes(value)) {
    throw new AppError(
      `${fieldLabel} không hợp lệ (chỉ chấp nhận: ${allowedValues.join(', ')}).`,
      400,
      'VALIDATION_ERROR',
      fieldName ? [{ field: fieldName, message: `${fieldLabel} không nằm trong danh sách cho phép` }] : []
    );
  }
  return value;
}

export function requireIdsArray(ids, itemLabel = 'bản ghi') {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError(
      `Vui lòng chọn ít nhất một ${itemLabel} để thực hiện thao tác hàng loạt.`,
      400,
      'VALIDATION_ERROR',
      [{ field: 'ids', message: 'Danh sách ids phải là mảng không rỗng' }]
    );
  }
  return ids.map((id) => String(id).trim()).filter(Boolean);
}
