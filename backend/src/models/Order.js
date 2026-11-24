import mongoose from 'mongoose';
import { applyApiTransform, deriveInitials } from './_transform.js';

const orderCustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên khách hàng đặt đơn là bắt buộc'],
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    avatar: {
      type: String,
      default: 'KH',
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: {
      type: String,
      required: [true, 'Mã đơn hàng là bắt buộc'],
      trim: true,
      unique: true,
      index: true,
    },
    customerRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    customer: {
      type: orderCustomerSchema,
      required: [true, 'Thông tin khách hàng là bắt buộc'],
    },
    date: {
      type: String,
      default: 'Hôm nay',
      trim: true,
    },
    channel: {
      type: String,
      default: 'Cửa hàng trực tuyến',
      trim: true,
      index: true,
    },
    itemsCount: {
      type: Number,
      default: 1,
      min: [1, 'Đơn hàng phải có tối thiểu 1 sản phẩm'],
    },
    itemsDesc: {
      type: String,
      default: 'Đơn hàng tạo thủ công',
      trim: true,
    },
    total: {
      type: Number,
      required: [true, 'Tổng giá trị đơn hàng là bắt buộc'],
      min: [0, 'Tổng giá trị đơn hàng không được âm'],
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ['Paid', 'Pending', 'Refunded'],
        message: 'Trạng thái thanh toán không hợp lệ',
      },
      default: 'Paid',
      index: true,
    },
    fulfillmentStatus: {
      type: String,
      enum: {
        values: ['Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'],
        message: 'Trạng thái xử lý giao hàng không hợp lệ',
      },
      default: 'Processing',
      index: true,
    },
    shippingMethod: {
      type: String,
      default: 'Giao hàng tiêu chuẩn',
      trim: true,
    },
    address: {
      type: String,
      default: 'Quận 1, TP. Hồ Chí Minh',
      trim: true,
    },
  },
  {
    collection: 'orders',
    timestamps: true,
  }
);

orderSchema.pre('validate', function () {
  if (!this.orderCode) {
    this.orderCode = `SF${Math.floor(10000 + Math.random() * 90000)}`;
  } else {
    this.orderCode = String(this.orderCode).replace(/^#/, '').trim();
  }

  if (this.customer && !this.customer.avatar && this.customer.name) {
    this.customer.avatar = deriveInitials(this.customer.name, 'KH');
  }
});

// Quy ước hợp đồng: ret.id = ret.orderCode (giữ ret._id là ObjectId)
applyApiTransform(orderSchema, { idField: 'orderCode' });

export const Order =
  mongoose.models.Order || mongoose.model('Order', orderSchema);

export default Order;
