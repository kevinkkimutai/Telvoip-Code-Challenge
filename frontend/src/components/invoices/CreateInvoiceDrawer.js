'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { closeNewInvoiceDrawer } from '@/redux/slices/uiSlice'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://telvoip-code-challenge-9z36.vercel.app/api/v1'

export default function CreateInvoiceDrawer() {
  const dispatch = useDispatch()
  const { newInvoiceDrawerOpen } = useSelector(state => state.ui)
  const [clients, setClients] = useState([])
  const [formData, setFormData] = useState({
    clientId: '',
    description: '',
    dueDate: '',
    paymentMethod: 'credit_card',
    isRecurring: false,
    items: []
  })

  useEffect(() => {
    if (newInvoiceDrawerOpen) {
      fetchClients()
      // Set default due date to 30 days from now
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 30)
      setFormData(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0]
      }))
    }
  }, [newInvoiceDrawerOpen])

  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_URL}/clients?limit=100`)
      const data = await response.json()
      if (data.success && data.data && Array.isArray(data.data.clients)) {
        setClients(data.data.clients)
      } else {
        setClients([])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([])
    }
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, price: 0 }]
    }))
  }

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => 
      sum + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const total = calculateTotal()
      const payload = {
        clientId: formData.clientId,
        amount: total,
        dueDate: formData.dueDate,
        paymentMethod: formData.paymentMethod,
        status: 'pending',
        items: formData.items
      }

      const response = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (data.success) {
        dispatch(closeNewInvoiceDrawer())
        // Reset form
        setFormData({
          clientId: '',
          description: '',
          dueDate: '',
          paymentMethod: 'credit_card',
          isRecurring: false,
          items: []
        })
        // Refresh the page or show success message
        window.location.reload()
      } else {
        alert(data.message || 'Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      alert('Failed to create invoice')
    }
  }

  const selectedClient = clients.find(c => c.id === formData.clientId)

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          newInvoiceDrawerOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => dispatch(closeNewInvoiceDrawer())}
      />

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full md:w-[600px] lg:w-[700px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden ${
          newInvoiceDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create new invoice</h2>
              {formData.clientId && (
                <p className="text-lg font-bold text-gray-700 mt-1">
                  #{Math.random().toString(36).substr(2, 6).toUpperCase()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                COPY PAYMENT LINK
              </button>
              <button
                type="button"
                onClick={() => dispatch(closeNewInvoiceDrawer())}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Recipient Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Email
              </label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a client</option>
                {Array.isArray(clients) && clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Project/Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project / Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Legal Consulting"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issued on
                </label>
                <input
                  type="date"
                  value={new Date().toISOString().split('T')[0]}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due on
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Recurring Invoice */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="recurring" className="ml-2 text-sm text-gray-700">
                This is a recurring invoice (monthly)
              </label>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Items</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <PlusIcon className="w-4 h-4" />
                  ADD ITEM
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-500">No items added yet</p>
                  <button
                    type="button"
                    onClick={addItem}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add your first item
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500">
                    <div className="col-span-5">Item</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-3">Price</div>
                    <div className="col-span-2">Total</div>
                  </div>
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        className="col-span-5 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', e.target.value)}
                        className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <div className="col-span-1 px-3 py-2 text-sm font-medium text-gray-900">
                        ${(parseFloat(item.quantity || 0) * parseFloat(item.price || 0)).toFixed(0)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="col-span-1 p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            {formData.items.length > 0 && (
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${calculateTotal().toFixed(0)}
                </span>
              </div>
            )}

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                rows={3}
                placeholder="Here we can write additional notes for the client."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                PREVIEW
              </button>
              <button
                type="button"
                onClick={() => dispatch(closeNewInvoiceDrawer())}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                SAVE AS DRAFT
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                SEND
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
