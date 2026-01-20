// Global Error Handler Middleware

const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  console.error('Error:', err)

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = { message, statusCode: 404 }
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = { message, statusCode: 400 }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message)
    error = { message, statusCode: 400 }
  }

  // Supabase specific errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        error = { message: 'Resource already exists', statusCode: 409 }
        break
      case '23503': // foreign_key_violation
        error = { message: 'Referenced resource does not exist', statusCode: 400 }
        break
      case '42501': // insufficient_privilege
        error = { message: 'Insufficient privileges', statusCode: 403 }
        break
      case 'PGRST116': // no rows returned
        error = { message: 'Resource not found', statusCode: 404 }
        break
      default:
        error = { message: 'Database operation failed', statusCode: 500 }
    }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  })
}

module.exports = errorHandler