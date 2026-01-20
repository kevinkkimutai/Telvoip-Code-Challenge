require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

// Import database (optional - will fallback gracefully)
let sequelize;
try {
  const models = require('./models');
  sequelize = models.sequelize;
} catch (error) {
  console.warn('⚠️  Sequelize models not available, using fallback mode');
}

// Import routes
const paymentsRoutes = require('./routes/payments')
const invoicesRoutes = require('./routes/invoices')
const clientsRoutes = require('./routes/clients')
const statsRoutes = require('./routes/stats')

// Import middleware
const errorHandler = require('./middleware/errorHandler')
const validateSupabase = require('./middleware/validateSupabase')

const app = express()
const PORT = process.env.PORT || 7200
const API_VERSION = process.env.API_VERSION || 'v1'

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}
app.use(cors(corsOptions))

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Validate Supabase connection (disabled - now using Sequelize)
// app.use('/api', validateSupabase)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'QuickPay Backend Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: API_VERSION
  })
})

// API Routes
app.use(`/api/${API_VERSION}/payments`, paymentsRoutes)
app.use(`/api/${API_VERSION}/invoices`, invoicesRoutes)
app.use(`/api/${API_VERSION}/clients`, clientsRoutes)
app.use(`/api/${API_VERSION}/stats`, statsRoutes)

// QuickPay Frontend Routes (matching frontend expectations)
app.use('/api/v1/payments', paymentsRoutes)
app.use('/api/v1/invoices', invoicesRoutes)
app.use('/api/v1/clients', clientsRoutes)
app.use('/api/v1/stats', statsRoutes)

// Legacy QuickPay routes (for frontend compatibility)
app.use('/api/v1/payments', paymentsRoutes)
app.use('/api/v1/invoices', invoicesRoutes)
app.use('/api/v1/clients', clientsRoutes)
app.use('/api/v1/stats', statsRoutes)

// API info endpoint
app.get(`/api/${API_VERSION}`, (req, res) => {
  res.json({
    success: true,
    message: 'QuickPay Invoicing API',
    version: API_VERSION,
    endpoints: {
      payments: {
        list: `GET /api/${API_VERSION}/payments`,
        update: `PATCH /api/${API_VERSION}/payments/:id`,
        delete: `DELETE /api/${API_VERSION}/payments/:id`
      },
      invoices: {
        create: `POST /api/${API_VERSION}/invoices`,
        get: `GET /api/${API_VERSION}/invoices/:id`,
        delete: `DELETE /api/${API_VERSION}/invoices/:id`
      },
      clients: {
        list: `GET /api/${API_VERSION}/clients`,
        create: `POST /api/${API_VERSION}/clients`,
        update: `PUT /api/${API_VERSION}/clients/:id`,
        delete: `DELETE /api/${API_VERSION}/clients/:id`
      },
      stats: {
        dashboard: `GET /api/${API_VERSION}/stats/dashboard`,
        payments: `GET /api/${API_VERSION}/stats/payments`,
        clients: `GET /api/${API_VERSION}/stats/clients`
      }
    },
    documentation: 'https://github.com/v1/api-docs'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  })
})

// Global error handler
app.use(errorHandler)



// Start server
const startServer = async () => {
  try {
    // Test database connection (optional)
    if (sequelize) {
      try {
        await sequelize.authenticate()
        console.log('✅ Database connection established successfully')
        
        // Sync database (only in development)
        if (process.env.NODE_ENV === 'development') {
          await sequelize.sync({ alter: false })
          console.log('✅ Database synchronized')
        }
      } catch (dbError) {
        console.warn('⚠️  Database connection failed:', dbError.message)
        console.log('🔄 Server will continue with existing Supabase setup')
      }
    } else {
      console.log('ℹ️  Running without Sequelize - using existing Supabase client')
    }
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 QuickPay Backend Server running on port ${PORT}`)
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/${API_VERSION}`)
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`)
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🗄️  Database: ${sequelize ? 'Sequelize + PostgreSQL' : 'Supabase Client Only'}`)
    })

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log('Shutting down gracefully...')
      server.close(async () => {
        try {
          if (sequelize && sequelize.connectionManager && sequelize.connectionManager.pool) {
            await sequelize.close()
            console.log('✅ Database connection closed')
          }
          console.log('Process terminated')
          process.exit(0)
        } catch (error) {
          console.error('❌ Error during shutdown:', error)
          process.exit(1)
        }
      })
    }

    process.on('SIGTERM', gracefulShutdown)
    process.on('SIGINT', gracefulShutdown)
    
    return server
    
  } catch (error) {
    console.error('❌ Unable to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()

module.exports = app