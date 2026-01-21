// Payment Modal component for viewing payment details
'use client'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchInvoice } from '@/redux/slices/invoicesSlice'
import { updatePaymentStatus, deleteInvoice } from '@/redux/slices/paymentsSlice'
import { closePaymentModal } from '@/redux/slices/uiSlice'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function PaymentModal() {
  const dispatch = useDispatch()
  const { paymentModalOpen, selectedPaymentId } = useSelector(state => state.ui)
  const { currentInvoice, loading } = useSelector(state => state.invoices)
  const { payments } = useSelector(state => state.payments)

  // Get the selected payment from the payments list
  const selectedPayment = payments.find(p => p.id === selectedPaymentId)

  useEffect(() => {
    if (paymentModalOpen && selectedPaymentId) {
      dispatch(fetchInvoice(selectedPaymentId))
    }
  }, [paymentModalOpen, selectedPaymentId, dispatch])

  const handleClose = () => {
    dispatch(closePaymentModal())
  }

  const handleStatusUpdate = async (newStatus) => {
    try {
      await dispatch(updatePaymentStatus({ paymentId: selectedPaymentId, status: newStatus })).unwrap()
      toast.success(`Payment status updated to ${newStatus}`)
      // Refresh the invoice data
      dispatch(fetchInvoice(selectedPaymentId))
    } catch (error) {
      toast.error('Failed to update payment status')
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        await dispatch(deleteInvoice(selectedPaymentId)).unwrap()
        toast.success('Invoice deleted successfully')
        handleClose()
      } catch (error) {
        toast.error('Failed to delete invoice')
      }
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'paid': return 'paid'
      case 'pending': return 'pending'
      case 'overdue': return 'overdue'
      default: return 'default'
    }
  }

  const invoice = currentInvoice || selectedPayment

  if (!paymentModalOpen) return null

  return (
    <Modal
      isOpen={paymentModalOpen}
      onClose={handleClose}
      title="Invoice Details"
      size="lg"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : invoice ? (
        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="flex items-start justify-between pb-6 border-b border-gray-200">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{invoice.invoice_number}</h3>
              <p className="text-gray-600 mt-1">Created on {formatDate(invoice.created_at)}</p>
            </div>
            
            <div className="text-right">
              <Badge variant={getStatusBadgeVariant(invoice.status)} size="md">
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
              <p className="text-sm text-gray-600 mt-2">Due: {formatDate(invoice.due_date)}</p>
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Bill To:</h4>
            <div>
              <p className="font-medium text-gray-900">{invoice.client_name}</p>
              <p className="text-gray-600">{invoice.client_email}</p>
            </div>
          </div>

          {/* Invoice Items */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Items</h4>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.invoice_items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.rate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.amount)}</td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.amount)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              {/* Status Update Buttons */}
              {invoice.status !== 'paid' && (
                <Button 
                  variant="success" 
                  size="sm"
                  onClick={() => handleStatusUpdate('paid')}
                >
                  Mark as Paid
                </Button>
              )}
              
              {invoice.status !== 'pending' && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleStatusUpdate('pending')}
                >
                  Mark as Pending
                </Button>
              )}
              
              {invoice.status !== 'overdue' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleStatusUpdate('overdue')}
                >
                  Mark as Overdue
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Additional Actions */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast.success('PDF download feature coming soon!')
                }}
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast.success('Send reminder feature coming soon!')
                }}
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Reminder
              </Button>
              
              <Button 
                variant="danger" 
                size="sm"
                onClick={handleDelete}
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">Invoice not found</p>
        </div>
      )}
    </Modal>
  )
}