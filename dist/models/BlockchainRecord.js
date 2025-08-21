import mongoose, { Schema } from 'mongoose';
const BlockchainRecordSchema = new Schema({
    hash: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
                return /^[a-f0-9]{64}$/.test(v); // SHA-256 hash validation
            },
            message: 'Hash must be a valid 64-character SHA-256 hex string'
        }
    },
    txHash: {
        type: String,
        required: true,
        unique: true
    },
    timestamp: {
        type: String,
        required: true
    },
    blockNumber: {
        type: Number,
        sparse: true
    },
    gasUsed: {
        type: Number,
        sparse: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Indexes for performance (hash and txHash already have unique indexes)
BlockchainRecordSchema.index({ createdAt: -1 });
export default mongoose.model('BlockchainRecord', BlockchainRecordSchema);
