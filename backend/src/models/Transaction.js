import mongoose from 'mongoose';
import { applyApiTransform } from './_transform.js';

const transactionSchema = new mongoose.Schema(
  {
    txnCode: {
      type: String,
      required: [true, 'Mã giao dịch là bắt buộc'],
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
    customer: {
      type: String,
      required: [true, 'Tên khách hàng giao dịch là bắt buộc'],
      trim: true,
    },
    gateway: {
      type: String,
      required: [true, 'Cổng thanh toán là bắt buộc'],
      default: 'Stripe',
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Số tiền giao dịch là bắt buộc'],
      min: [0, 'Số tiền giao dịch không được âm'],
      default: 0,
    },
    fee: {
      type: Number,
      default: 0,
      min: [0, 'Phí cổng thanh toán không được âm'],
    },
    net: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ['Succeeded', 'Pending', 'Refunded'],
        message: 'Trạng thái giao dịch không hợp lệ',
      },
      default: 'Succeeded',
      index: true,
    },
    statusText: {
      type: String,
      default: 'Thành công',
      trim: true,
    },
    statusClass: {
      type: String,
      enum: {
        values: ['green', 'amber', 'red', 'blue', 'purple'],
        message: 'Mã màu trạng thái không hợp lệ',
      },
      default: 'green',
    },
    date: {
      type: String,
      default: 'Vừa xong',
      trim: true,
    },
    cardLast4: {
      type: String,
      default: '4242',
      trim: true,
    },
  },
  {
    collection: 'transactions',
    timestamps: true,
  }
);

transactionSchema.pre('validate', function () {
  if (!this.txnCode) {
    this.txnCode = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
  } else {
    this.txnCode = String(this.txnCode).replace(/^#/, '').trim();
  }
  if (this.orderId) {
    this.orderId = String(this.orderId).replace(/^#/, '').trim();
  }
});

// Quy ước hợp đồng: ret.id = ret.txnCode (giữ ret._id là ObjectId)
applyApiTransform(transactionSchema, { idField: 'txnCode' });

export const Transaction =
  mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

export default Transaction;
