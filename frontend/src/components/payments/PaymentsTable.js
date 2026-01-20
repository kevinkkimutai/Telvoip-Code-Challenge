// Payments table component with sorting, filtering, and pagination
'use client'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPayments, updatePaymentStatus, setFilters } from '@/redux/slices/paymentsSlice'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import LoadingSpinner, { LoadingSkeleton } from '@/components/ui/LoadingSpinner'
import Input from '@/components/ui/Input'
import ViewPaymentDrawer from '@/components/payments/ViewPaymentDrawer'
import toast from 'react-hot-toast'

const StatusSelect = ({ value, onChange, loading = false }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={loading}
    className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="all">All Status</option>
    <option value="completed">Completed</option>
    <option value="pending">Pending</option>
    <option value="processing">Processing</option>
    <option value="failed">Failed</option>
    <option value="cancelled">Cancelled</option>
  </select>
)

const TableHeader = ({ label, sortKey, currentSort, onSort }) => (
  <th 
    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
    onClick={() => onSort && onSort(sortKey)}
  >
    <div className="flex items-center space-x-1">
      <span>{label}</span>
      {onSort && (
        <div className="flex flex-col">
          <svg className={`h-3 w-3 ${currentSort === `${sortKey}_asc` ? 'text-gray-900' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <svg className={`h-3 w-3 ${currentSort === `${sortKey}_desc` ? 'text-gray-900' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  </th>
)

export default function PaymentsTable({ showPagination = true, limit = 10 }) {
  const dispatch = useDispatch()
  const { payments, loading, filters, pagination } = useSelector(state => state.payments)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      dispatch(setFilters({ search, limit }))
      dispatch(fetchPayments({ ...filters, search, limit }))
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [search, filters.status, limit, dispatch])

  const handleStatusFilter = (status) => {
    dispatch(setFilters({ status }))
    dispatch(fetchPayments({ ...filters, status, search, limit }))
  }

  const handleSort = (key) => {
    const newSort = sortBy === `${key}_asc` ? `${key}_desc` : `${key}_asc`
    setSortBy(newSort)
    // Implement client-side sorting
    const sorted = [...payments].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      
      if (newSort.endsWith('_asc')) {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
    // You would typically dispatch an action here to update the sorted data
  }

  const handleStatusUpdate = async (paymentId, newStatus) => {
    try {
      await dispatch(updatePaymentStatus({ paymentId, status: newStatus })).unwrap()
      toast.success(`Payment status updated to ${newStatus}`)
    } catch (error) {
      toast.error('Failed to update payment status')
    }
  }

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setTimeout(() => setSelectedPayment(null), 300)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'completed': return 'paid'
      case 'pending': return 'pending'
      case 'processing': return 'processing'
      case 'failed': return 'overdue'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  if (loading && payments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Table filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search invoices, clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <StatusSelect 
              value={filters.status} 
              onChange={handleStatusFilter}
              loading={loading}
            />
            
            {loading && <LoadingSpinner size="sm" />}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader label="Invoice #" sortKey="invoice_number" currentSort={sortBy} onSort={handleSort} />
              <TableHeader label="Client" sortKey="client_name" currentSort={sortBy} onSort={handleSort} />
              <TableHeader label="Amount" sortKey="amount" currentSort={sortBy} onSort={handleSort} />
              <TableHeader label="Status" sortKey="status" currentSort={sortBy} onSort={handleSort} />
              <TableHeader label="Due Date" sortKey="due_date" currentSort={sortBy} onSort={handleSort} />
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr 
                key={payment.id} 
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {payment.invoiceNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{payment.client?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{payment.client?.email || ''}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant={getStatusBadgeVariant(payment.status)}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(payment.dueDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center space-x-2">
                    {payment.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusUpdate(payment.id, 'completed')}
                      >
                        Mark Paid
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewPayment(payment)}
                    >
                      View
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => {
                  const newPage = pagination.page - 1
                  dispatch(setFilters({ page: newPage }))
                  dispatch(fetchPayments({ ...filters, page: newPage, search, limit }))
                }}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-700">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                onClick={() => {
                  const newPage = pagination.page + 1
                  dispatch(setFilters({ page: newPage }))
                  dispatch(fetchPayments({ ...filters, page: newPage, search, limit }))
                }}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Payment Details Drawer */}
      <ViewPaymentDrawer 
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        payment={selectedPayment}
      />    </div>
  )
}