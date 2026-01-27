import mongoose, { Schema, Document } from 'mongoose';

export interface ICashRequest extends Document {
  requestId: string;
  dateOfRequest: Date;
  requestingOfficer: string;
  requesterPhone: string;
  position: string;
  department: string;
  purposeOfExpense: string;
  amountRequested: number;
  paymentDay: 'Wednesday' | 'Friday';
  supportingDocuments: {
    invoice: boolean;
    quotation: boolean;
    bill: boolean;
    proforma: boolean;
    other: string;
  };
  operationalJustification: string;
  impactIfNotApproved: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: {
    approverId: mongoose.Types.ObjectId;
    approverName: string;
    approverPhone: string;
    approvedAt: Date;
    comment?: string;
  };
  rejectedBy?: {
    approverId: mongoose.Types.ObjectId;
    approverName: string;
    approverPhone: string;
    rejectedAt: Date;
    reason: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CashRequestSchema = new Schema<ICashRequest>(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
    },
    dateOfRequest: {
      type: Date,
      required: true,
      default: Date.now,
    },
    requestingOfficer: {
      type: String,
      required: true,
      trim: true,
    },
    requesterPhone: { type: String, required: true, trim: true }, // ✅ Keep this one
    position: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    purposeOfExpense: {
      type: String,
      required: true,
      trim: true,
    },
    amountRequested: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDay: {
      type: String,
      enum: ['Wednesday', 'Friday'],
      required: true,
    },
    supportingDocuments: {
      invoice: { type: Boolean, default: false },
      quotation: { type: Boolean, default: false },
      bill: { type: Boolean, default: false },
      proforma: { type: Boolean, default: false },
      other: { type: String, default: '' },
    },
    operationalJustification: {
      type: String,
      required: true,
      trim: true,
    },
    impactIfNotApproved: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedBy: {
      approverId: { type: Schema.Types.ObjectId, ref: 'Approver' },
      approverName: String,
      approverPhone: String,
      approvedAt: Date,
      comment: String,
    },
    rejectedBy: {
      approverId: { type: Schema.Types.ObjectId, ref: 'Approver' },
      approverName: String,
      approverPhone: String,
      rejectedAt: Date,
      reason: String,
    },
  },
  {
    timestamps: true,
  }
);

export const CashRequest = mongoose.model<ICashRequest>('CashRequest', CashRequestSchema);
