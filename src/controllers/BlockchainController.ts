import { Request, Response } from 'express';
import BlockchainRecord, { IBlockchainRecord } from '../models/BlockchainRecord.js';
import crypto from 'crypto';

export class BlockchainController {
  // Register hash on blockchain
  static async registerHash(req: Request, res: Response): Promise<void> {
    try {
      const { hash } = req.body;
      
      if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
        res.status(400).json({ 
          error: 'Invalid hash format. Must be 64-character SHA-256 hex string.' 
        });
        return;
      }

      // Check if hash already exists
      const existingRecord = await BlockchainRecord.findOne({ hash });
      if (existingRecord) {
        // Idempotent response instead of conflict
        res.status(200).json({
          reused: true,
            hash: existingRecord.hash,
            txHash: existingRecord.txHash,
            timestamp: existingRecord.timestamp
        });
        return;
      }

      // Generate mock transaction hash
      const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      const timestamp = new Date().toISOString();

      const blockchainRecord = new BlockchainRecord({
        hash,
        txHash,
        timestamp
      });

      await blockchainRecord.save();

      res.status(201).json({
        success: true,
        txHash,
        timestamp,
        hash
      });
    } catch (error) {
      console.error('Error registering hash on blockchain:', error);
      res.status(500).json({ error: 'Failed to register hash on blockchain' });
    }
  }

  // Verify hash on blockchain
  static async verifyHash(req: Request, res: Response): Promise<void> {
    try {
      const { hash } = req.params;
      
      if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
        res.status(400).json({ 
          error: 'Invalid hash format. Must be 64-character SHA-256 hex string.' 
        });
        return;
      }

      const blockchainRecord = await BlockchainRecord.findOne({ hash });
      
      if (!blockchainRecord) {
        res.json({
          exists: false,
          message: 'Hash not found on blockchain'
        });
        return;
      }

      res.json({
        exists: true,
        txHash: blockchainRecord.txHash,
        timestamp: blockchainRecord.timestamp,
        blockNumber: blockchainRecord.blockNumber,
        gasUsed: blockchainRecord.gasUsed
      });
    } catch (error) {
      console.error('Error verifying hash on blockchain:', error);
      res.status(500).json({ error: 'Failed to verify hash on blockchain' });
    }
  }

  // Get all blockchain records
  static async getAllRecords(req: Request, res: Response): Promise<void> {
    try {
      const records = await BlockchainRecord.find()
        .sort({ createdAt: -1 })
        .limit(100); // Limit to most recent 100 records
      
      res.json(records);
    } catch (error) {
      console.error('Error fetching blockchain records:', error);
      res.status(500).json({ error: 'Failed to fetch blockchain records' });
    }
  }

  // Get blockchain record by transaction hash
  static async getRecordByTxHash(req: Request, res: Response): Promise<void> {
    try {
      const { txHash } = req.params;
      
      const record = await BlockchainRecord.findOne({ txHash });
      
      if (!record) {
        res.status(404).json({ error: 'Blockchain record not found' });
        return;
      }
      
      res.json(record);
    } catch (error) {
      console.error('Error fetching blockchain record:', error);
      res.status(500).json({ error: 'Failed to fetch blockchain record' });
    }
  }

  // Get blockchain statistics
  static async getBlockchainStats(req: Request, res: Response): Promise<void> {
    try {
      const totalRecords = await BlockchainRecord.countDocuments();
      const recentRecords = await BlockchainRecord.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      });

      const latestRecord = await BlockchainRecord.findOne()
        .sort({ createdAt: -1 });

      res.json({
        totalRecords,
        recentRecords,
        latestRecord: latestRecord ? {
          hash: latestRecord.hash,
          txHash: latestRecord.txHash,
          timestamp: latestRecord.timestamp
        } : null
      });
    } catch (error) {
      console.error('Error fetching blockchain stats:', error);
      res.status(500).json({ error: 'Failed to fetch blockchain stats' });
    }
  }
}

export default BlockchainController;

