import { Request, Response } from 'express';
import WalletPermission, { IWalletPermission } from '../models/WalletPermission.js';

export class WalletController {
  // Create wallet access request
  static async createAccessRequest(req: Request, res: Response): Promise<void> {
    try {
      const { evidenceId, caseId, ownerWallet, requesterWallet, role } = req.body;
      
      if (!ownerWallet || !requesterWallet || (!evidenceId && !caseId)) {
        res.status(400).json({ 
          error: 'ownerWallet, requesterWallet and evidenceId or caseId required' 
        });
        return;
      }

      // Check if request already exists
      const existingRequest = await WalletPermission.findOne({
        evidenceId: evidenceId || caseId || '',
        ownerWallet: ownerWallet.toLowerCase(),
        granteeWallet: requesterWallet.toLowerCase()
      });

      if (existingRequest) {
        res.status(409).json({ error: 'Access request already exists' });
        return;
      }

      const walletPermission = new WalletPermission({
        evidenceId: evidenceId || caseId || '',
        ownerWallet: ownerWallet.toLowerCase(),
        granteeWallet: requesterWallet.toLowerCase(),
        role,
        status: 'pending',
        requestedAt: new Date().toISOString()
      });

      await walletPermission.save();
      res.status(201).json(walletPermission);
    } catch (error) {
      console.error('Error creating wallet access request:', error);
      res.status(500).json({ error: 'Failed to create wallet access request' });
    }
  }

  // Grant wallet access
  static async grantAccess(req: Request, res: Response): Promise<void> {
    try {
      const { evidenceId, ownerWallet, granteeWallet } = req.body;
      
      if (!evidenceId || !ownerWallet || !granteeWallet) {
        res.status(400).json({ 
          error: 'evidenceId, ownerWallet, granteeWallet required' 
        });
        return;
      }

      const walletPermission = await WalletPermission.findOneAndUpdate(
        {
          evidenceId,
          ownerWallet: ownerWallet.toLowerCase(),
          granteeWallet: granteeWallet.toLowerCase()
        },
        {
          status: 'granted',
          grantedAt: new Date().toISOString()
        },
        { new: true }
      );

      if (!walletPermission) {
        res.status(404).json({ error: 'Permission request not found' });
        return;
      }

      res.json(walletPermission);
    } catch (error) {
      console.error('Error granting wallet access:', error);
      res.status(500).json({ error: 'Failed to grant wallet access' });
    }
  }

  // Check wallet access
  static async checkAccess(req: Request, res: Response): Promise<void> {
    try {
      const { evidenceId, wallet } = req.query;
      
      if (!evidenceId || !wallet) {
        res.status(400).json({ error: 'evidenceId and wallet required' });
        return;
      }

      const permission = await WalletPermission.findOne({
        evidenceId: evidenceId as string,
        granteeWallet: (wallet as string).toLowerCase(),
        status: 'granted'
      });

      res.json({ allowed: !!permission });
    } catch (error) {
      console.error('Error checking wallet access:', error);
      res.status(500).json({ error: 'Failed to check wallet access' });
    }
  }

  // Get pending wallet access requests
  static async getPendingRequests(req: Request, res: Response): Promise<void> {
    try {
      const { owner, grantee } = req.query;
      
      const filter: any = { status: 'pending' };
      
      if (owner) {
        filter.ownerWallet = (owner as string).toLowerCase();
      }
      
      if (grantee) {
        filter.granteeWallet = (grantee as string).toLowerCase();
      }

      const permissions = await WalletPermission.find(filter)
        .sort({ createdAt: -1 });

      res.json(permissions);
    } catch (error) {
      console.error('Error fetching pending wallet requests:', error);
      res.status(500).json({ error: 'Failed to fetch pending requests' });
    }
  }

  // Revoke wallet access
  static async revokeAccess(req: Request, res: Response): Promise<void> {
    try {
      const { evidenceId, ownerWallet, granteeWallet } = req.body;
      
      if (!evidenceId || !ownerWallet || !granteeWallet) {
        res.status(400).json({ 
          error: 'evidenceId, ownerWallet, granteeWallet required' 
        });
        return;
      }

      const walletPermission = await WalletPermission.findOneAndUpdate(
        {
          evidenceId,
          ownerWallet: ownerWallet.toLowerCase(),
          granteeWallet: granteeWallet.toLowerCase()
        },
        { status: 'revoked' },
        { new: true }
      );

      if (!walletPermission) {
        res.status(404).json({ error: 'Permission not found' });
        return;
      }

      res.json(walletPermission);
    } catch (error) {
      console.error('Error revoking wallet access:', error);
      res.status(500).json({ error: 'Failed to revoke wallet access' });
    }
  }

  // Get all wallet permissions for a user
  static async getUserPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { wallet } = req.params;
      
      const permissions = await WalletPermission.find({
        $or: [
          { ownerWallet: wallet.toLowerCase() },
          { granteeWallet: wallet.toLowerCase() }
        ]
      }).sort({ createdAt: -1 });

      res.json(permissions);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({ error: 'Failed to fetch user permissions' });
    }
  }
}

export default WalletController;

