'use client'

import { XMarkIcon, DocumentArrowDownIcon, EnvelopeIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function ViewInvoiceDrawer({ isOpen, onClose, invoice }) {
  if (!invoice) return null

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'KSH 0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES'
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      paid: 'bg-green-100 text-green-800'
    }
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  const handleMarkAsPaid = () => {
    console.log('Mark as Paid:', invoice.id)
    // TODO: Implement mark as paid functionality
  }

  const handleMarkAsPending = () => {
    console.log('Mark as Pending:', invoice.id)
    // TODO: Implement mark as pending functionality
  }

  const handleMarkAsOverdue = () => {
    console.log('Mark as Overdue:', invoice.id)
    // TODO: Implement mark as overdue functionality
  }

  const handleDownloadPDF = () => {
    console.log('Download PDF:', invoice.id)
    // TODO: Implement PDF download functionality
  }

  const handleSendReminder = () => {
    console.log('Send Reminder:', invoice.id)
    // TODO: Implement send reminder functionality
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      console.log('Delete invoice:', invoice.id)
      // TODO: Implement delete functionality
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full md:w-[600px] lg:w-[700px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="min-h-full p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Created Date and Status */}
          <div className="flex items-center justify-between mb-4 pb-6 border-b border-gray-200">
            <div>
              <p className="text-sm text-gray-600">
                Created on {formatDate(invoice.createdAt)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Due: {formatDate(invoice.dueDate)}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(invoice.status)}`}>
              {invoice.status || 'Pending'}
            </span>
          </div>

          {/* Bill To Section */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Bill To:</p>
              <p className="text-base font-medium text-gray-900">
                {invoice.client?.name || invoice.clientName || 'N/A'}
              </p>
              {invoice.client?.email && (
                <p className="text-sm text-gray-600">{invoice.client.email}</p>
              )}
              {invoice.client?.address && (
                <p className="text-sm text-gray-600 mt-1">{invoice.client.address}</p>
              )}
            </div>
          </div>

          {/* Items Section */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Items</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.description || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {item.quantity || 0}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(parseFloat(item.unitPrice) || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(parseFloat(item.totalPrice) || 0)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-sm text-gray-500">
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Amount */}
          <div className="flex items-center justify-between py-6 border-t border-gray-200 mb-8">
            <span className="text-lg font-bold text-gray-900">Total Amount:</span>
            <span className="text-3xl font-bold text-gray-900">
              {formatCurrency(parseFloat(invoice.amount) || 0)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex gap-3">
              
              {/* <button
                onClick={handleMarkAsPending}
                className="flex-1 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors"
              >
                Mark as Pending
              </button>
              <button
                onClick={handleMarkAsOverdue}
                className="flex-1 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors"
              >
                Mark as Overdue
              </button> */}
            </div>
            <div className="flex gap-3">
              {/* <button
                onClick={handleDownloadPDF}
                className="flex-1 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Download PDF
              </button>
              <button
                onClick={handleSendReminder}
                className="flex-1 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <EnvelopeIcon className="w-5 h-5" />
                Send Reminder
              </button> */}
              <button
                onClick={handleMarkAsPaid}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Mark as Paid
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <TrashIcon className="w-5 h-5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
