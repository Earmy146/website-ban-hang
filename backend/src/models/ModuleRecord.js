import mongoose from 'mongoose';
import { applyApiTransform } from './_transform.js';

const moduleRecordSchema = new mongoose.Schema(
  {
    moduleSlug: {
      type: String,
      required: [true, 'Mã phân hệ (moduleSlug) là bắt buộc'],
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Tên bản ghi là bắt buộc'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Mã tham chiếu là bắt buộc'],
      trim: true,
    },
    date: {
      type: String,
      default: 'Vừa xong',
      trim: true,
    },
    status: {
      type: String,
      default: 'Hoạt động',
      trim: true,
      index: true,
    },
    statusClass: {
      type: String,
      default: 'green',
      trim: true,
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng không được âm'],
    },
    value: {
      type: String,
      default: '$0',
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    owner: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    collection: 'module_records',
    timestamps: true,
    minimize: false,
  }
);

moduleRecordSchema.pre('validate', function () {
  if (!this.code) {
    const prefix = (this.moduleSlug || 'ITEM').toUpperCase();
    this.code = `VX-${prefix}-${Math.floor(10 + Math.random() * 90)}`;
  }
});

moduleRecordSchema.pre('save', function () {
  if (this.meta !== undefined) {
    this.markModified('meta');
  }
});

moduleRecordSchema.index({ moduleSlug: 1, createdAt: -1 });

applyApiTransform(moduleRecordSchema);

export const ModuleRecord =
  mongoose.models.ModuleRecord || mongoose.model('ModuleRecord', moduleRecordSchema);

export default ModuleRecord;
