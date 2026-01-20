'use client'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPayments } from '@/redux/slices/paymentsSlice'
import PaymentsTable from '@/components/payments/PaymentsTable'
import { openNewInvoiceDrawer } from '@/redux/slices/uiSlice'
import Button from '@/components/ui/Button'
import { PlusIcon } from '@heroicons/react/24/outline'

export default function PaymentsPage() {
  const dispatch = useDispatch()
  const { payments, loading } = useSelector(state => state.payments)

  useEffect(() => {
    dispatch(fetchPayments({ status: 'all', page: 1, limit: 20 }))
  }, [dispatch])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all your payments
          </p>
        </div>
        <Button onClick={() => dispatch(openNewInvoiceDrawer())}>
          <PlusIcon className="h-5 w-5 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Total Payments</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{payments.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Completed</p>
          <p className="text-2xl font-semibold text-green-600 mt-2">
            {payments.filter(p => p.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Pending</p>
          <p className="text-2xl font-semibold text-yellow-600 mt-2">
            {payments.filter(p => p.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Processing</p>
          <p className="text-2xl font-semibold text-blue-600 mt-2">
            {payments.filter(p => p.status === 'processing').length}
          </p>
        </div>
      </div>

      {/* Payments Table */}
      <PaymentsTable showPagination={true} limit={20} />
    </div>
  )
}
