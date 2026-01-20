import { createClient } from '@supabase/supabase-js'

// These should be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key'

// For development - create a mock client if env vars are not set
const isDevelopment = process.env.NODE_ENV === 'development'
const hasValidConfig = supabaseUrl.includes('supabase.co') && supabaseAnonKey.length > 20

if (!hasValidConfig && !isDevelopment) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create Supabase client (or mock client for development)
export const supabase = hasValidConfig 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockSupabaseClient()

// Mock Supabase client for development without env vars
function createMockSupabaseClient() {
  console.warn('🚧 Using mock Supabase client. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
  
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      eq: function() { return this },
      single: function() { return this },
      order: function() { return this },
      range: function() { return this },
      or: function() { return this },
      gte: function() { return this },
      lte: function() { return this },
    }),
    channel: () => ({
      on: function() { return this },
      subscribe: () => 'SUBSCRIBED'
    }),
    removeChannel: () => {},
    rpc: () => Promise.resolve({ data: null, error: null })
  }
}

// Helper functions for QuickPay operations
export const quickpayApi = {
  // Fetch all payments with invoice items
  async fetchPayments(filters = {}) {
    if (!hasValidConfig) {
      // Return mock data for development
      return {
        data: [
          {
            id: '1',
            invoice_number: 'INV-2026-001',
            client_name: 'Demo Client',
            client_email: 'demo@example.com',
            amount: 1500.00,
            status: 'paid',
            due_date: '2026-01-25',
            created_at: '2026-01-20T00:00:00Z',
            invoice_items: [
              { id: '1', description: 'Web Development', quantity: 1, rate: 1500.00, amount: 1500.00 }
            ]
          }
        ],
        error: null
      }
    }

    let query = supabase
      .from('payments')
      .select(`
        *,
        invoice_items (*)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.search) {
      query = query.or(`client_name.ilike.%${filters.search}%,client_email.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%`)
    }
    if (filters.startDate) {
      query = query.gte('due_date', filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte('due_date', filters.endDate)
    }

    return query
  },

  // Create new invoice with items
  async createInvoice(invoiceData) {
    if (!hasValidConfig) {
      // Return mock success for development
      return {
        data: {
          id: Date.now().toString(),
          ...invoiceData.payment,
          invoice_number: 'INV-2026-' + String(Date.now()).slice(-3),
          created_at: new Date().toISOString(),
          invoice_items: invoiceData.items
        },
        error: null
      }
    }

    const { data, error } = await supabase.rpc('create_invoice_with_items', {
      invoice_data: invoiceData.payment,
      items_data: invoiceData.items
    })
    
    if (error) throw error
    return data
  },

  // Update payment status
  async updatePaymentStatus(paymentId, status) {
    if (!hasValidConfig) {
      return { data: { id: paymentId, status }, error: null }
    }

    const { data, error } = await supabase
      .from('payments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', paymentId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete invoice and its items
  async deleteInvoice(paymentId) {
    if (!hasValidConfig) {
      return { data: null, error: null }
    }

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId)

    if (error) throw error
    return true
  },

  // Get payment statistics
  async getStats() {
    if (!hasValidConfig) {
      // Return mock stats for development
      return {
        total: 5000,
        paid: 3000,
        pending: 1500,
        overdue: 500,
        totalCount: 5,
        paidCount: 3,
        pendingCount: 1,
        overdueCount: 1
      }
    }

    const { data, error } = await supabase
      .from('payments')
      .select('status, amount')

    if (error) throw error

    const stats = data.reduce((acc, payment) => {
      acc.total += parseFloat(payment.amount)
      if (payment.status === 'paid') {
        acc.paid += parseFloat(payment.amount)
        acc.paidCount++
      } else if (payment.status === 'pending') {
        acc.pending += parseFloat(payment.amount)
        acc.pendingCount++
      } else if (payment.status === 'overdue') {
        acc.overdue += parseFloat(payment.amount)
        acc.overdueCount++
      }
      acc.totalCount++
      return acc
    }, {
      total: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
      totalCount: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0
    })

    return stats
  },

  // Get clients for autocomplete
  async getClients() {
    if (!hasValidConfig) {
      return [
        { id: '1', name: 'Demo Client 1', email: 'demo1@example.com' },
        { id: '2', name: 'Demo Client 2', email: 'demo2@example.com' }
      ]
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  },

  // Subscribe to realtime changes
  subscribeToPayments(callback) {
    if (!hasValidConfig) {
      console.log('Mock realtime subscription active')
      return { unsubscribe: () => {} }
    }

    return supabase
      .channel('payments_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payments' },
        callback
      )
      .subscribe()
  }
}