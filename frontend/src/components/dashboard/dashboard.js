// Main dashboard page
'use client'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchPayments, fetchPaymentStats } from '@/redux/slices/paymentsSlice'
import { useQuickPayRealtime } from '@/hooks/useRealtime'
import StatsCards from '@/components/dashboard/StatsCards'
import PaymentsTable from '@/components/payments/PaymentsTable'
import NewInvoiceDrawer from '@/components/invoices/NewInvoiceDrawer'
import PaymentModal from '@/components/payments/PaymentModal'

export default function Dashboard() {
  const dispatch = useDispatch()
  
  // Enable realtime subscriptions
  const { isConnected } = useQuickPayRealtime()
  
  useEffect(() => {
    // Fetch initial data
    dispatch(fetchPayments())
    dispatch(fetchPaymentStats())
  }, [dispatch])
  
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to your QuickPay invoicing dashboard</p>
      </div>
      
      {/* Stats cards */}
      <StatsCards />
      
      {/* Recent payments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </button>
          </div>
        </div>
        
        <PaymentsTable showPagination={false} limit={5} />
      </div>
      
      {/* Modals and Drawers */}
      <NewInvoiceDrawer />
      <PaymentModal />
    </div>
  )
}