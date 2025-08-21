# The Footprint - Backend API

## Overview

This is the backend API for The Footprint evidence management system. It has been migrated from JSON file storage to MongoDB with Mongoose ODM for better scalability, data integrity, and performance.

## Key Features

- **MongoDB Database**: All data is now stored in MongoDB with proper schema validation
- **IPFS Integration**: Files and metadata are stored on IPFS, returning only CIDs (no Ethereum chain links)
- **Wallet-based Access Control**: MetaMask wallet integration for evidence access permissions
- **Metadata Verification**: Cryptographic verification of evidence metadata with HMAC signatures
- **Blockchain Recording**: Mock blockchain for evidence hash registration and verification

## Architecture

### Models

- **User**: System users with roles (investigator, analyst, prosecutor, judge, admin)
- **Evidence**: Digital evidence with IPFS storage and blockchain verification
- **AccessRequest**: Requests for evidence access by case or evidence ID
- **SignupRequest**: User registration requests requiring admin approval
- **WalletPermission**: Wallet-based permissions for evidence access
- **BlockchainRecord**: Blockchain transaction records for evidence hashes

### Controllers

- **UserController**: User management and authentication
- **EvidenceController**: Evidence upload, metadata, and verification
- **AccessRequestController**: Access request management
- **WalletController**: Wallet-based permission system
- **SignupController**: User registration workflow
- **BlockchainController**: Blockchain operations and verification

## Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/footprint-evidence

# IPFS Configuration
IPFS_API_URL=http://127.0.0.1:5001

# Metadata Signing
METADATA_SIGNING_SECRET=your-secret-key-here

# Auto-pin metadata when evidence is created
AUTO_PIN_METADATA=true

# Server Configuration
PORT=4000
NODE_ENV=development
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

You can use either:

**Option A: Local MongoDB**

- Install MongoDB Community Server
- Start MongoDB service
- Database will be created automatically

**Option B: MongoDB Atlas (Cloud)**

- Create a MongoDB Atlas account
- Create a cluster and get connection string
- Update `MONGODB_URI` in `.env`

### 3. IPFS Setup (Optional)

For file storage functionality:

- Install IPFS Desktop or IPFS CLI
- Start IPFS daemon on port 5001
- Or use Infura/Pinata IPFS service

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Build and start production
npm run build
npm start
```

## API Endpoints

### Authentication

- `POST /api/login` - User login
- `GET /api/users` - Get all users
- `POST /api/users` - Create user (admin)

### Evidence Management

- `GET /api/evidence` - Get all evidence
- `POST /api/evidence` - Create evidence
- `POST /api/evidence/upload` - Upload file to IPFS
- `GET /api/evidence/:id/metadata` - Get evidence metadata
- `POST /api/evidence/:id/metadata/pin` - Pin metadata to IPFS

### Access Control

- `GET /api/access-requests` - Get access requests
- `POST /api/access-requests` - Create access request
- `POST /api/access-requests/by-case` - Request access by case ID
- `PUT /api/access-requests/:id` - Approve/deny request

### Wallet Permissions

- `POST /api/wallet/access/request` - Request wallet access
- `POST /api/wallet/access/grant` - Grant wallet access
- `GET /api/wallet/access/check` - Check wallet access
- `GET /api/wallet/access/pending` - Get pending requests

### Blockchain

- `POST /api/blockchain/register` - Register hash on blockchain
- `GET /api/blockchain/verify/:hash` - Verify hash exists
- `GET /api/blockchain/stats` - Get blockchain statistics

### User Registration

- `POST /api/signup-requests` - Submit registration request
- `GET /api/signup-requests/pending` - Get pending requests (admin)
- `POST /api/signup-requests/:id/approve` - Approve request (admin)
- `POST /api/signup-requests/:id/reject` - Reject request (admin)

## Migration from JSON Files

The system has been completely migrated from JSON file storage to MongoDB:

### Benefits

- **Data Integrity**: Schema validation and relationships
- **Performance**: Indexed queries and efficient data access
- **Scalability**: Handle large datasets and concurrent users
- **Backup & Recovery**: Built-in MongoDB backup solutions
- **Security**: Role-based access and data encryption

### Data Models

All previous JSON structures have been converted to Mongoose schemas with:

- Proper data types and validation
- Indexes for performance optimization
- Relationships between collections
- Automatic timestamps

### IPFS Improvements

- Returns only CID strings instead of full gateway URLs
- No Ethereum chain links in responses
- Clean API responses focused on IPFS content addressing
- Proper error handling for IPFS service availability

## Demo Data

The system automatically seeds demo users on startup:

- `admin` - System Administrator
- `investigator` - Detective John Smith
- `analyst` - Dr. Sarah Wilson
- `prosecutor` - Michael Johnson
- `judge` - Judge Patricia Davis

## Security Features

- Input validation with Zod schemas
- HMAC signature verification for metadata
- Wallet address normalization (lowercase)
- Secure encryption key storage (excluded from API responses)
- Proper error handling without information leakage

## Development

The codebase follows TypeScript best practices with:

- Strict type checking
- Interface definitions for all data models
- Proper error handling and logging
- Modular controller architecture
- Clean separation of concerns

For any issues or questions, please refer to the API documentation or contact the development team.

