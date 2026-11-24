import mongoose from 'mongoose';
import { applyApiTransform } from './_transform.js';

const workflowLogSchema = new mongoose.Schema(
  {
    time: {
      type: String,
      default: 'Vừa xong',
      trim: true,
    },
    summary: {
      type: String,
      default: '',
      trim: true,
    },
    output: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const aiWorkflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên quy trình AI là bắt buộc'],
      trim: true,
    },
    description: {
      type: String,
      default: 'Quy trình AI tự động hóa',
      trim: true,
    },
    trigger: {
      type: String,
      required: [true, 'Sự kiện kích hoạt là bắt buộc'],
      default: 'Sản phẩm mới được tạo',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Paused'],
        message: 'Trạng thái quy trình AI không hợp lệ',
      },
      default: 'Active',
      index: true,
    },
    runsCount: {
      type: Number,
      default: 0,
      min: [0, 'Số lượt chạy không được âm'],
    },
    lastRun: {
      type: String,
      default: 'Chưa chạy',
      trim: true,
    },
    logs: {
      type: [workflowLogSchema],
      default: [],
    },
  },
  {
    collection: 'ai_workflows',
    timestamps: true,
  }
);

applyApiTransform(aiWorkflowSchema);

export const AiWorkflow =
  mongoose.models.AiWorkflow || mongoose.model('AiWorkflow', aiWorkflowSchema);

export default AiWorkflow;
