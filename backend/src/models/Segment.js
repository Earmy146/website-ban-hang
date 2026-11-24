import mongoose from 'mongoose';
import { applyApiTransform } from './_transform.js';

const segmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên phân khúc là bắt buộc'],
      trim: true,
      unique: true,
    },
    count: {
      type: Number,
      default: 0,
      min: [0, 'Số lượng khách trong phân khúc không được âm'],
    },
    criteria: {
      type: String,
      default: 'Tùy chỉnh thủ công',
      trim: true,
    },
    aov: {
      type: Number,
      default: 0,
      min: [0, 'Giá trị trung bình không được âm'],
    },
    color: {
      type: String,
      default: '#10b981',
      trim: true,
    },
  },
  {
    collection: 'segments',
    timestamps: true,
  }
);

applyApiTransform(segmentSchema);

export const Segment =
  mongoose.models.Segment || mongoose.model('Segment', segmentSchema);

export default Segment;
