import mongoose, { Schema } from 'mongoose';
const AccessRequestSchema = new Schema({
    evidenceId: {
        type: Schema.Types.ObjectId,
        ref: 'Evidence',
        sparse: true
    },
    caseId: {
        type: String,
        sparse: true,
        trim: true
    },
    requestedBy: {
        type: String,
        required: true,
        trim: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    justification: {
        type: String,
        trim: true
    },
    requestType: {
        type: String,
        enum: ['analysis', 'testing', 'report'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied'],
        default: 'pending'
    },
    timestamp: {
        type: String,
        required: true
    },
    approvedBy: {
        type: String,
        sparse: true,
        trim: true
    },
    approvalTimestamp: {
        type: String,
        sparse: true
    },
    requesterWallet: {
        type: String,
        sparse: true,
        lowercase: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Indexes for performance
AccessRequestSchema.index({ requestedBy: 1 });
AccessRequestSchema.index({ status: 1 });
AccessRequestSchema.index({ createdAt: -1 });
export default mongoose.model('AccessRequest', AccessRequestSchema);
