// Payments API Routes
// Handles payment-related operations

const express = require('express')
const { body, param, query, validationResult } = require('express-validator')
const { Client, Payment, InvoiceItem } = require('../models')
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

// GET /api/v1/payments - List all payments with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 10000 }).withMessage('Limit must be between 1 and 10000'),
  query('status').optional().isIn(['pending', 'completed', 'processing', 'failed', 'cancelled', 'all']).withMessage('Invalid status'),
  query('client_id').optional().isUUID().withMessage('Client ID must be a valid UUID'),
  query('search').optional().isLength({ min: 1 }).withMessage('Search term cannot be empty'),
  handleValidationErrors
], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit
    const { status, client_id, search } = req.query

    // Build where conditions
    let whereConditions = {}
    
    if (status && status !== 'all') {
      whereConditions.status = status
    }
    
    if (client_id) {
      whereConditions.clientId = client_id
    }
    
    if (search) {
      whereConditions[Op.or] = [
        { invoiceNumber: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { '$client.name$': { [Op.iLike]: `%${search}%` } },
        { '$client.email$': { [Op.iLike]: `%${search}%` } }
      ]
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: InvoiceItem,
          as: 'items',
          attributes: ['id', 'description', 'quantity', 'unitPrice', 'totalPrice']
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    })

    // Calculate totals
    const totalAmount = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0)

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: limit,
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        },
        summary: {
          totalAmount,
          averageAmount: count > 0 ? totalAmount / count : 0,
          count
        }
      },
      message: `Retrieved ${payments.length} payment${payments.length === 1 ? '' : 's'}`
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: 'Failed to fetch payments. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// GET /api/v1/payments/:id - Get single payment by ID
router.get('/:id', [
  param('id').isUUID().withMessage('Payment ID must be a valid UUID'),
  handleValidationErrors
], async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'phone', 'company', 'address']
        },
        {
          model: InvoiceItem,
          as: 'invoiceItems',
          attributes: ['id', 'description', 'quantity', 'unitPrice', 'totalPrice']
        }
      ]
    })

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
        message: `Payment with ID ${req.params.id} does not exist`
      })
    }

    res.json({
      success: true,
      data: payment,
      message: 'Payment retrieved successfully'
    })

  } catch (error) {
    console.error('Database error during fetching payment:', error)
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: 'Failed to fetch payment. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// PATCH /api/v1/payments/:id - Update payment status or other fields
router.patch('/:id', [
  param('id').isUUID().withMessage('Payment ID must be a valid UUID'),
  body('status').optional().isIn(['pending', 'completed', 'processing', 'failed', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id)
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
        message: `Payment with ID ${req.params.id} does not exist`
      })
    }

    // Update payment
    await payment.update(req.body)

    // Fetch updated payment with relations
    const updatedPayment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email']
        }
      ]
    })

    res.json({
      success: true,
      data: updatedPayment,
      message: 'Payment updated successfully'
    })

  } catch (error) {
    console.error('Database error during updating payment:', error)
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: 'Failed to update payment. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// DELETE /api/v1/payments/:id - Delete payment
router.delete('/:id', [
  param('id').isUUID().withMessage('Payment ID must be a valid UUID'),
  handleValidationErrors
], async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id)

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
        message: `Payment with ID ${req.params.id} does not exist`
      })
    }

    await payment.destroy()

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    })

  } catch (error) {
    console.error('Database error during deleting payment:', error)
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: 'Failed to delete payment. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// GET /api/v1/payments/recent/:count - Get recent payments
router.get('/recent/:count', [
  param('count').isInt({ min: 1, max: 50 }).withMessage('Count must be between 1 and 50'),
  handleValidationErrors
], async (req, res) => {
  try {
    const count = parseInt(req.params.count)

    const payments = await Payment.findAll({
      include: [{
        model: Client,
        as: 'client',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: count
    })

    res.json({
      success: true,
      data: payments,
      message: 'Recent payments retrieved successfully'
    })

  } catch (error) {
    console.error('Database error during fetching recent payments:', error)
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: 'Failed to fetch recent payments. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

module.exports = router