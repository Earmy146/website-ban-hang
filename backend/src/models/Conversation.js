import mongoose from 'mongoose';
import { applyApiTransform, deriveInitials } from './_transform.js';

const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: {
        values: ['customer', 'shop', 'bot'],
        message: 'Người gửi tin nhắn không hợp lệ',
      },
      default: 'shop',
    },
    text: {
      type: String,
      required: [true, 'Nội dung tin nhắn không được để trống'],
      trim: true,
    },
    time: {
      type: String,
      default: 'Vừa xong',
      trim: true,
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    customerRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    customer: {
      type: String,
      required: [true, 'Tên khách hàng hội thoại là bắt buộc'],
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
      trim: true,
    },
    lastMessage: {
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
      default: false,
      index: true,
    },
    messages: {
      type: [chatMessageSchema],
      default: [],
    },
  },
  {
    collection: 'conversations',
    timestamps: true,
  }
);

conversationSchema.pre('validate', function () {
  if (!this.avatar && this.customer) {
    this.avatar = deriveInitials(this.customer, 'KH');
  }
  if (!this.lastMessage && Array.isArray(this.messages) && this.messages.length > 0) {
    this.lastMessage = this.messages[this.messages.length - 1].text;
  }
});

applyApiTransform(conversationSchema);

export const Conversation =
  mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

export default Conversation;
