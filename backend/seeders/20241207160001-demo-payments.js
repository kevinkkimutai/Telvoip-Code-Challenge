'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, get the client IDs from the database
    const clients = await queryInterface.sequelize.query(
      'SELECT id FROM clients LIMIT 5',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (clients.length === 0) {
      console.log('No clients found. Please run the client seeder first.');
      return;
    }

    const payments = [
      {
        id: uuidv4(),
        invoiceNumber: 'INV-000001',
        clientId: clients[0].id,
        amount: 1250.00,
        currency: 'KES',
        status: 'completed',
        dueDate: new Date('2024-01-15'),
        description: 'Website development project - Phase 1',
        notes: 'Payment received via Stripe',
        paymentMethod: 'stripe',
        transactionId: 'pi_1234567890',
        paidAt: new Date('2024-01-10'),
        taxRate: 0.0875,
        discountAmount: 0.00,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-10')
      },
      {
        id: uuidv4(),
        invoiceNumber: 'INV-000002',
        clientId: clients[1].id,
        amount: 750.00,
        currency: 'KES',
        status: 'pending',
        dueDate: new Date('2024-12-20'),
        description: 'Logo design and branding package',
        notes: 'Awaiting client approval',
        paymentMethod: null,
        transactionId: null,
        paidAt: null,
        taxRate: 0.0875,
        discountAmount: 50.00,
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01')
      },
      {
        id: uuidv4(),
        invoiceNumber: 'INV-000003',
        clientId: clients[2].id,
        amount: 2500.00,
        currency: 'KES',
        status: 'processing',
        dueDate: new Date('2024-12-15'),
        description: 'Monthly consulting retainer - December',
        notes: 'Bank transfer in progress',
        paymentMethod: 'bank_transfer',
        transactionId: 'BT-2024120701',
        paidAt: null,
        taxRate: 0.0875,
        discountAmount: 0.00,
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-07')
      },
      {
        id: uuidv4(),
        invoiceNumber: 'INV-000004',
        clientId: clients[3].id,
        amount: 950.00,
        currency: 'KES',
        status: 'completed',
        dueDate: new Date('2024-11-30'),
        description: 'E-commerce platform setup',
        notes: 'Payment received via PayPal',
        paymentMethod: 'paypal',
        transactionId: 'pp_9876543210',
        paidAt: new Date('2024-11-25'),
        taxRate: 0.0875,
        discountAmount: 0.00,
        createdAt: new Date('2024-11-01'),
        updatedAt: new Date('2024-11-25')
      },
      {
        id: uuidv4(),
        invoiceNumber: 'INV-000005',
        clientId: clients[0].id,
        amount: 1800.00,
        currency: 'KES',
        status: 'failed',
        dueDate: new Date('2024-12-10'),
        description: 'Website development project - Phase 2',
        notes: 'Payment failed - card declined',
        paymentMethod: 'card',
        transactionId: 'failed_12345',
        paidAt: null,
        taxRate: 0.0875,
        discountAmount: 100.00,
        createdAt: new Date('2024-11-15'),
        updatedAt: new Date('2024-12-10')
      },
      {
        id: uuidv4(),
        invoiceNumber: 'INV-000006',
        clientId: clients[4].id,
        amount: 500.00,
        currency: 'KES',
        status: 'cancelled',
        dueDate: new Date('2024-10-15'),
        description: 'SEO optimization service',
        notes: 'Project cancelled by client',
        paymentMethod: null,
        transactionId: null,
        paidAt: null,
        taxRate: 0.0875,
        discountAmount: 0.00,
        createdAt: new Date('2024-10-01'),
        updatedAt: new Date('2024-10-05')
      }
    ];

    await queryInterface.bulkInsert('payments', payments, {});
    return payments;
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('payments', null, {});
  }
};