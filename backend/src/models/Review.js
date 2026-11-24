import mongoose from 'mongoose';
import { applyApiTransform } from './_transform.js';

const reviewSchema = new mongoose.Schema(
  {
    productRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true,
    },
    customerRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    productName: {
      type: String,
      required: [true, 'Tên sản phẩm được đánh giá là bắt buộc'],
      trim: true,
      index: true,
    },
    customerName: {
      type: String,
      required: [true, 'Tên người đánh giá là bắt buộc'],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'Điểm xếp hạng sao là bắt buộc'],
      min: [1, 'Điểm xếp hạng tối thiểu là 1 sao'],
      max: [5, 'Điểm xếp hạng tối đa là 5 sao'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề đánh giá là bắt buộc'],
      trim: true,
    },
    comment: {
      type: String,
      required: [true, 'Nội dung đánh giá là bắt buộc'],
      trim: true,
    },
    date: {
      type: String,
      default: 'Hôm nay',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Published', 'Pending', 'Flagged'],
        message: 'Trạng thái kiểm duyệt đánh giá không hợp lệ',
      },
      default: 'Pending',
      index: true,
    },
    sentiment: {
      type: String,
      enum: {
        values: ['Positive', 'Neutral', 'Negative'],
        message: 'Sắc thái đánh giá không hợp lệ',
      },
      default: 'Positive',
    },
    verified: {
      type: Boolean,
      default: true,
    },
    response: {
      type: String,
      default: null,
    },
  },
  {
    collection: 'reviews',
    timestamps: true,
  }
);

applyApiTransform(reviewSchema);

export const Review =
  mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review;
