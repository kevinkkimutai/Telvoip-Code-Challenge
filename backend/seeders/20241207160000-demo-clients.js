'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const clients = [
      {
        id: uuidv4(),
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, New York, NY 10001',
        company: 'Tech Solutions Inc.',
        status: 'active',
        avatar: null,
        notes: 'Preferred client, always pays on time',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+1 (555) 234-5678',
        address: '456 Oak Ave, Los Angeles, CA 90210',
        company: 'Creative Agency LLC',
        status: 'active',
        avatar: null,
        notes: 'New client, requires detailed invoices',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Michael Brown',
        email: 'michael.brown@example.com',
        phone: '+1 (555) 345-6789',
        address: '789 Pine St, Chicago, IL 60601',
        company: 'Global Consulting',
        status: 'active',
        avatar: null,
        notes: 'Long-term client with monthly retainer',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Emily Davis',
        email: 'emily.davis@example.com',
        phone: '+1 (555) 456-7890',
        address: '321 Elm St, Houston, TX 77001',
        company: 'Startup Ventures',
        status: 'active',
        avatar: null,
        notes: 'Fast-growing startup, payment terms 30 days',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Robert Wilson',
        email: 'robert.wilson@example.com',
        phone: '+1 (555) 567-8901',
        address: '654 Maple Dr, Miami, FL 33101',
        company: 'E-commerce Plus',
        status: 'inactive',
        avatar: null,
        notes: 'Former client, project completed',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('clients', clients, {});
    return clients;
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('clients', null, {});
  }
};