#!/usr/bin/env node

/**
 * Database initialization script
 * This script sets up the database and runs migrations and seeders
 */

require('dotenv').config();
const { sequelize } = require('../models');

const initDatabase = async () => {
  try {
    console.log('🔄 Initializing database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Run migrations
    console.log('🔄 Running migrations...');
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Run migrations
    await execAsync('npm run migrate');
    console.log('✅ Migrations completed');
    
    // Run seeders
    console.log('🔄 Running seeders...');
    await execAsync('npm run seed');
    console.log('✅ Seeders completed');
    
    console.log('🎉 Database initialization completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

// Run the initialization
initDatabase();