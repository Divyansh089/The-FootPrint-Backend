import mongoose, { Schema, Document } from 'mongoose';

export interface IEvidence extends Document {
  id: string;
  hash: string;
  originalFilename: string;
  caseId: string;
  description: string;
  location: string;
  timestamp: string;
  uploadedBy: string;
  blockchainStatus: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  fileSize: number;
  fileType: string;
  encryptionKey?: string;
  ipfsCid?: string;
  metadataCid?: string;
  ownerWallet?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EvidenceSchema: Schema = new Schema({
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
  originalFilename: {
    type: String,
    required: true,
    trim: true
  },
  caseId: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: String,
    required: true,
    trim: true
  },
  blockchainStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  txHash: {
    type: String,
    sparse: true
  },
  fileSize: {
    type: Number,
    required: true,
    min: 0
  },
  fileType: {
    type: String,
    required: true,
    trim: true
  },
  encryptionKey: {
    type: String,
    select: false // Don't include in regular queries for security
  },
  ipfsCid: {
    type: String,
    sparse: true
  },
  metadataCid: {
    type: String,
    sparse: true
  },
  ownerWallet: {
    type: String,
    sparse: true,
    lowercase: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (hash already has unique index)
EvidenceSchema.index({ uploadedBy: 1 });
EvidenceSchema.index({ createdAt: -1 });

export default mongoose.model<IEvidence>('Evidence', EvidenceSchema);
