import mongoose from 'mongoose';
import { applyApiTransform, toVietnameseSlug } from './_transform.js';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên danh mục là bắt buộc'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: [true, 'Đường dẫn slug là bắt buộc'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    icon: {
      type: String,
      default: '📦',
      trim: true,
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng sản phẩm không được âm'],
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Hidden'],
        message: 'Trạng thái danh mục không hợp lệ',
      },
      default: 'Active',
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 1,
      index: true,
    },
  },
  {
    collection: 'categories',
    timestamps: true,
  }
);

categorySchema.pre('validate', function () {
  if (!this.slug && this.name) {
    this.slug = toVietnameseSlug(this.name) || `cat-${Date.now()}`;
  } else if (this.slug) {
    this.slug = toVietnameseSlug(this.slug) || this.slug.toLowerCase();
  }
});

applyApiTransform(categorySchema);

export const Category =
  mongoose.models.Category || mongoose.model('Category', categorySchema);

export default Category;
