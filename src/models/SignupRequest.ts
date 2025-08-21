import mongoose, { Document, Schema } from 'mongoose';
import { Role } from './User.js';

export interface ISignupRequest extends Document {
  id: string;
  username: string;
  email: string;
  name: string;
  role: Exclude<Role, 'admin'>;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  documents?: string[];
  reason: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SignupRequestSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['investigator', 'analyst', 'prosecutor', 'judge'],
    required: true
  },
  requestedAt: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  documents: [{
    type: String
  }],
  reason: {
    type: String,
    required: true,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (email and username already have unique indexes)
SignupRequestSchema.index({ status: 1 });
SignupRequestSchema.index({ createdAt: -1 });

export default mongoose.model<ISignupRequest>('SignupRequest', SignupRequestSchema);
