// Clients API Routes
// Handles client management operations

const express = require('express')
const { body, param, query, validationResult } = require('express-validator')
const { Client, Payment } = require('../models')
const { Op } = require('sequelize')

const router = express.Router()

// Validation helper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    })
  }
  next()
}

// GET /api/v1/clients - List all clients with pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000'),
  query('search').optional().isLength({ min: 1 }).withMessage('Search term cannot be empty'),
  handleValidationErrors
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { search } = req.query

    // Build where conditions
    let whereConditions = {}
    
    if (search) {
      whereConditions[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } }
      ]
    }

    const { count, rows: clients } = await Client.findAndCountAll({
      where: whereConditions,
      include: [{
        model: Payment,
        as: 'payments',
        attributes: ['id', 'amount', 'status']
      }],
      limit,
      offset,
      order: [['name', 'ASC']]
    })

    res.json({
      success: true,
      data: {
        clients,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit,
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        }
      },
      message: `Retrieved ${clients.length} client${clients.length === 1 ? '' : 's'}`
    })

  } catch (error) {
    console.error('Error fetching clients:', error)
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: 'Failed to fetch clients. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// GET /api/v1/clients/:id - Get single client by ID
router.get('/:id', [
  param('id').isUUID().withMessage('Client ID must be a valid UUID'),
  handleValidationErrors
], async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [{
        model: Payment,
        as: 'payments',
        attributes: ['id', 'invoiceNumber', 'amount', 'status', 'dueDate', 'createdAt']
      }]
    })

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
        message: `Client with ID ${req.params.id} does not exist`
      })
    }

    res.json({
      success: true,
      data: client,
      message: 'Client retrieved successfully'
    })

  } catch (error) {
    console.error('Error fetching client:', error)
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: 'Failed to fetch client. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// POST /api/v1/clients - Create new client
router.post('/', [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('company').optional().trim(),
  body('address').optional().isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { name, email, phone, company, address } = req.body

    const client = await Client.create({
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone || null,
      company: company?.trim() || null,
      address: address?.trim() || null
    })

    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully'
    })

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'Client already exists',
        message: 'A client with this email already exists'
      })
    }
    
    console.error('Error creating client:', error)
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: 'Failed to create client. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// PUT /api/v1/clients/:id - Update client
router.put('/:id', [
  param('id').isUUID().withMessage('Client ID must be a valid UUID'),
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('company').optional().trim(),
  body('address').optional().isLength({ max: 500 }).withMessage('Address cannot exceed 500 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { name, email, phone, company, address } = req.body

    const client = await Client.findByPk(req.params.id)
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
        message: `Client with ID ${req.params.id} does not exist`
      })
    }

    await client.update({
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone || null,
      company: company?.trim() || null,
      address: address?.trim() || null
    })

    res.json({
      success: true,
      data: client,
      message: 'Client updated successfully'
    })

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
        message: 'Another client with this email already exists'
      })
    }
    
    console.error('Error updating client:', error)
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: 'Failed to update client. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// DELETE /api/v1/clients/:id - Delete client
router.delete('/:id', [
  param('id').isUUID().withMessage('Client ID must be a valid UUID'),
  handleValidationErrors
], async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      include: [{ model: Payment, as: 'payments', limit: 1 }]
    })

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
        message: `Client with ID ${req.params.id} does not exist`
      })
    }

    if (client.payments && client.payments.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete client',
        message: 'Client has existing invoices/payments and cannot be deleted'
      })
    }

    await client.destroy()

    res.json({
      success: true,
      message: 'Client deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting client:', error)
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: 'Failed to delete client. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// GET /api/v1/clients/:id/stats - Get client statistics
router.get('/:id/stats', [
  param('id').isUUID().withMessage('Client ID must be a valid UUID'),
  handleValidationErrors
], async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'company'],
      include: [{
        model: Payment,
        as: 'payments',
        attributes: ['amount', 'status', 'dueDate']
      }]
    })

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
        message: `Client with ID ${req.params.id} does not exist`
      })
    }

    const stats = client.payments || []

    // Calculate statistics
    const totalInvoices = stats.length
    const totalAmount = stats.reduce((sum, payment) => sum + payment.amount, 0)
    const paidAmount = stats.filter(p => p.status === 'completed').reduce((sum, payment) => sum + payment.amount, 0)
    const pendingAmount = stats.filter(p => p.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0)
    const overdueAmount = stats.filter(p => {
      return p.status === 'pending' && new Date(p.dueDate) < new Date()
    }).reduce((sum, payment) => sum + payment.amount, 0)

    const statusCounts = {
      completed: stats.filter(p => p.status === 'completed').length,
      pending: stats.filter(p => p.status === 'pending').length,
      processing: stats.filter(p => p.status === 'processing').length,
      failed: stats.filter(p => p.status === 'failed').length,
      cancelled: stats.filter(p => p.status === 'cancelled').length
    }

    const clientStats = {
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        company: client.company
      },
      statistics: {
        totalInvoices,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        statusCounts,
        paymentRate: totalInvoices > 0 ? (statusCounts.completed / totalInvoices) * 100 : 0
      }
    }

    res.json({
      success: true,
      data: clientStats,
      message: 'Client statistics retrieved successfully'
    })

  } catch (error) {
    console.error('Error fetching client statistics:', error)
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: 'Failed to fetch client statistics. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

module.exports = router