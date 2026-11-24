import mongoose from 'mongoose';
import { applyApiTransform } from './_transform.js';

const shipmentSchema = new mongoose.Schema(
  {
    trackingCode: {
      type: String,
      required: [true, 'Mã vận đơn là bắt buộc'],
      trim: true,
      unique: true,
      index: true,
    },
    orderId: {
      type: String,
      required: [true, 'Mã đơn hàng liên kết là bắt buộc'],
      trim: true,
      index: true,
    },
    orderRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    carrier: {
      type: String,
      required: [true, 'Đơn vị vận chuyển là bắt buộc'],
      trim: true,
      index: true,
    },
    customer: {
      type: String,
      required: [true, 'Tên người nhận là bắt buộc'],
      default: 'Khách nhận hàng',
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Địa chỉ giao hàng là bắt buộc'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Packaging', 'Out for delivery', 'Delivered', 'Delayed'],
        message: 'Trạng thái vận đơn không hợp lệ',
      },
      default: 'Packaging',
      index: true,
    },
    statusText: {
      type: String,
      default: 'Đang đóng gói',
      trim: true,
    },
    statusClass: {
      type: String,
      enum: {
        values: ['purple', 'amber', 'teal', 'blue', 'green', 'red', 'indigo'],
        message: 'Mã màu trạng thái không hợp lệ',
      },
      default: 'amber',
    },
    createdAtLabel: {
      type: String,
      default: 'Vừa tạo',
      trim: true,
    },
    eta: {
      type: String,
      default: '2-3 ngày tới',
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      set(val) {
        if (typeof val === 'string') {
          const parsed = Date.parse(val);
          if (Number.isNaN(parsed)) {
            this.createdAtLabel = val;
            return this.createdAt instanceof Date ? this.createdAt : new Date();
          }
        }
        return val;
      },
    },
  },
  {
    collection: 'shipments',
    timestamps: { createdAt: false, updatedAt: 'updatedAt' },
  }
);

shipmentSchema.pre('validate', function () {
  if (!this.trackingCode) {
    this.trackingCode = `TRK-${Math.floor(10000 + Math.random() * 90000)}`;
  } else {
    this.trackingCode = String(this.trackingCode).replace(/^#/, '').trim();
  }
  if (this.orderId) {
    this.orderId = String(this.orderId).replace(/^#/, '').trim();
  }
});

// Quy ước hợp đồng: ret.id = ret.trackingCode & ret.createdAt = ret.createdAtLabel || ret.createdAt
applyApiTransform(shipmentSchema, {
  idField: 'trackingCode',
  mapCreatedAtFromLabel: true,
});

export const Shipment =
  mongoose.models.Shipment || mongoose.model('Shipment', shipmentSchema);

export default Shipment;
