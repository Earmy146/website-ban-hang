import mongoose from 'mongoose';
import { applyApiTransform } from './_transform.js';

const currentUserSchema = new mongoose.Schema(
  {
    name: { type: String, default: 'Alex Chen', trim: true },
    role: { type: String, default: 'Quản trị viên cửa hàng', trim: true },
    email: { type: String, default: 'alex.chen@veylix.vn', trim: true, lowercase: true },
    avatarLetter: { type: String, default: 'A', trim: true },
  },
  { _id: false }
);

const periodMetricSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    range: { type: String, default: '' },
    sales: { type: String, default: '$0' },
    orders: { type: Number, default: 0 },
    conversion: { type: String, default: '0%' },
    aov: { type: String, default: '$0.00' },
    change: { type: String, default: '+0.0%' },
  },
  { _id: false }
);

const storeSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'general',
      unique: true,
      index: true,
    },
    storeName: {
      type: String,
      required: [true, 'Tên cửa hàng là bắt buộc'],
      default: 'Veylix Store',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Thương mại trong sự hài hòa',
      trim: true,
    },
    supportEmail: {
      type: String,
      required: [true, 'Email hỗ trợ CSKH là bắt buộc'],
      default: 'support@veylix.vn',
      trim: true,
      lowercase: true,
    },
    supportPhone: {
      type: String,
      default: '+84 28 3822 1234',
      trim: true,
    },
    currency: {
      type: String,
      default: 'USD ($)',
      trim: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Ho_Chi_Minh (GMT+7)',
      trim: true,
    },
    language: {
      type: String,
      default: 'Tiếng Việt',
      trim: true,
    },
    taxRate: {
      type: Number,
      default: 8,
      min: [0, 'Thuế suất không được âm'],
      max: [100, 'Thuế suất không được vượt quá 100%'],
    },
    address: {
      type: String,
      default: 'Tầng 12, Tòa nhà Bitexco, Quận 1',
      trim: true,
    },
    city: {
      type: String,
      default: 'TP. Hồ Chí Minh',
      trim: true,
    },
    country: {
      type: String,
      default: 'Việt Nam',
      trim: true,
    },
    allowGuestCheckout: {
      type: Boolean,
      default: true,
    },
    autoFulfill: {
      type: Boolean,
      default: false,
    },
    currentUser: {
      type: currentUserSchema,
      default: () => ({
        name: 'Alex Chen',
        role: 'Quản trị viên cửa hàng',
        email: 'alex.chen@veylix.vn',
        avatarLetter: 'A',
      }),
    },
    periods: {
      type: [periodMetricSchema],
      default: [],
    },
  },
  {
    collection: 'store_settings',
    timestamps: true,
  }
);

applyApiTransform(storeSettingSchema);

export const StoreSetting =
  mongoose.models.StoreSetting || mongoose.model('StoreSetting', storeSettingSchema);

export default StoreSetting;
