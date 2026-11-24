import mongoose from 'mongoose';
import { applyApiTransform, deriveInitials } from './_transform.js';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Họ tên khách hàng là bắt buộc'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email khách hàng là bắt buộc'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Định dạng email không hợp lệ'],
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
      trim: true,
    },
    segment: {
      type: String,
      enum: {
        values: ['Khách VIP', 'Khách quen', 'Khách mới'],
        message: 'Phân khúc khách hàng không hợp lệ',
      },
      default: 'Khách mới',
      index: true,
    },
    ordersCount: {
      type: Number,
      default: 0,
      min: [0, 'Số đơn hàng không được âm'],
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: [0, 'Tổng chi tiêu không được âm'],
    },
    aov: {
      type: Number,
      default: 0,
      min: [0, 'Giá trị đơn trung bình không được âm'],
    },
    lastOrder: {
      type: String,
      default: 'Chưa có đơn hàng',
      trim: true,
    },
    location: {
      type: String,
      default: 'TP. Hồ Chí Minh, Việt Nam',
      trim: true,
    },
    marketing: {
      type: String,
      enum: {
        values: ['Đã đăng ký', 'Chưa đăng ký'],
        message: 'Trạng thái tiếp thị không hợp lệ',
      },
      default: 'Đã đăng ký',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Inactive'],
        message: 'Trạng thái tài khoản không hợp lệ',
      },
      default: 'Active',
      index: true,
    },
  },
  {
    collection: 'customers',
    timestamps: true,
  }
);

customerSchema.pre('validate', function () {
  if (!this.avatar) {
    this.avatar = deriveInitials(this.name, 'KH');
  }
  if (this.ordersCount > 0 && (!this.aov || this.isModified('totalSpent') || this.isModified('ordersCount'))) {
    this.aov = Number((this.totalSpent / this.ordersCount).toFixed(2));
  }
});

applyApiTransform(customerSchema);

export const Customer =
  mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default Customer;
