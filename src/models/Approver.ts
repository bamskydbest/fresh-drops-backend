import mongoose, { Schema, Document } from 'mongoose';

export interface IApprover extends Document {
  name: string;
  phone: string;
  position: string;
  role: 'super' | 'normal';      
  isActive: boolean;
  otp?: string | null;           
  otpExpires?: number | null;    
  createdAt: Date;
  updatedAt: Date;
}

const ApproverSchema = new Schema<IApprover>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v: string) {
          return /^(\+233|0)[0-9]{9}$/.test(v);
        },
        message: 'Phone number must be a valid Ghanaian number',
      },
    },

    position: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ['super', 'normal'],
      default: 'normal',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    otp: {
      type: String,
      default: null,
    },

    otpExpires: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Approver = mongoose.model<IApprover>(
  'Approver',
  ApproverSchema
);
