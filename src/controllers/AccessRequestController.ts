import { Request, Response } from 'express';
import AccessRequest, { IAccessRequest } from '../models/AccessRequest.js';

export class AccessRequestController {
  // Get all access requests
  static async getAllAccessRequests(req: Request, res: Response): Promise<void> {
    try {
      const accessRequests = await AccessRequest.find()
        .populate('evidenceId')
        .sort({ createdAt: -1 });
      res.json(accessRequests);
    } catch (error) {
      console.error('Error fetching access requests:', error);
      res.status(500).json({ error: 'Failed to fetch access requests' });
    }
  }

  // Get access request by ID
  static async getAccessRequestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const accessRequest = await AccessRequest.findById(id).populate('evidenceId');
      
      if (!accessRequest) {
        res.status(404).json({ error: 'Access request not found' });
        return;
      }
      
      res.json(accessRequest);
    } catch (error) {
      console.error('Error fetching access request:', error);
      res.status(500).json({ error: 'Failed to fetch access request' });
    }
  }

  // Create access request
  static async createAccessRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestData = req.body;
      
      if (!requestData.evidenceId && !requestData.caseId) {
        res.status(400).json({ error: 'Either evidenceId or caseId is required' });
        return;
      }

      const accessRequest = new AccessRequest({
        ...requestData,
        timestamp: new Date().toISOString()
      });
      
      await accessRequest.save();
      
      const populatedRequest = await AccessRequest.findById(accessRequest._id)
        .populate('evidenceId');
      
      res.status(201).json(populatedRequest);
    } catch (error) {
      console.error('Error creating access request:', error);
      res.status(500).json({ error: 'Failed to create access request' });
    }
  }

  // Create access request by case ID
  static async createAccessRequestByCase(req: Request, res: Response): Promise<void> {
    try {
      const { caseId, requestedBy, reason, justification, requestType } = req.body;
      
      if (!caseId || !requestedBy || !reason || !requestType) {
        res.status(400).json({ error: 'caseId, requestedBy, reason, and requestType are required' });
        return;
      }

      const accessRequest = new AccessRequest({
        caseId,
        requestedBy,
        reason,
        justification,
        requestType,
        timestamp: new Date().toISOString()
      });
      
      await accessRequest.save();
      res.status(201).json(accessRequest);
    } catch (error) {
      console.error('Error creating access request by case:', error);
      res.status(500).json({ error: 'Failed to create access request' });
    }
  }

  // Update access request (approve/deny)
  static async updateAccessRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, approvedBy } = req.body;
      
      if (!['approved', 'denied'].includes(status)) {
        res.status(400).json({ error: 'Status must be approved or denied' });
        return;
      }

      const updates: Partial<IAccessRequest> = {
        status,
        approvedBy,
        approvalTimestamp: new Date().toISOString()
      };

      const accessRequest = await AccessRequest.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).populate('evidenceId');
      
      if (!accessRequest) {
        res.status(404).json({ error: 'Access request not found' });
        return;
      }
      
      res.json(accessRequest);
    } catch (error) {
      console.error('Error updating access request:', error);
      res.status(500).json({ error: 'Failed to update access request' });
    }
  }

  // Approve access request
  static async approveAccessRequest(req: Request, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const { approvedBy } = req.body;
      
      const accessRequest = await AccessRequest.findByIdAndUpdate(
        requestId,
        {
          status: 'approved',
          approvedBy,
          approvalTimestamp: new Date().toISOString()
        },
        { new: true, runValidators: true }
      ).populate('evidenceId');
      
      if (!accessRequest) {
        res.status(404).json({ error: 'Access request not found' });
        return;
      }
      
      res.json(accessRequest);
    } catch (error) {
      console.error('Error approving access request:', error);
      res.status(500).json({ error: 'Failed to approve access request' });
    }
  }

  // Deny access request
  static async denyAccessRequest(req: Request, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const { approvedBy } = req.body;
      
      const accessRequest = await AccessRequest.findByIdAndUpdate(
        requestId,
        {
          status: 'denied',
          approvedBy,
          approvalTimestamp: new Date().toISOString()
        },
        { new: true, runValidators: true }
      ).populate('evidenceId');
      
      if (!accessRequest) {
        res.status(404).json({ error: 'Access request not found' });
        return;
      }
      
      res.json(accessRequest);
    } catch (error) {
      console.error('Error denying access request:', error);
      res.status(500).json({ error: 'Failed to deny access request' });
    }
  }

  // Get access requests by user
  static async getAccessRequestsByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const accessRequests = await AccessRequest.find({ requestedBy: userId })
        .populate('evidenceId')
        .sort({ createdAt: -1 });
      
      res.json(accessRequests);
    } catch (error) {
      console.error('Error fetching user access requests:', error);
      res.status(500).json({ error: 'Failed to fetch access requests' });
    }
  }

  // Get pending access requests
  static async getPendingAccessRequests(req: Request, res: Response): Promise<void> {
    try {
      const accessRequests = await AccessRequest.find({ status: 'pending' })
        .populate('evidenceId')
        .sort({ createdAt: -1 });
      
      res.json(accessRequests);
    } catch (error) {
      console.error('Error fetching pending access requests:', error);
      res.status(500).json({ error: 'Failed to fetch pending access requests' });
    }
  }

  // Delete access request
  static async deleteAccessRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const accessRequest = await AccessRequest.findByIdAndDelete(id);
      
      if (!accessRequest) {
        res.status(404).json({ error: 'Access request not found' });
        return;
      }
      
      res.json({ message: 'Access request deleted successfully' });
    } catch (error) {
      console.error('Error deleting access request:', error);
      res.status(500).json({ error: 'Failed to delete access request' });
    }
  }
}

export default AccessRequestController;
