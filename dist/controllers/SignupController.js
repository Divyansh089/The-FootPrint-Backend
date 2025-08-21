import SignupRequest from '../models/SignupRequest';
import User from '../models/User';
export class SignupController {
    // Get all signup requests
    static async getAllSignupRequests(req, res) {
        try {
            const signupRequests = await SignupRequest.find()
                .sort({ createdAt: -1 });
            res.json(signupRequests);
        }
        catch (error) {
            console.error('Error fetching signup requests:', error);
            res.status(500).json({ error: 'Failed to fetch signup requests' });
        }
    }
    // Get signup request by ID
    static async getSignupRequestById(req, res) {
        try {
            const { id } = req.params;
            const signupRequest = await SignupRequest.findById(id);
            if (!signupRequest) {
                res.status(404).json({ error: 'Signup request not found' });
                return;
            }
            res.json(signupRequest);
        }
        catch (error) {
            console.error('Error fetching signup request:', error);
            res.status(500).json({ error: 'Failed to fetch signup request' });
        }
    }
    // Create signup request
    static async createSignupRequest(req, res) {
        try {
            const { username, email, name, role, reason, documents } = req.body;
            if (!username || !email || !name || !role || !reason) {
                res.status(400).json({
                    error: 'username, email, name, role, and reason are required'
                });
                return;
            }
            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [
                    { email },
                    { username }
                ]
            });
            if (existingUser) {
                res.status(409).json({
                    error: 'User with this email or username already exists'
                });
                return;
            }
            // Check if signup request already exists
            const existingRequest = await SignupRequest.findOne({
                $or: [
                    { email },
                    { username }
                ]
            });
            if (existingRequest) {
                res.status(409).json({
                    error: 'Signup request with this email or username already exists'
                });
                return;
            }
            const signupRequest = new SignupRequest({
                username,
                email,
                name,
                role,
                reason,
                documents,
                requestedAt: new Date().toISOString(),
                status: 'pending'
            });
            await signupRequest.save();
            res.status(201).json(signupRequest);
        }
        catch (error) {
            console.error('Error creating signup request:', error);
            res.status(500).json({ error: 'Failed to create signup request' });
        }
    }
    // Approve signup request
    static async approveSignupRequest(req, res) {
        try {
            const { id } = req.params;
            const { approvedBy } = req.body;
            const signupRequest = await SignupRequest.findById(id);
            if (!signupRequest) {
                res.status(404).json({ error: 'Signup request not found' });
                return;
            }
            if (signupRequest.status !== 'pending') {
                res.status(400).json({ error: 'Request already processed' });
                return;
            }
            // Create user
            const user = new User({
                username: signupRequest.username,
                email: signupRequest.email,
                name: signupRequest.name,
                role: signupRequest.role,
                authenticated: false,
                permissions: [],
                isVerified: true
            });
            await user.save();
            // Update signup request status
            signupRequest.status = 'approved';
            await signupRequest.save();
            res.json({
                message: 'Signup request approved successfully',
                user: await User.findById(user._id).select('-encryptionKey')
            });
        }
        catch (error) {
            console.error('Error approving signup request:', error);
            res.status(500).json({ error: 'Failed to approve signup request' });
        }
    }
    // Reject signup request
    static async rejectSignupRequest(req, res) {
        try {
            const { id } = req.params;
            const { rejectionReason } = req.body;
            const signupRequest = await SignupRequest.findById(id);
            if (!signupRequest) {
                res.status(404).json({ error: 'Signup request not found' });
                return;
            }
            if (signupRequest.status !== 'pending') {
                res.status(400).json({ error: 'Request already processed' });
                return;
            }
            // Update signup request status
            signupRequest.status = 'rejected';
            signupRequest.rejectionReason = rejectionReason;
            await signupRequest.save();
            res.json({
                message: 'Signup request rejected successfully',
                signupRequest
            });
        }
        catch (error) {
            console.error('Error rejecting signup request:', error);
            res.status(500).json({ error: 'Failed to reject signup request' });
        }
    }
    // Get pending signup requests
    static async getPendingSignupRequests(req, res) {
        try {
            const signupRequests = await SignupRequest.find({ status: 'pending' })
                .sort({ createdAt: -1 });
            res.json(signupRequests);
        }
        catch (error) {
            console.error('Error fetching pending signup requests:', error);
            res.status(500).json({ error: 'Failed to fetch pending signup requests' });
        }
    }
    // Delete signup request
    static async deleteSignupRequest(req, res) {
        try {
            const { id } = req.params;
            const signupRequest = await SignupRequest.findByIdAndDelete(id);
            if (!signupRequest) {
                res.status(404).json({ error: 'Signup request not found' });
                return;
            }
            res.json({ message: 'Signup request deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting signup request:', error);
            res.status(500).json({ error: 'Failed to delete signup request' });
        }
    }
}
export default SignupController;
