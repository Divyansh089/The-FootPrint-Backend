import mongoose, { Schema, Document } from 'mongoose';

export type Role = 'investigator' | 'analyst' | 'prosecutor' | 'judge' | 'admin';

export interface IUser extends Document {
  id: string;
  role: Role;
  name: string;
  email: string;
  username: string;
  authenticated: boolean;
  permissions: string[];
  isVerified: boolean;
  walletAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  role: {
    type: String,
    enum: ['investigator', 'analyst', 'prosecutor', 'judge', 'admin'],
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  authenticated: {
    type: Boolean,
    default: false
  },
  permissions: [{
    type: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  walletAddress: {
    type: String,
    sparse: true,
    lowercase: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// No explicit indexes needed since email and username already have unique indexes
// walletAddress is sparse and doesn't need an explicit index

export default mongoose.model<IUser>('User', UserSchema);
