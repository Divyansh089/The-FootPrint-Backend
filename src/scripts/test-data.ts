import mongoose from 'mongoose';
import Evidence from '../models/Evidence.js';
import AccessRequest from '../models/AccessRequest.js';
import User from '../models/User.js';
import connectDatabase from '../config/database.js';

async function createTestData() {
  try {
    await connectDatabase();
    console.log('Connected to database');

    // Clear existing test data
    await AccessRequest.deleteMany({});
    console.log('Cleared existing access requests');

    // Find users
    const investigator = await User.findOne({ username: 'investigator1' });
    const analyst = await User.findOne({ username: 'analyst1' });

    if (!investigator || !analyst) {
      console.error('Users not found. Make sure demo users exist.');
      return;
    }

    // Create test evidence if none exists
    let evidence = await Evidence.findOne({ uploadedBy: investigator.id });
    if (!evidence) {
      evidence = new Evidence({
        originalFilename: 'test-evidence.pdf',
        caseId: 'CASE-2024-001',
        description: 'Test evidence for access request testing',
        mimeType: 'application/pdf',
        uploadedBy: investigator.id,
        fileSize: 1024,
        hash: 'test-hash-' + Date.now(),
        ipfsCid: 'QmTestCID' + Date.now(),
        blockchainStatus: 'confirmed',
        tags: ['test', 'evidence']
      });
      await evidence.save();
      console.log('Created test evidence:', evidence.id);
    }

    // Create test access request
    const accessRequest = new AccessRequest({
      evidenceId: evidence.id,
      requestedBy: analyst.id,
      caseId: 'CASE-2024-001',
      reason: 'Trial preparation',
      justification: 'Need to analyze this evidence for upcoming trial proceedings',
      requestType: 'analysis',
      status: 'pending',
      timestamp: new Date().toISOString()
    });

    await accessRequest.save();
    console.log('Created test access request:', accessRequest.id);

    console.log('Test data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

createTestData();
