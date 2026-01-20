// Invoices API Routes
// Handles invoice creation and management

const express = require('express')
const { body, param, query, validationResult } = require('express-validator')
const { supabase, dbHelpers } = require('../config/supabase')

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

// Generate invoice number
const generateInvoiceNumber = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `INV-${year}${month}-${random}`
}

// POST /api/v1/invoices - Create new invoice with items
router.post('/', [
  body('client_id').isUUID().withMessage('Client ID must be a valid UUID'),
  body('due_date').isISO8601().withMessage('Due date must be a valid date'),
  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('items.*.description').notEmpty().withMessage('Item description is required'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('items.*.rate').isFloat({ min: 0.01 }).withMessage('Rate must be greater than 0'),
  body('tax_rate').optional().isFloat({ min: 0, max: 100 }).withMessage('Tax rate must be between 0 and 100'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('Discount must be 0 or greater'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes cannot exceed 1000 characters'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { client_id, due_date, items, tax_rate = 0, discount = 0, notes = '' } = req.body

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      const amount = item.quantity * item.rate
      return sum + amount
    }, 0)

    const discountAmount = discount
    const taxAmount = (subtotal - discountAmount) * (tax_rate / 100)
    const total = subtotal - discountAmount + taxAmount

    // Start transaction
    const invoiceNumber = generateInvoiceNumber()

    // Create payment record first
    const paymentData = {
      invoice_number: invoiceNumber,
      client_id,
      amount: total,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      tax_rate,
      due_date,
      status: 'pending',
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([paymentData])
      .select(`
        *,
        clients (
          id,
          name,
          email,
          company
        )
      `)
      .single()

    if (paymentError) {
      return res.status(500).json(dbHelpers.handleError(paymentError, 'creating payment'))
    }

    // Create invoice items
    const itemsWithPaymentId = items.map(item => ({
      ...item,
      payment_id: payment.id,
      amount: item.quantity * item.rate,
      created_at: new Date().toISOString()
    }))

    const { data: invoiceItems, error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsWithPaymentId)
      .select()

    if (itemsError) {
      // Rollback payment if items creation fails
      await supabase.from('payments').delete().eq('id', payment.id)
      return res.status(500).json(dbHelpers.handleError(itemsError, 'creating invoice items'))
    }

    // Return complete invoice data
    const invoiceData = {
      ...payment,
      invoice_items: invoiceItems
    }

    res.status(201).json(dbHelpers.formatResponse(invoiceData, 'Invoice created successfully'))

  } catch (error) {
    res.status(500).json(dbHelpers.handleError(error, 'creating invoice'))
  }
})

// GET /api/v1/invoices/:id - Get single invoice with items
router.get('/:id', [
  param('id').isUUID().withMessage('Invoice ID must be a valid UUID'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        clients (
          id,
          name,
          email,
          phone,
          company,
          address
        ),
        invoice_items (
          id,
          description,
          quantity,
          rate,
          amount,
          created_at
        )
      `)
      .eq('id', req.params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found',
          message: `Invoice with ID ${req.params.id} does not exist`
        })
      }
      return res.status(500).json(dbHelpers.handleError(error, 'fetching invoice'))
    }

    res.json(dbHelpers.formatResponse(data, 'Invoice retrieved successfully'))

  } catch (error) {
    res.status(500).json(dbHelpers.handleError(error, 'fetching invoice'))
  }
})

// DELETE /api/v1/invoices/:id - Delete invoice and its items
router.delete('/:id', [
  param('id').isUUID().withMessage('Invoice ID must be a valid UUID'),
  handleValidationErrors
], async (req, res) => {
  try {
    // Check if invoice exists and is deletable (only pending invoices)
    const { data: invoice, error: fetchError } = await supabase
      .from('payments')
      .select('id, status, invoice_number')
      .eq('id', req.params.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found',
          message: `Invoice with ID ${req.params.id} does not exist`
        })
      }
      return res.status(500).json(dbHelpers.handleError(fetchError, 'fetching invoice'))
    }

    // Only allow deletion of pending invoices
    if (invoice.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete invoice',
        message: 'Only pending invoices can be deleted'
      })
    }

    // Delete invoice items first (due to foreign key)
    const { error: itemsDeleteError } = await supabase
      .from('invoice_items')
      .delete()
      .eq('payment_id', req.params.id)

    if (itemsDeleteError) {
      return res.status(500).json(dbHelpers.handleError(itemsDeleteError, 'deleting invoice items'))
    }

    // Delete payment/invoice
    const { data, error } = await supabase
      .from('payments')
      .delete()
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) {
      return res.status(500).json(dbHelpers.handleError(error, 'deleting invoice'))
    }

    res.json(dbHelpers.formatResponse(data, 'Invoice deleted successfully'))

  } catch (error) {
    res.status(500).json(dbHelpers.handleError(error, 'deleting invoice'))
  }
})

// PUT /api/v1/invoices/:id/send - Mark invoice as sent
router.put('/:id/send', [
  param('id').isUUID().withMessage('Invoice ID must be a valid UUID'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'pending',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .eq('status', 'draft') // Only allow sending draft invoices
      .select(`
        *,
        clients (
          id,
          name,
          email
        )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Invoice not found or cannot be sent',
          message: 'Invoice not found or is not in draft status'
        })
      }
      return res.status(500).json(dbHelpers.handleError(error, 'sending invoice'))
    }

    res.json(dbHelpers.formatResponse(data, 'Invoice sent successfully'))

  } catch (error) {
    res.status(500).json(dbHelpers.handleError(error, 'sending invoice'))
  }
})

// GET /api/v1/invoices - List invoices with pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'paid', 'overdue', 'cancelled']).withMessage('Invalid status'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { page, limit, offset } = dbHelpers.getPaginationParams(req.query)
    const { sortBy, sortOrder } = dbHelpers.getSortParams(req.query, 'created_at', [
      'created_at', 'due_date', 'amount', 'status', 'invoice_number'
    ])

    let query = supabase
      .from('payments')
      .select(`
        id,
        invoice_number,
        amount,
        status,
        due_date,
        created_at,
        clients (
          id,
          name,
          company
        )
      `, { count: 'exact' })

    // Apply filters
    if (req.query.status) {
      query = query.eq('status', req.query.status)
    }

    // Apply sorting and pagination
    const { data, error, count } = await query
      .order(sortBy, { ascending: sortOrder })
      .range(offset, offset + limit - 1)

    if (error) {
      return res.status(500).json(dbHelpers.handleError(error, 'fetching invoices'))
    }

    const totalPages = Math.ceil(count / limit)

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    res.status(500).json(dbHelpers.handleError(error, 'fetching invoices'))
  }
})

module.exports = router