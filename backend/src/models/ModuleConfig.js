import mongoose from 'mongoose';
import { applyApiTransform } from './_transform.js';

const moduleConfigSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Mã cấu hình phân hệ (slug) là bắt buộc'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    group: {
      type: String,
      default: 'Cài đặt hệ thống',
      trim: true,
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    updatedBy: {
      type: String,
      default: 'Alex Chen',
      trim: true,
    },
  },
  {
    collection: 'module_configs',
    timestamps: true,
    minimize: false,
  }
);

moduleConfigSchema.pre('save', function () {
  this.markModified('settings');
});

applyApiTransform(moduleConfigSchema);

export const ModuleConfig =
  mongoose.models.ModuleConfig || mongoose.model('ModuleConfig', moduleConfigSchema);

export default ModuleConfig;
