import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';
dotenv.config();
const seedUsers = async () => {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/the_footprint';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        // Clear existing users
        await User.deleteMany({});
        console.log('🗑️  Cleared existing users');
        // Create seed users that match frontend expectations
        const users = [
            {
                username: 'demo',
                role: 'investigator',
                name: 'Demo Investigator',
                email: 'demo@investigator.com',
                authenticated: false,
                permissions: ['evidence_upload', 'evidence_view', 'blockchain_access'],
                isVerified: true
            },
            {
                username: 'admin',
                role: 'admin',
                name: 'System Administrator',
                email: 'admin@system.com',
                authenticated: false,
                permissions: ['all'],
                isVerified: true
            },
            {
                username: 'analyst',
                role: 'analyst',
                name: 'Demo Analyst',
                email: 'analyst@demo.com',
                authenticated: false,
                permissions: ['evidence_view', 'evidence_analysis'],
                isVerified: true
            },
            {
                username: 'prosecutor',
                role: 'prosecutor',
                name: 'Demo Prosecutor',
                email: 'prosecutor@demo.com',
                authenticated: false,
                permissions: ['evidence_view', 'case_management'],
                isVerified: true
            },
            {
                username: 'judge',
                role: 'judge',
                name: 'Demo Judge',
                email: 'judge@demo.com',
                authenticated: false,
                permissions: ['evidence_view', 'verification', 'case_approval'],
                isVerified: true
            }
        ];
        // Insert users
        const createdUsers = await User.insertMany(users);
        console.log(`✅ Created ${createdUsers.length} users:`);
        createdUsers.forEach(user => {
            console.log(`  - ${user.username} (${user.role})`);
        });
        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('  Username: demo, Password: demo → Investigator');
        console.log('  Username: admin, Password: admin → Admin');
        console.log('  Username: analyst, Password: analyst → Analyst');
        console.log('  Username: prosecutor, Password: prosecutor → Prosecutor');
        console.log('  Username: judge, Password: judge → Judge');
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
    }
    finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
};
// Run the seed function
seedUsers();
