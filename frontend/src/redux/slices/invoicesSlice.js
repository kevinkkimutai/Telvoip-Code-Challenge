import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://telvoip-code-challenge-9z36.vercel.app/api'

// Async thunks for invoice operations
export const createInvoice = createAsyncThunk(
  'invoices/createInvoice',
  async (invoiceData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/v1/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create invoice')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchInvoice = createAsyncThunk(
  'invoices/fetchInvoice',
  async (invoiceId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/v1/invoices/${invoiceId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch invoice')
      }
      
      return await response.json()
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchClients = createAsyncThunk(
  'invoices/fetchClients',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/v1/clients`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch clients')
      }
      
      const result = await response.json()
      // Handle both formats: result.data.clients or result.data
      return result.data?.clients || result.data || []
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState: {
    currentInvoice: null,
    clients: [],
    loading: false,
    error: null,
    creating: false,
    createSuccess: false,
  },
  reducers: {
    clearCurrentInvoice: (state) => {
      state.currentInvoice = null
      state.createSuccess = false
    },
    clearError: (state) => {
      state.error = null
    },
    resetCreateState: (state) => {
      state.creating = false
      state.createSuccess = false
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Create invoice
      .addCase(createInvoice.pending, (state) => {
        state.creating = true
        state.error = null
        state.createSuccess = false
      })
      .addCase(createInvoice.fulfilled, (state, action) => {
        state.creating = false
        state.createSuccess = true
        state.currentInvoice = action.payload.data
      })
      .addCase(createInvoice.rejected, (state, action) => {
        state.creating = false
        state.error = action.payload
        state.createSuccess = false
      })
      
      // Fetch invoice
      .addCase(fetchInvoice.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchInvoice.fulfilled, (state, action) => {
        state.loading = false
        state.currentInvoice = action.payload.data
      })
      .addCase(fetchInvoice.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch clients
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.clients = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchClients.rejected, (state) => {
        state.clients = []
      })
  },
})

export const { clearCurrentInvoice, clearError, resetCreateState } = invoicesSlice.actions

export default invoicesSlice.reducer