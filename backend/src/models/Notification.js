import mongoose from 'mongoose';
import { applyApiTransform } from './_transform.js';

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề thông báo là bắt buộc'],
      trim: true,
    },
    detail: {
      type: String,
      default: '',
      trim: true,
    },
    time: {
      type: String,
      default: 'Vừa xong',
      trim: true,
    },
    unread: {
      type: Boolean,
      default: true,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['warning', 'order', 'danger', 'review', 'finance', 'info'],
        message: 'Loại thông báo không hợp lệ',
      },
      default: 'info',
      index: true,
    },
  },
  {
    collection: 'notifications',
    timestamps: true,
  }
);

applyApiTransform(notificationSchema);

export const Notification =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export default Notification;
