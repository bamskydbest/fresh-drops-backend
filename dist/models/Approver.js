import mongoose, { Schema } from 'mongoose';
const ApproverSchema = new Schema({
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
            validator: function (v) {
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
}, {
    timestamps: true,
});
export const Approver = mongoose.model('Approver', ApproverSchema);
//# sourceMappingURL=Approver.js.map