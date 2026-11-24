import mongoose from 'mongoose';
import { applyApiTransform } from './_transform.js';

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên thương hiệu là bắt buộc'],
      trim: true,
      unique: true,
    },
    origin: {
      type: String,
      default: 'Việt Nam',
      trim: true,
    },
    productsCount: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng sản phẩm không được âm'],
    },
    revenue: {
      type: Number,
      default: 0,
      min: [0, 'Doanh thu không được âm'],
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Inactive'],
        message: 'Trạng thái thương hiệu không hợp lệ',
      },
      default: 'Active',
      index: true,
    },
  },
  {
    collection: 'brands',
    timestamps: true,
  }
);

applyApiTransform(brandSchema);

export const Brand =
  mongoose.models.Brand || mongoose.model('Brand', brandSchema);

export default Brand;
