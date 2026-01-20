// Stats API Routes
// Provides dashboard statistics and analytics

const express = require('express')
const { query, validationResult } = require('express-validator')
const { Client, Payment, InvoiceItem } = require('../models')

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

// GET /api/v1/stats - Get main dashboard statistics (root endpoint)
router.get('/', async (req, res) => {
  try {
    // Get all payments with client info
    const payments = await Payment.findAll({
      include: [{
        model: Client,
        as: 'client'
      }]
    })

    // Get total clients count
    const totalClients = await Client.count()

    // Calculate key metrics
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)

    const pendingPayments = payments.filter(p => p.status === 'pending')
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)

    const overduePayments = payments.filter(p => {
      return p.status === 'pending' && new Date(p.dueDate) < now
    })
    const overdueAmount = overduePayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)

    const recentPayments = payments
      .filter(p => new Date(p.createdAt) >= thirtyDaysAgo)

    const stats = {
      total: parseFloat(totalRevenue.toFixed(2)),
      paid: parseFloat(totalRevenue.toFixed(2)),
      pending: parseFloat(pendingAmount.toFixed(2)),
      overdue: parseFloat(overdueAmount.toFixed(2)),
      totalPayments: payments.length,
      completedPayments: payments.filter(p => p.status === 'completed').length,
      pendingPaymentsCount: pendingPayments.length,
      overduePaymentsCount: overduePayments.length,
      totalClients,
      recentPaymentsCount: recentPayments.length
    }

    res.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: 'Failed to fetch statistics'
    })
  }
})

// GET /api/v1/stats/dashboard - Get main dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    // Get all payments with client info
    const payments = await Payment.findAll({
      include: [{
        model: Client,
        as: 'client'
      }]
    })

    // Get total clients count
    const totalClients = await Client.count()

    // Calculate key metrics
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)

    const pendingPayments = payments.filter(p => p.status === 'pending')
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)

    const overduePayments = payments.filter(p => {
      return p.status === 'pending' && new Date(p.dueDate) < now
    })
    const overdueAmount = overduePayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)

    // Recent payments (last 30 days)
    const recentRevenue = payments
      .filter(p => p.status === 'completed' && new Date(p.createdAt) >= thirtyDaysAgo)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0)

    // Status distribution
    const statusCounts = {
      completed: payments.filter(p => p.status === 'completed').length,
      pending: payments.filter(p => p.status === 'pending').length,
      processing: payments.filter(p => p.status === 'processing').length,
      failed: payments.filter(p => p.status === 'failed').length,
      cancelled: payments.filter(p => p.status === 'cancelled').length,
      overdue: overduePayments.length
    }

    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthRevenue = payments
        .filter(p => {
          const paymentDate = new Date(p.createdAt)
          return p.status === 'completed' && paymentDate >= monthStart && paymentDate <= monthEnd
        })
        .reduce((sum, p) => sum + parseFloat(p.amount), 0)

      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        payments: payments.filter(p => {
          const paymentDate = new Date(p.createdAt)
          return p.status === 'completed' && paymentDate >= monthStart && paymentDate <= monthEnd
        }).length
      })
    }

    const dashboardStats = {
      overview: {
        totalRevenue,
        pendingAmount,
        overdueAmount,
        totalInvoices: payments.length,
        totalClients,
        recentRevenue, // Last 30 days
        pendingInvoices: pendingPayments.length,
        overdueInvoices: overduePayments.length
      },
      statusDistribution: statusCounts,
      monthlyTrend: monthlyRevenue,
      performance: {
        collectionRate: payments.length > 0 ? (statusCounts.completed / payments.length) * 100 : 0,
        averageInvoiceValue: payments.length > 0 ? payments.reduce((sum, p) => sum + parseFloat(p.amount), 0) / payments.length : 0,
        onTimePaymentRate: payments.length > 0 ? (statusCounts.completed / payments.length) * 100 : 0
      },
      // Frontend compatibility format
      total: totalRevenue,
      paid: totalRevenue,
      pending: pendingAmount,
      overdue: overdueAmount,
      paidCount: statusCounts.completed,
      pendingCount: statusCounts.pending,
      overdueCount: overduePayments.length,
      totalCount: payments.length
    }

    res.json({
      success: true,
      data: dashboardStats,
      message: 'Dashboard statistics retrieved successfully'
    })

  } catch (error) {
    console.error('Error fetching dashboard statistics:', error)
    res.status(500).json({
      success: false,
      error: 'Database error',
      message: 'Failed to fetch dashboard statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// GET /api/v1/stats/payments - Get payment statistics with filters
router.get('/payments', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Period must be one of: 7d, 30d, 90d, 1y'),
  query('status').optional().isIn(['paid', 'pending', 'overdue', 'cancelled']).withMessage('Invalid status'),
  handleValidationErrors
], async (req, res) => {
  try {
    const period = req.query.period || '30d'
    const status = req.query.status

    // Calculate date range
    const now = new Date()
    let startDate
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    let query = supabase
      .from('payments')
      .select(`
        amount,
        status,
        created_at,
        due_date,
        clients (
          name,
          company
        )
      `)
      .gte('created_at', startDate.toISOString())

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status)
    }

    const { data: payments, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json(dbHelpers.handleError(error, 'fetching payment statistics'))
    }

    // Calculate statistics
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    const avgAmount = payments.length > 0 ? totalAmount / payments.length : 0

    // Daily breakdown
    const dailyStats = {}
    payments.forEach(payment => {
      const date = new Date(payment.created_at).toISOString().split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = { count: 0, amount: 0, statuses: {} }
      }
      dailyStats[date].count++
      dailyStats[date].amount += payment.amount
      dailyStats[date].statuses[payment.status] = (dailyStats[date].statuses[payment.status] || 0) + 1
    })

    const paymentStats = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: now.toISOString()
      },
      summary: {
        totalPayments: payments.length,
        totalAmount,
        averageAmount: avgAmount,
        statusCounts: {
          paid: payments.filter(p => p.status === 'paid').length,
          pending: payments.filter(p => p.status === 'pending').length,
          overdue: payments.filter(p => p.status === 'overdue').length,
          cancelled: payments.filter(p => p.status === 'cancelled').length
        }
      },
      dailyBreakdown: Object.entries(dailyStats)
        .map(([date, stats]) => ({ date, ...stats }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topClients: payments
        .reduce((acc, payment) => {
          const clientKey = payment.clients?.name || 'Unknown'
          if (!acc[clientKey]) {
            acc[clientKey] = { name: clientKey, amount: 0, count: 0 }
          }
          acc[clientKey].amount += payment.amount
          acc[clientKey].count++
          return acc
        }, {})
    }

    res.json(dbHelpers.formatResponse(paymentStats, 'Payment statistics retrieved successfully'))

  } catch (error) {
    res.status(500).json(dbHelpers.handleError(error, 'fetching payment statistics'))
  }
})

// GET /api/v1/stats/clients - Get client statistics
router.get('/clients', async (req, res) => {
  try {
    // Get all clients with their payment data
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        email,
        company,
        created_at,
        payments (
          amount,
          status,
          due_date
        )
      `)

    if (error) {
      return res.status(500).json(dbHelpers.handleError(error, 'fetching client statistics'))
    }

    // Calculate client metrics
    const clientStats = clients.map(client => {
      const payments = client.payments || []
      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
      const paidAmount = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
      const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
      
      return {
        id: client.id,
        name: client.name,
        email: client.email,
        company: client.company,
        created_at: client.created_at,
        metrics: {
          totalInvoices: payments.length,
          totalAmount,
          paidAmount,
          pendingAmount,
          paymentRate: payments.length > 0 ? (payments.filter(p => p.status === 'paid').length / payments.length) * 100 : 0
        }
      }
    })

    // Sort by total amount descending
    clientStats.sort((a, b) => b.metrics.totalAmount - a.metrics.totalAmount)

    const summary = {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.payments && c.payments.length > 0).length,
      totalRevenue: clientStats.reduce((sum, c) => sum + c.metrics.paidAmount, 0),
      averageClientValue: clients.length > 0 ? clientStats.reduce((sum, c) => sum + c.metrics.totalAmount, 0) / clients.length : 0
    }

    const result = {
      summary,
      clients: clientStats
    }

    res.json(dbHelpers.formatResponse(result, 'Client statistics retrieved successfully'))

  } catch (error) {
    res.status(500).json(dbHelpers.handleError(error, 'fetching client statistics'))
  }
})

module.exports = router