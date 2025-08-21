#!/bin/bash

# Simple health check script for deployment testing

echo "🔍 Testing Backend Health..."

# Test local development
echo "Testing local development server..."
curl -f http://localhost:4001/api/health || echo "❌ Local server not responding"

# Test deployment server  
echo "Testing deployment server..."
curl -f http://localhost:10000/api/health || echo "❌ Deployment server not responding"

echo "✅ Health check complete"
