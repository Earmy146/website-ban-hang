import mongoose from 'mongoose';
import { applyApiTransform } from './_transform.js';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã giảm giá là bắt buộc'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: {
        values: ['Phần trăm (%)', 'Số tiền cố định ($)', 'Miễn phí vận chuyển'],
        message: 'Loại giảm giá không hợp lệ',
      },
      default: 'Phần trăm (%)',
      index: true,
    },
    value: {
      type: Number,
      default: 0,
      min: [0, 'Giá trị giảm giá không được âm'],
    },
    minSpend: {
      type: Number,
      default: 0,
      min: [0, 'Giá trị đơn tối thiểu không được âm'],
    },
    eligibility: {
      type: String,
      default: 'Tất cả mọi người',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Scheduled', 'Expired'],
        message: 'Trạng thái mã giảm giá không hợp lệ',
      },
      default: 'Active',
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Số lượt đã dùng không được âm'],
    },
    usageLimit: {
      type: Number,
      default: 100,
      min: [0, 'Giới hạn lượt dùng không được âm'],
    },
    startDate: {
      type: String,
      default: 'Hôm nay',
      trim: true,
    },
    endDate: {
      type: String,
      default: '31 Thg 12, 2026',
      trim: true,
    },
  },
  {
    collection: 'coupons',
    timestamps: true,
  }
);

applyApiTransform(couponSchema);

export const Coupon =
  mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

export default Coupon;
