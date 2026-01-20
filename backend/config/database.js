require('dotenv').config();
const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (databaseUrl) {
  // For direct app usage
  sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    // logging: false, 
  });
  
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('Database connected successfully. 🎉🥂');
    } catch (error) {
      console.error('Unable to connect to the database:', error.message);
    }
  })();
} else {
  console.log('⚠️  No DATABASE_URL found - Sequelize disabled');
}

// Export for Sequelize CLI usage
module.exports = {
  development: {
    dialect: 'postgres',
    url: databaseUrl || 'postgresql://localhost:5432/quickpay_dev', 
    dialectOptions: { ssl: { rejectUnauthorized: false } },
  },
  test: {
    dialect: 'postgres',
    url: databaseUrl || 'postgresql://localhost:5432/quickpay_test', 
  },
  production: {
    dialect: 'postgres',
    url: databaseUrl || process.env.DATABASE_URL, 
  },
};

if (sequelize) {
  module.exports.sequelize = sequelize;
} 