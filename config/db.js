const mongoose = require('mongoose');

async function connectDB() {
  const dbUri = process.env.NODE_ENV === 'production'
    ? process.env.MONGO_URI_PROD
    : process.env.MONGO_URI_DEV;

  if (!dbUri) {
    throw new Error('Missing Mongo connection string. Set MONGO_URI_DEV/MONGO_URI_PROD');
  }

  await mongoose.connect(dbUri);
  console.log(`✅ Connected to MongoDB (${process.env.NODE_ENV || 'development'})`);
}

module.exports = { connectDB };

