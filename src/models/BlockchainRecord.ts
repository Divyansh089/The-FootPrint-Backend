import mongoose, { Schema, Document } from 'mongoose';

export interface IBlockchainRecord extends Document {
  id: string;
  hash: string;
  txHash: string;
  timestamp: string;
  blockNumber?: number;
  gasUsed?: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlockchainRecordSchema: Schema = new Schema({
  hash: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v: string) {
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

export default mongoose.model<IBlockchainRecord>('BlockchainRecord', BlockchainRecordSchema);
