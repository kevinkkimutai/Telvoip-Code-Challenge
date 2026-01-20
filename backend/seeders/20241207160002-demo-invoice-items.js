'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get payment IDs from the database
    const payments = await queryInterface.sequelize.query(
      'SELECT id FROM payments LIMIT 6',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (payments.length === 0) {
      console.log('No payments found. Please run the payment seeder first.');
      return;
    }

    const invoiceItems = [];

    // Items for INV-000001 (Website development - Phase 1)
    if (payments[0]) {
      invoiceItems.push(
        {
          id: uuidv4(),
          paymentId: payments[0].id,
          description: 'Frontend Development',
          quantity: 40,
          unitPrice: 75.00,
          totalPrice: 3000.00,
          category: 'Development',
          sku: 'DEV-FRONT-001',
          taxable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          paymentId: payments[0].id,
          description: 'Backend API Development',
          quantity: 30,
          unitPrice: 85.00,
          totalPrice: 2550.00,
          category: 'Development',
          sku: 'DEV-BACK-001',
          taxable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          paymentId: payments[0].id,
          description: 'Database Setup',
          quantity: 8,
          unitPrice: 90.00,
          totalPrice: 720.00,
          category: 'Development',
          sku: 'DEV-DB-001',
          taxable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }

    // Items for INV-000002 (Logo design and branding)
    if (payments[1]) {
      invoiceItems.push(
        {
          id: uuidv4(),
          paymentId: payments[1].id,
          description: 'Logo Design (3 concepts)',
          quantity: 1,
          unitPrice: 450.00,
          totalPrice: 450.00,
          category: 'Design',
          sku: 'DES-LOGO-001',
          taxable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          paymentId: payments[1].id,
          description: 'Brand Guidelines Document',
          quantity: 1,
          unitPrice: 350.00,
          totalPrice: 350.00,
          category: 'Design',
          sku: 'DES-BRAND-001',
          taxable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }

    // Items for INV-000003 (Monthly consulting)
    if (payments[2]) {
      invoiceItems.push(
        {
          id: uuidv4(),
          paymentId: payments[2].id,
          description: 'Strategic Consulting - December 2024',
          quantity: 1,
          unitPrice: 2500.00,
          totalPrice: 2500.00,
          category: 'Consulting',
          sku: 'CONS-MONTH-001',
          taxable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }

    // Items for INV-000004 (E-commerce setup)
    if (payments[3]) {
      invoiceItems.push(
        {
          id: uuidv4(),
          paymentId: payments[3].id,
          description: 'Shopify Store Setup',
          quantity: 1,
          unitPrice: 600.00,
          totalPrice: 600.00,
          category: 'E-commerce',
          sku: 'ECOM-SETUP-001',
          taxable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          paymentId: payments[3].id,
          description: 'Product Catalog Setup',
          quantity: 1,
          unitPrice: 250.00,
          totalPrice: 250.00,
          category: 'E-commerce',
          sku: 'ECOM-CAT-001',
          taxable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          paymentId: payments[3].id,
          description: 'Payment Gateway Integration',
          quantity: 1,
          unitPrice: 100.00,
          totalPrice: 100.00,
          category: 'E-commerce',
          sku: 'ECOM-PAY-001',
          taxable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }

    // Items for INV-000005 (Phase 2 development)
    if (payments[4]) {
      invoiceItems.push(
        {
          id: uuidv4(),
          paymentId: payments[4].id,
          description: 'Advanced Features Development',
          quantity: 25,
          unitPrice: 80.00,
          totalPrice: 2000.00,
          category: 'Development',
          sku: 'DEV-ADV-001',
          taxable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }

    // Items for INV-000006 (SEO service - cancelled)
    if (payments[5]) {
      invoiceItems.push(
        {
          id: uuidv4(),
          paymentId: payments[5].id,
          description: 'SEO Audit and Optimization',
          quantity: 1,
          unitPrice: 500.00,
          totalPrice: 500.00,
          category: 'Marketing',
          sku: 'SEO-AUDIT-001',
          taxable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }

    await queryInterface.bulkInsert('invoice_items', invoiceItems, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('invoice_items', null, {});
  }
};