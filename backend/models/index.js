'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/database.js')[env];
const db = {};

let sequelize;
if (config.url) {
  // Use the URL directly from config
  sequelize = new Sequelize(config.url, {
    dialect: config.dialect || 'postgres',
    dialectOptions: config.dialectOptions || {},
    logging: config.logging || false
  });
} else if (config.use_env_variable) {
  const dbUrl = process.env[config.use_env_variable];
  if (dbUrl) {
    sequelize = new Sequelize(dbUrl, {
      ...config,
      logging: config.logging || false
    });
  } else {
    console.warn(`⚠️  Environment variable ${config.use_env_variable} not found`);
    // Create a mock sequelize instance for development
    sequelize = {
      authenticate: () => Promise.reject(new Error('No database URL provided')),
      sync: () => Promise.resolve(),
      close: () => Promise.resolve()
    };
  }
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;