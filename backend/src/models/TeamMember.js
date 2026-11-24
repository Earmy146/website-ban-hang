import mongoose from 'mongoose';
import { applyApiTransform, deriveInitials } from './_transform.js';

const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Họ và tên thành viên là bắt buộc'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email thành viên là bắt buộc'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Định dạng email không hợp lệ'],
    },
    role: {
      type: String,
      required: [true, 'Vai trò phân quyền là bắt buộc'],
      default: 'Chuyên viên CSKH',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Invited'],
        message: 'Trạng thái thành viên không hợp lệ',
      },
      default: 'Active',
      index: true,
    },
    avatar: {
      type: String,
      default: '',
      trim: true,
    },
    lastActive: {
      type: String,
      default: 'Vừa mời',
      trim: true,
    },
  },
  {
    collection: 'team_members',
    timestamps: true,
  }
);

teamMemberSchema.pre('validate', function () {
  if (!this.avatar && this.name) {
    this.avatar = deriveInitials(this.name, 'NV');
  }
});

applyApiTransform(teamMemberSchema);

export const TeamMember =
  mongoose.models.TeamMember || mongoose.model('TeamMember', teamMemberSchema);

export default TeamMember;
