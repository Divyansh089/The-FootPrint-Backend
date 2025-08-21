import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import connectDB from './config/database.js';
// Controllers
import UserController from './controllers/UserController.js';
import EvidenceController from './controllers/EvidenceController.js';
import AccessRequestController from './controllers/AccessRequestController.js';
import WalletController from './controllers/WalletController.js';
import SignupController from './controllers/SignupController.js';
import BlockchainController from './controllers/BlockchainController.js';
// Initialize database connection
connectDB();
// Initialize Pinata (IPFS via Pinata)
EvidenceController.initializePinata();
// Seed demo users after database connection
setTimeout(() => {
    UserController.seedDemoUsers();
}, 2000);
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'the-footprint-backend' });
});
// Authentication routes
app.get('/api/users', UserController.getAllUsers);
app.get('/api/users/:id', UserController.getUserById);
app.post('/api/login', UserController.login);
app.post('/api/users', UserController.createUser);
app.put('/api/users/:id', UserController.updateUser);
app.delete('/api/users/:id', UserController.deleteUser);
// Signup request routes
app.get('/api/signup-requests', SignupController.getAllSignupRequests);
app.get('/api/signup-requests/pending', SignupController.getPendingSignupRequests);
app.get('/api/signup-requests/:id', SignupController.getSignupRequestById);
app.post('/api/signup-requests', SignupController.createSignupRequest);
app.post('/api/signup-requests/:id/approve', SignupController.approveSignupRequest);
app.post('/api/signup-requests/:id/reject', SignupController.rejectSignupRequest);
app.delete('/api/signup-requests/:id', SignupController.deleteSignupRequest);
// Evidence routes
app.get('/api/evidence', EvidenceController.getAllEvidence);
app.get('/api/evidence/search', EvidenceController.searchEvidence);
app.get('/api/evidence/:id', EvidenceController.getEvidenceById);
app.get('/api/evidence/by-case/:caseId', EvidenceController.getEvidenceByCaseId);
app.post('/api/evidence', EvidenceController.createEvidence);
app.put('/api/evidence/:id', EvidenceController.updateEvidence);
app.delete('/api/evidence/:id', EvidenceController.deleteEvidence);
// Evidence file upload (IPFS)
app.post('/api/evidence/upload', upload.single('file'), EvidenceController.uploadFileToIpfs);
// Evidence metadata routes
app.get('/api/evidence/:id/metadata', EvidenceController.getEvidenceMetadata);
app.post('/api/evidence/:id/metadata/pin', EvidenceController.pinEvidenceMetadata);
// Verification routes
app.post('/api/verification/metadata', EvidenceController.verifyMetadata);
app.post('/api/verification', EvidenceController.verifyEvidence);
// Access request routes
app.get('/api/access-requests', AccessRequestController.getAllAccessRequests);
app.get('/api/access-requests/pending', AccessRequestController.getPendingAccessRequests);
app.get('/api/access-requests/:id', AccessRequestController.getAccessRequestById);
app.get('/api/access-requests/user/:userId', AccessRequestController.getAccessRequestsByUser);
app.post('/api/access-requests', AccessRequestController.createAccessRequest);
app.post('/api/access-requests/by-case', AccessRequestController.createAccessRequestByCase);
app.put('/api/access-requests/:id', AccessRequestController.updateAccessRequest);
app.post('/api/access-requests/:requestId/approve', AccessRequestController.approveAccessRequest);
app.post('/api/access-requests/:requestId/deny', AccessRequestController.denyAccessRequest);
app.delete('/api/access-requests/:id', AccessRequestController.deleteAccessRequest);
// Blockchain routes
app.post('/api/blockchain/register', BlockchainController.registerHash);
app.get('/api/blockchain/verify/:hash', BlockchainController.verifyHash);
app.get('/api/blockchain/records', BlockchainController.getAllRecords);
app.get('/api/blockchain/tx/:txHash', BlockchainController.getRecordByTxHash);
app.get('/api/blockchain/stats', BlockchainController.getBlockchainStats);
// Wallet access routes
app.post('/api/wallet/access/request', WalletController.createAccessRequest);
app.post('/api/wallet/access/grant', WalletController.grantAccess);
app.post('/api/wallet/access/revoke', WalletController.revokeAccess);
app.get('/api/wallet/access/check', WalletController.checkAccess);
app.get('/api/wallet/access/pending', WalletController.getPendingRequests);
app.get('/api/wallet/permissions/:wallet', WalletController.getUserPermissions);
// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
export default app;
