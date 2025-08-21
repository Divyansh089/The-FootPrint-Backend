import mongoose, { Schema } from 'mongoose';
const WalletPermissionSchema = new Schema({
    evidenceId: {
        type: String,
        required: true,
        trim: true
    },
    ownerWallet: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    granteeWallet: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['investigator', 'analyst'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'granted', 'revoked'],
        default: 'pending'
    },
    requestedAt: {
        type: String,
        required: true
    },
    grantedAt: {
        type: String,
        sparse: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Indexes for performance
WalletPermissionSchema.index({ granteeWallet: 1 });
WalletPermissionSchema.index({ status: 1 });
WalletPermissionSchema.index({ createdAt: -1 });
// Compound index for unique permission requests
WalletPermissionSchema.index({
    evidenceId: 1,
    ownerWallet: 1,
    granteeWallet: 1
}, { unique: true });
export default mongoose.model('WalletPermission', WalletPermissionSchema);
