import mongoose from 'mongoose';
import { applyApiTransform } from './_transform.js';

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên đối tác người bán là bắt buộc'],
      trim: true,
      index: true,
    },
    owner: {
      type: String,
      default: 'Người đại diện',
      trim: true,
    },
    commission: {
      type: Number,
      default: 12,
      min: [0, 'Hoa hồng không được nhỏ hơn 0%'],
      max: [100, 'Hoa hồng không được vượt quá 100%'],
    },
    sales: {
      type: Number,
      default: 0,
      min: [0, 'Tổng doanh số không được âm'],
    },
    pendingPayout: {
      type: Number,
      default: 0,
      min: [0, 'Số dư chờ quyết toán không được âm'],
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Pending', 'Suspended'],
        message: 'Trạng thái đối tác không hợp lệ',
      },
      default: 'Active',
      index: true,
    },
    products: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng sản phẩm không được âm'],
    },
  },
  {
    collection: 'vendors',
    timestamps: true,
  }
);

applyApiTransform(vendorSchema);

export const Vendor =
  mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);

export default Vendor;
