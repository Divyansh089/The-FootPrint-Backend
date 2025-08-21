import Evidence from '../models/Evidence.js';
import BlockchainRecord from '../models/BlockchainRecord.js';
import crypto from 'crypto';
// Switched from local IPFS daemon to Pinata API usage. We keep fallback mock CID generation if Pinata creds missing.
export class EvidenceController {
    static initializePinata() {
        EvidenceController.pinataKey = process.env.PINATA_API_KEY;
        EvidenceController.pinataSecret = process.env.PINATA_API_SECRET;
        if (EvidenceController.pinataKey && EvidenceController.pinataSecret) {
            EvidenceController.pinataReady = true;
            console.log('✅ Pinata configured');
        }
        else {
            EvidenceController.pinataReady = false;
            console.warn('⚠️ Pinata credentials not found (PINATA_API_KEY & PINATA_API_SECRET). Using mock CID fallback.');
        }
    }
    // Get all evidence
    static async getAllEvidence(req, res) {
        try {
            const evidence = await Evidence.find()
                .select('-encryptionKey')
                .sort({ createdAt: -1 });
            res.json(evidence);
        }
        catch (error) {
            console.error('Error fetching evidence:', error);
            res.status(500).json({ error: 'Failed to fetch evidence' });
        }
    }
    // Get evidence by ID
    static async getEvidenceById(req, res) {
        try {
            const { id } = req.params;
            const evidence = await Evidence.findById(id).select('-encryptionKey');
            if (!evidence) {
                res.status(404).json({ error: 'Evidence not found' });
                return;
            }
            res.json(evidence);
        }
        catch (error) {
            console.error('Error fetching evidence:', error);
            res.status(500).json({ error: 'Failed to fetch evidence' });
        }
    }
    // Get evidence by case ID
    static async getEvidenceByCaseId(req, res) {
        try {
            const { caseId } = req.params;
            const evidence = await Evidence.find({ caseId })
                .select('-encryptionKey')
                .sort({ createdAt: -1 });
            res.json(evidence);
        }
        catch (error) {
            console.error('Error fetching evidence by case ID:', error);
            res.status(500).json({ error: 'Failed to fetch evidence' });
        }
    }
    // Search evidence
    static async searchEvidence(req, res) {
        try {
            const { q } = req.query;
            if (!q || typeof q !== 'string') {
                res.status(400).json({ error: 'Search query required' });
                return;
            }
            const searchRegex = new RegExp(q, 'i');
            const evidence = await Evidence.find({
                $or: [
                    { caseId: searchRegex },
                    { description: searchRegex },
                    { originalFilename: searchRegex },
                    { uploadedBy: searchRegex }
                ]
            })
                .select('-encryptionKey')
                .sort({ createdAt: -1 });
            res.json(evidence);
        }
        catch (error) {
            console.error('Error searching evidence:', error);
            res.status(500).json({ error: 'Failed to search evidence' });
        }
    }
    // Upload file (Pinata preferred) and return CID only
    static async uploadFileToIpfs(req, res) {
        try {
            const file = req.file;
            if (!file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }
            if (!EvidenceController.pinataReady) {
                // Fallback mock
                const mockCid = `Qm${crypto.randomBytes(32).toString('hex')}`;
                res.json({ cid: mockCid, mock: true });
                return;
            }
            const form = new FormData();
            // Use File constructor if available (Node 20 has Blob/File). Fallback to Blob.
            const fileName = file.originalname || 'upload.bin';
            const blob = new Blob([new Uint8Array(file.buffer)]);
            // Pinata accepts standard multipart field 'file'
            form.append('file', blob, fileName);
            const uploadResp = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    pinata_api_key: EvidenceController.pinataKey,
                    pinata_secret_api_key: EvidenceController.pinataSecret
                },
                body: form
            });
            if (!uploadResp.ok) {
                const text = await uploadResp.text();
                console.error('Pinata file upload failed:', uploadResp.status, text);
                const mockCid = `Qm${crypto.randomBytes(32).toString('hex')}`;
                res.json({ cid: mockCid, mock: true });
                return;
            }
            const uploadJson = await uploadResp.json();
            const cid = uploadJson.IpfsHash || uploadJson.Hash || uploadJson.cid;
            res.json({ cid });
        }
        catch (error) {
            console.error('Error uploading evidence file:', error);
            const mockCid = `Qm${crypto.randomBytes(32).toString('hex')}`;
            res.json({ cid: mockCid, mock: true });
        }
    }
    // Create evidence
    static async createEvidence(req, res) {
        try {
            const evidenceData = req.body;
            // Validate hash format (64 character hex string)
            if (!evidenceData.hash || !/^[a-f0-9]{64}$/.test(evidenceData.hash)) {
                res.status(400).json({ error: 'Invalid hash format. Must be 64-character SHA-256 hex string.' });
                return;
            }
            // Idempotency: if evidence with this hash already exists, return it (no error)
            const existingEvidence = await Evidence.findOne({ hash: evidenceData.hash }).select('-encryptionKey');
            if (existingEvidence) {
                res.status(200).json({ reused: true, ...existingEvidence.toObject() });
                return;
            }
            // Create evidence
            const evidence = new Evidence(evidenceData);
            await evidence.save();
            // Register on blockchain
            const txHash = await EvidenceController.registerOnBlockchain(evidenceData.hash);
            // Update evidence with blockchain info
            evidence.txHash = txHash;
            evidence.blockchainStatus = 'confirmed';
            await evidence.save();
            // Auto-pin metadata if enabled
            const autoPinMetadata = process.env.AUTO_PIN_METADATA !== 'false';
            if (autoPinMetadata) {
                try {
                    await EvidenceController.pinMetadata(String(evidence._id));
                }
                catch (metaError) {
                    console.warn('Failed to auto-pin metadata:', metaError);
                }
            }
            const responseEvidence = await Evidence.findById(evidence._id).select('-encryptionKey');
            res.status(201).json(responseEvidence);
        }
        catch (error) {
            console.error('Error creating evidence:', error);
            res.status(500).json({ error: 'Failed to create evidence' });
        }
    }
    // Register hash on blockchain (mock implementation)
    static async registerOnBlockchain(hash) {
        try {
            const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;
            const timestamp = new Date().toISOString();
            const blockchainRecord = new BlockchainRecord({
                hash,
                txHash,
                timestamp
            });
            await blockchainRecord.save();
            return txHash;
        }
        catch (error) {
            console.error('Error registering on blockchain:', error);
            throw new Error('Blockchain registration failed');
        }
    }
    // Get evidence metadata
    static async getEvidenceMetadata(req, res) {
        try {
            const { id } = req.params;
            const evidence = await Evidence.findById(id);
            if (!evidence) {
                res.status(404).json({ error: 'Evidence not found' });
                return;
            }
            const metadata = EvidenceController.buildEvidenceMetadata(evidence);
            res.json(metadata);
        }
        catch (error) {
            console.error('Error getting evidence metadata:', error);
            res.status(500).json({ error: 'Failed to get evidence metadata' });
        }
    }
    // Pin metadata to IPFS
    static async pinEvidenceMetadata(req, res) {
        try {
            const { id } = req.params;
            const result = await EvidenceController.pinMetadata(id);
            res.json(result);
        }
        catch (error) {
            console.error('Error pinning metadata:', error);
            res.status(500).json({ error: 'Failed to pin metadata' });
        }
    }
    static async pinMetadata(evidenceId) {
        const evidence = await Evidence.findById(evidenceId);
        if (!evidence) {
            throw new Error('Evidence not found');
        }
        const metadata = EvidenceController.buildEvidenceMetadata(evidence);
        let metadataCid;
        if (EvidenceController.pinataReady) {
            try {
                const resp = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        pinata_api_key: EvidenceController.pinataKey,
                        pinata_secret_api_key: EvidenceController.pinataSecret
                    },
                    body: JSON.stringify({ pinataContent: metadata, pinataMetadata: { name: `evidence-${evidenceId}` } })
                });
                if (!resp.ok) {
                    const t = await resp.text();
                    console.warn('Pinata metadata pin failed, fallback mock:', resp.status, t);
                    metadataCid = `Qm${crypto.randomBytes(32).toString('hex')}`;
                }
                else {
                    const j = await resp.json();
                    metadataCid = j.IpfsHash || j.Hash || j.cid || `Qm${crypto.randomBytes(32).toString('hex')}`;
                }
            }
            catch (err) {
                console.warn('Pinata metadata error, using mock CID', err);
                metadataCid = `Qm${crypto.randomBytes(32).toString('hex')}`;
            }
        }
        else {
            metadataCid = `Qm${crypto.randomBytes(32).toString('hex')}`;
        }
        evidence.metadataCid = metadataCid;
        await evidence.save();
        return { ...metadata, metadataCid };
    }
    // Build canonical metadata
    static buildEvidenceMetadata(evidence) {
        const manifest = {
            hash: evidence.hash,
            originalFilename: evidence.originalFilename,
            fileSize: evidence.fileSize,
            fileType: evidence.fileType,
            caseId: evidence.caseId,
            description: evidence.description,
            location: evidence.location,
            timestamp: evidence.timestamp,
            uploadedBy: evidence.uploadedBy,
            ipfsCid: evidence.ipfsCid || null,
            txHash: evidence.txHash || null
        };
        // Canonicalize by sorting keys
        const sortedKeys = Object.keys(manifest).sort();
        const canonical = {};
        for (const k of sortedKeys) {
            canonical[k] = manifest[k];
        }
        const canonicalJson = JSON.stringify(canonical);
        const metaHash = crypto.createHash('sha256').update(canonicalJson).digest('hex');
        const secret = process.env.METADATA_SIGNING_SECRET || '';
        const signature = secret
            ? crypto.createHmac('sha256', secret).update(canonicalJson).digest('hex')
            : undefined;
        return {
            manifest: canonical,
            canonicalJson,
            metaHash,
            signature
        };
    }
    // Verify metadata
    static async verifyMetadata(req, res) {
        try {
            const { evidenceId, providedMetadata } = req.body;
            const evidence = await Evidence.findById(evidenceId);
            if (!evidence) {
                res.status(404).json({ error: 'Evidence not found' });
                return;
            }
            const expectedMetadata = EvidenceController.buildEvidenceMetadata(evidence);
            // Check metadata hash
            const metadataValid = expectedMetadata.metaHash === providedMetadata.metaHash;
            // Check signature if available
            let signatureValid = true;
            const secret = process.env.METADATA_SIGNING_SECRET || '';
            if (secret && providedMetadata.signature) {
                const expectedSignature = crypto
                    .createHmac('sha256', secret)
                    .update(expectedMetadata.canonicalJson)
                    .digest('hex');
                signatureValid = expectedSignature === providedMetadata.signature;
            }
            // Check blockchain
            const blockchainRecord = await BlockchainRecord.findOne({ hash: evidence.hash });
            const blockchainValid = !!blockchainRecord;
            res.json({
                metadataValid,
                signatureValid,
                blockchainValid,
                metaHash: expectedMetadata.metaHash,
                signature: expectedMetadata.signature,
                txHash: blockchainRecord?.txHash,
                blockchainTimestamp: blockchainRecord?.timestamp
            });
        }
        catch (error) {
            console.error('Error verifying metadata:', error);
            res.status(500).json({ error: 'Failed to verify metadata' });
        }
    }
    // Verify evidence hash (legacy endpoint)
    static async verifyEvidence(req, res) {
        try {
            const { hash } = req.body;
            if (!hash) {
                res.status(400).json({ error: 'Hash required' });
                return;
            }
            const blockchainRecord = await BlockchainRecord.findOne({ hash });
            const verified = !!blockchainRecord;
            res.json({
                verified,
                txHash: blockchainRecord?.txHash,
                timestamp: blockchainRecord?.timestamp
            });
        }
        catch (error) {
            console.error('Error verifying evidence:', error);
            res.status(500).json({ error: 'Failed to verify evidence' });
        }
    }
    // Update evidence
    static async updateEvidence(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const evidence = await Evidence.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select('-encryptionKey');
            if (!evidence) {
                res.status(404).json({ error: 'Evidence not found' });
                return;
            }
            res.json(evidence);
        }
        catch (error) {
            console.error('Error updating evidence:', error);
            res.status(500).json({ error: 'Failed to update evidence' });
        }
    }
    // Delete evidence
    static async deleteEvidence(req, res) {
        try {
            const { id } = req.params;
            const evidence = await Evidence.findByIdAndDelete(id);
            if (!evidence) {
                res.status(404).json({ error: 'Evidence not found' });
                return;
            }
            res.json({ message: 'Evidence deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting evidence:', error);
            res.status(500).json({ error: 'Failed to delete evidence' });
        }
    }
}
EvidenceController.pinataReady = false;
export default EvidenceController;
