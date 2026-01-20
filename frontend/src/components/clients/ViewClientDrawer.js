'use client'

import { XMarkIcon, EnvelopeIcon, PhoneIcon, BuildingOfficeIcon, MapPinIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline'

export default function ViewClientDrawer({ isOpen, onClose, client, onEdit, onDelete }) {
  if (!client) return null

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount))
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return 'N/A'
    }
  }

  const getTotalRevenue = () => {
    if (!client.payments || client.payments.length === 0) return 0
    return client.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  }

  const getPaidAmount = () => {
    if (!client.payments || client.payments.length === 0) return 0
    return client.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  }

  const getPendingAmount = () => {
    if (!client.payments || client.payments.length === 0) return 0
    return client.payments
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  }

  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  const handleEdit = () => {
    onEdit && onEdit(client)
    onClose()
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      onDelete && onDelete(client.id)
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
            <h2 className="text-2xl font-bold text-gray-900">Client Details</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Client Info Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    {client.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{client.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">Client ID: {client.id?.slice(0, 8)}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                client.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {client.status || 'Active'}
              </span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{client.email || 'N/A'}</p>
                </div>
              </div>
              
              {client.phone && (
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{client.phone}</p>
                  </div>
                </div>
              )}
              
              {client.company && (
                <div className="flex items-center gap-3">
                  <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Company</p>
                    <p className="text-sm text-gray-900">{client.company}</p>
                  </div>
                </div>
              )}
              
              {client.address && (
                <div className="flex items-center gap-3">
                  <MapPinIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm text-gray-900">{client.address}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Client Since</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(client.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Overview */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Financial Overview</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(getTotalRevenue())}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-green-700 mb-1">Paid</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(getPaidAmount())}</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-xs text-yellow-700 mb-1">Pending</p>
                <p className="text-xl font-bold text-yellow-700">{formatCurrency(getPendingAmount())}</p>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Invoices ({client.payments?.length || 0})
            </h3>
            {client.payments && client.payments.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {client.payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {payment.invoiceNumber || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(payment.dueDate)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-sm text-gray-500">No invoices yet for this client</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={handleEdit}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <PencilIcon className="w-5 h-5" />
              Edit Client
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
    </>
  )
}
