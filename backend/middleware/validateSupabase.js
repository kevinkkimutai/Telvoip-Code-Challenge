// Supabase Connection Validation Middleware

const { testConnection } = require('../config/supabase')

let connectionTested = false
let connectionValid = false

const validateSupabase = async (req, res, next) => {
  // Only test connection once during startup
  if (!connectionTested) {
    try {
      connectionValid = await testConnection()
      connectionTested = true
      
      if (!connectionValid) {
        return res.status(503).json({
          success: false,
          error: 'Database connection failed',
          message: 'Unable to connect to Supabase. Please check your configuration.',
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Supabase validation error:', error)
      return res.status(503).json({
        success: false,
        error: 'Database connection error',
        message: 'Failed to validate database connection.',
        timestamp: new Date().toISOString()
      })
    }
  }

  // If connection was previously tested and failed, return error
  if (connectionTested && !connectionValid) {
    return res.status(503).json({
      success: false,
      error: 'Database unavailable',
      message: 'Database connection is not available.',
      timestamp: new Date().toISOString()
    })
  }

  next()
}

module.exports = validateSupabase