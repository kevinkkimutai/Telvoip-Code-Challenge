import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:7200/api'

// Async thunks for API calls
export const fetchPayments = createAsyncThunk(
  'payments/fetchPayments',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, value)
        }
      })

      const response = await fetch(`${API_BASE}/v1/payments?${queryParams}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch payments')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updatePaymentStatus = createAsyncThunk(
  'payments/updatePaymentStatus',
  async ({ paymentId, status }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/v1/payments/${paymentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update payment')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const deleteInvoice = createAsyncThunk(
  'payments/deleteInvoice',
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/v1/invoices/${paymentId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete invoice')
      }
      
      return { paymentId }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchPaymentStats = createAsyncThunk(
  'payments/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/v1/stats`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch stats')
      }
      
      const result = await response.json()
      return result.data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    payments: [],
    stats: {
      total: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
      totalCount: 0,
      paidCount: 0,
      pendingCount: 0,
      overdueCount: 0
    },
    loading: false,
    error: null,
    filters: {
      status: 'all',
      search: '',
      page: 1,
      limit: 10
    },
    pagination: {
      page: 1,
      limit: 10,
      total: 0
    }
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearError: (state) => {
      state.error = null
    },
    addPaymentRealtime: (state, action) => {
      state.payments.unshift(action.payload)
    },
    updatePaymentRealtime: (state, action) => {
      const index = state.payments.findIndex(p => p.id === action.payload.id)
      if (index !== -1) {
        state.payments[index] = action.payload
      }
    },
    removePaymentRealtime: (state, action) => {
      state.payments = state.payments.filter(p => p.id !== action.payload)
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch payments
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false
        // Handle new Sequelize API response format
        if (action.payload.data && action.payload.data.payments) {
          state.payments = action.payload.data.payments
          state.pagination = action.payload.data.pagination
        } else if (action.payload.data && Array.isArray(action.payload.data)) {
          state.payments = action.payload.data
          state.pagination = action.payload.pagination
        } else if (Array.isArray(action.payload)) {
          state.payments = action.payload
        } else {
          state.payments = []
        }
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Update payment status
      .addCase(updatePaymentStatus.fulfilled, (state, action) => {
        const index = state.payments.findIndex(p => p.id === action.payload.data.id)
        if (index !== -1) {
          state.payments[index] = action.payload.data
        }
      })
      
      // Delete invoice
      .addCase(deleteInvoice.fulfilled, (state, action) => {
        state.payments = state.payments.filter(p => p.id !== action.payload.paymentId)
      })
      
      // Fetch stats
      .addCase(fetchPaymentStats.fulfilled, (state, action) => {
        state.stats = action.payload
      })
  },
})

export const { 
  setFilters, 
  clearError, 
  addPaymentRealtime, 
  updatePaymentRealtime, 
  removePaymentRealtime 
} = paymentsSlice.actions

export default paymentsSlice.reducer