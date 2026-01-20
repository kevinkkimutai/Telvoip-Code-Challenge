import { configureStore } from '@reduxjs/toolkit'
import paymentsSlice from './slices/paymentsSlice'
import invoicesSlice from './slices/invoicesSlice'
import uiSlice from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    payments: paymentsSlice,
    invoices: invoicesSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['payments/fetchPayments/pending', 'payments/fetchPayments/fulfilled'],
      },
    }),
})