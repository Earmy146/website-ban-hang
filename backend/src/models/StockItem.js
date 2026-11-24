import mongoose from 'mongoose';
import { applyApiTransform } from './_transform.js';

const stockItemSchema = new mongoose.Schema(
  {
    productRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Tên mặt hàng tồn kho là bắt buộc'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Danh mục mặt hàng là bắt buộc'],
      default: 'Thời trang & May mặc',
      trim: true,
      index: true,
    },
    brand: {
      type: String,
      default: 'Veylix Studio',
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'Mã SKU tồn kho là bắt buộc'],
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    onHand: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng sẵn có không được âm'],
    },
    committed: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng giữ chỗ không được âm'],
    },
    incoming: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng đang nhập không được âm'],
    },
    available: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng khả dụng không được âm'],
    },
    reorderPoint: {
      type: Number,
      default: 15,
      min: [0, 'Ngưỡng cảnh báo đặt hàng không được âm'],
    },
    locationNY: {
      type: Number,
      default: 0,
      min: [0, 'Tồn kho miền Bắc (NY) không được âm'],
    },
    locationCA: {
      type: Number,
      default: 0,
      min: [0, 'Tồn kho miền Trung (CA) không được âm'],
    },
    locationTX: {
      type: Number,
      default: 0,
      min: [0, 'Tồn kho miền Nam (TX) không được âm'],
    },
    status: {
      type: String,
      enum: {
        values: ['Healthy', 'Low', 'Out'],
        message: 'Trạng thái tồn kho không hợp lệ',
      },
      default: 'Healthy',
      index: true,
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Giá vốn không được âm'],
    },
    retailPrice: {
      type: Number,
      default: 0,
      min: [0, 'Giá bán lẻ không được âm'],
    },
  },
  {
    collection: 'stock_items',
    timestamps: true,
  }
);

stockItemSchema.pre('validate', function () {
  this.available = Math.max(0, (this.onHand || 0) - (this.committed || 0));
  if (this.available === 0) {
    this.status = 'Out';
  } else if (this.available <= (this.reorderPoint ?? 15)) {
    this.status = 'Low';
  } else {
    this.status = 'Healthy';
  }
});

applyApiTransform(stockItemSchema);

export const StockItem =
  mongoose.models.StockItem || mongoose.model('StockItem', stockItemSchema);

export default StockItem;
