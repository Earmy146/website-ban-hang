import mongoose from 'mongoose';
import { applyApiTransform } from './_transform.js';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên sản phẩm là bắt buộc'],
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'Mã SKU sản phẩm là bắt buộc'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Danh mục sản phẩm là bắt buộc'],
      default: 'Thời trang & May mặc',
      trim: true,
      index: true,
    },
    categoryRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
    brand: {
      type: String,
      default: 'Veylix Studio',
      trim: true,
      index: true,
    },
    brandRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Low stock', 'Out of stock', 'Draft', 'Archived'],
        message: 'Trạng thái sản phẩm không hợp lệ',
      },
      default: 'Active',
      index: true,
    },
    inventory: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng tồn kho không được âm'],
    },
    maxInventory: {
      type: Number,
      default: 100,
      min: [0, 'Sức chứa tồn kho tối đa không được âm'],
    },
    sales: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng đã bán không được âm'],
    },
    revenue: {
      type: Number,
      default: 0,
      min: [0, 'Doanh thu sản phẩm không được âm'],
    },
    trend: {
      type: String,
      default: '+0.0%',
      trim: true,
    },
    trendUp: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: [0, 'Điểm đánh giá tối thiểu là 0'],
      max: [5, 'Điểm đánh giá tối đa là 5'],
    },
    date: {
      type: String,
      default: 'Hôm nay',
      trim: true,
    },
    image: {
      type: String,
      default: '/assets/images/products/everyday-tee.png',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Giá bán sản phẩm là bắt buộc'],
      min: [0, 'Giá bán không được âm'],
      default: 0,
    },
    desc: {
      type: String,
      default: 'Mô tả sản phẩm chuẩn Veylix.',
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    collection: 'products',
    timestamps: true,
  }
);

productSchema.pre('validate', function () {
  if (!this.sku) {
    this.sku = `VX-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  if (this.maxInventory < this.inventory) {
    this.maxInventory = Math.max(100, this.inventory);
  }
});

productSchema.index({ isDeleted: 1, category: 1, status: 1 });

applyApiTransform(productSchema);

export const Product =
  mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
