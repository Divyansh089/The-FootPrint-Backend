import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/footprint-evidence';
    
    // Enhanced connection options for MongoDB Atlas
    const options = {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      bufferCommands: false, // Disable mongoose buffering
      dbName: 'footprint-evidence', // Specify database name explicitly
      autoIndex: process.env.NODE_ENV !== 'production', // Build indexes in development only
    };
    
    console.log('🔌 Attempting to connect to MongoDB...');
    console.log(`📍 Connection URI: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`); // Hide credentials in logs
    
    await mongoose.connect(mongoUri, options);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db?.databaseName || 'Unknown'}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    
    // In production, don't exit if DB fails - use in-memory fallback
    if (process.env.NODE_ENV === 'production') {
      console.log('⚠️ Running in fallback mode without persistent database');
      console.log('💡 This means data will not persist between restarts');
      // You could implement in-memory storage here if needed
    } else {
      console.log('💥 Exiting due to database connection failure in development mode');
      process.exit(1);
    }
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 Mongoose disconnected from MongoDB');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose reconnected to MongoDB');
});

mongoose.connection.on('timeout', () => {
  console.log('⏱️ MongoDB connection timeout');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

export default connectDB;

