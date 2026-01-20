// Supabase Client Configuration
// Centralized Supabase connection setup

const { createClient } = require('@supabase/supabase-js')

// Environment validation
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY']
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars)
  console.error('Please check your .env file and ensure all required variables are set.')
  process.exit(1)
}

// Create Supabase client with service role key for backend operations
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
})

// Test connection function
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('payments').select('count').limit(1)
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    return true
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message)
    return false
  }
}

// Database helper functions
const dbHelpers = {
  // Generic error handler for Supabase operations
  handleError: (error, operation) => {
    console.error(`Database error during ${operation}:`, error)
    return {
      success: false,
      error: error.message || 'Database operation failed',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }
  },

  // Generic success response formatter
  formatResponse: (data, message = 'Operation successful') => {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    }
  },

  // Pagination helper
  getPaginationParams: (query) => {
    const page = parseInt(query.page) || 1
    const limit = Math.min(parseInt(query.limit) || 20, 100) // Max 100 items
    const offset = (page - 1) * limit
    
    return { page, limit, offset }
  },

  // Sort helper
  getSortParams: (query, defaultSort = 'created_at', allowedFields = []) => {
    const sortBy = query.sort_by || defaultSort
    const sortOrder = query.sort_order === 'desc' ? false : true // Supabase uses ascending: true/false
    
    // Validate sort field
    if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
      return { sortBy: defaultSort, sortOrder: false }
    }
    
    return { sortBy, sortOrder }
  }
}

module.exports = {
  supabase,
  testConnection,
  dbHelpers
}