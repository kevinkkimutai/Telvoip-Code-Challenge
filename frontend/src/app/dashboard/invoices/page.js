'use client'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPayments } from '@/redux/slices/paymentsSlice'
import { openNewInvoiceDrawer } from '@/redux/slices/uiSlice'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import CreateInvoiceDrawer from '@/components/invoices/CreateInvoiceDrawer'
import ViewInvoiceDrawer from '@/components/invoices/ViewInvoiceDrawer'
import { PlusIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function InvoicesPage() {
  const dispatch = useDispatch()
  const { payments, loading } = useSelector(state => state.payments)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false)

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice)
    setViewDrawerOpen(true)
  }

  const handleCloseViewDrawer = () => {
    setViewDrawerOpen(false)
    setTimeout(() => setSelectedInvoice(null), 300)
  }

  useEffect(() => {
    dispatch(fetchPayments({ status: 'all', page: 1, limit: 50 }))
  }, [dispatch])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'paid'
      case 'pending': return 'pending'
      case 'processing': return 'processing'
      case 'failed': return 'overdue'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage invoices for your clients
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            className="bg-white border-gray-300 text-gray-700"
          >
            PAY INVOICE
          </Button>
          <Button onClick={() => dispatch(openNewInvoiceDrawer())}>
            <PlusIcon className="h-5 w-5 mr-2" />
            NEW INVOICE
          </Button>
        </div>
      </div>

      {/* Invoice Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Total Invoices</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{payments.length}</p>
          <p className="text-sm text-gray-500 mt-1">
            {formatCurrency(payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0))}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Paid This Month</p>
          <p className="text-2xl font-semibold text-green-600 mt-2">
            {payments.filter(p => p.status === 'completed').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {formatCurrency(
              payments
                .filter(p => p.status === 'completed')
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
            )}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Pending Payment</p>
          <p className="text-2xl font-semibold text-yellow-600 mt-2">
            {payments.filter(p => p.status === 'pending').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {formatCurrency(
              payments
                .filter(p => p.status === 'pending')
                .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
            )}
          </p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Invoices</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No invoices found
                  </td>
                </tr>
              ) : (
                payments.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.client?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.client?.email || ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawers */}
      <CreateInvoiceDrawer />
      <ViewInvoiceDrawer 
        isOpen={viewDrawerOpen}
        onClose={handleCloseViewDrawer}
        invoice={selectedInvoice}
      />
    </div>
  )
}
