import { Request, Response } from 'express';
import User, { IUser, Role } from '../models/User.js';
import SignupRequest from '../models/SignupRequest.js';

export class UserController {
  // Get all users
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await User.find().select('-encryptionKey');
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  // Get user by ID
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await User.findById(id).select('-encryptionKey');
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  // Login user
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, role } = req.body;
      
      if (!username || !role) {
        res.status(400).json({ error: 'Username and role required' });
        return;
      }

      const user = await User.findOne({ username, role }).select('-encryptionKey');
      
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Update authentication status
      user.authenticated = true;
      await user.save();

      res.json(user);
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  // Create user (admin only)
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body;
      
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });

      if (existingUser) {
        res.status(409).json({ error: 'User with this email or username already exists' });
        return;
      }

      const user = new User(userData);
      await user.save();
      
      const userResponse = await User.findById(user._id).select('-encryptionKey');
      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  // Update user
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const user = await User.findByIdAndUpdate(
        id, 
        updates, 
        { new: true, runValidators: true }
      ).select('-encryptionKey');
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  // Delete user
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const user = await User.findByIdAndDelete(id);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  // Seed demo users
  static async seedDemoUsers(): Promise<void> {
    try {
      const existingUsers = await User.countDocuments();
      if (existingUsers > 0) {
        console.log('Demo users already exist, skipping seed...');
        return;
      }

      const demoUsers = [
        {
          role: 'admin' as Role,
          name: 'System Administrator',
          email: 'admin@system.gov',
          username: 'admin',
          authenticated: true,
          permissions: ['manage_users', 'verify_accounts', 'system_admin'],
          isVerified: true
        },
        {
          role: 'investigator' as Role,
          name: 'Detective John Smith',
          email: 'j.smith@police.gov',
          username: 'investigator',
          authenticated: true,
          permissions: ['upload_evidence', 'manage_cases'],
          isVerified: true
        },
        {
          role: 'analyst' as Role,
          name: 'Dr. Sarah Wilson',
          email: 's.wilson@forensics.gov',
          username: 'analyst',
          authenticated: true,
          permissions: ['analyze_evidence', 'generate_reports'],
          isVerified: true
        },
        {
          role: 'prosecutor' as Role,
          name: 'Michael Johnson',
          email: 'm.johnson@da.gov',
          username: 'prosecutor',
          authenticated: true,
          permissions: ['access_evidence', 'court_presentation'],
          isVerified: true
        },
        {
          role: 'judge' as Role,
          name: 'Judge Patricia Davis',
          email: 'p.davis@court.gov',
          username: 'judge',
          authenticated: true,
          permissions: ['verify_evidence', 'case_oversight'],
          isVerified: true
        }
      ];

      await User.insertMany(demoUsers);
      console.log('✅ Demo users seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding demo users:', error);
    }
  }
}

export default UserController;

