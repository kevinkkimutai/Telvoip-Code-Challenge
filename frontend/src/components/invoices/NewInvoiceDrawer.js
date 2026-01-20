// New Invoice Drawer component
'use client'
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createInvoice, fetchClients, resetCreateState } from '@/redux/slices/invoicesSlice'
import { closeNewInvoiceDrawer } from '@/redux/slices/uiSlice'
import { fetchPayments, fetchPaymentStats } from '@/redux/slices/paymentsSlice'
import Drawer from '@/components/ui/Drawer'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

const InvoiceItem = ({ item, onUpdate, onRemove, index }) => {
  const handleChange = (field, value) => {
    const updatedItem = { ...item, [field]: value }
    if (field === 'quantity' || field === 'rate') {
      updatedItem.amount = parseFloat(updatedItem.quantity || 0) * parseFloat(updatedItem.rate || 0)
    }
    onUpdate(index, updatedItem)
  }

  return (
    <div className="grid grid-cols-12 gap-4 items-end">
      <div className="col-span-5">
        <Input
          label={index === 0 ? "Description" : ""}
          placeholder="Service description..."
          value={item.description}
          onChange={(e) => handleChange('description', e.target.value)}
          required
        />
      </div>
      
      <div className="col-span-2">
        <Input
          label={index === 0 ? "Qty" : ""}
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => handleChange('quantity', e.target.value)}
          required
        />
      </div>
      
      <div className="col-span-2">
        <Input
          label={index === 0 ? "Rate" : ""}
          type="number"
          step="0.01"
          min="0"
          value={item.rate}
          onChange={(e) => handleChange('rate', e.target.value)}
          required
        />
      </div>
      
      <div className="col-span-2">
        <Input
          label={index === 0 ? "Amount" : ""}
          type="number"
          value={item.amount.toFixed(2)}
          disabled
        />
      </div>
      
      <div className="col-span-1">
        {index > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  )
}

export default function NewInvoiceDrawer() {
  const dispatch = useDispatch()
  const { newInvoiceDrawerOpen } = useSelector(state => state.ui)
  const { creating, createSuccess, clients } = useSelector(state => state.invoices)
  
  // Form state
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    due_date: '',
    status: 'pending'
  })
  
  const [items, setItems] = useState([
    { description: '', quantity: 1, rate: 0, amount: 0 }
  ])
  
  const [subtotal, setSubtotal] = useState(0)
  const [tax, setTax] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [total, setTotal] = useState(0)

  // Load clients on mount
  useEffect(() => {
    if (newInvoiceDrawerOpen) {
      dispatch(fetchClients())
    }
  }, [dispatch, newInvoiceDrawerOpen])

  // Calculate totals when items change
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0)
    const taxAmount = newSubtotal * (tax / 100)
    const discountAmount = newSubtotal * (discount / 100)
    const newTotal = newSubtotal + taxAmount - discountAmount
    
    setSubtotal(newSubtotal)
    setTotal(Math.max(0, newTotal))
  }, [items, tax, discount])

  // Handle successful creation
  useEffect(() => {
    if (createSuccess) {
      toast.success('Invoice created successfully!')
      handleClose()
      // Refresh data
      dispatch(fetchPayments())
      dispatch(fetchPaymentStats())
      dispatch(resetCreateState())
    }
  }, [createSuccess, dispatch])

  const handleClose = () => {
    dispatch(closeNewInvoiceDrawer())
    // Reset form
    setFormData({
      client_name: '',
      client_email: '',
      due_date: '',
      status: 'pending'
    })
    setItems([{ description: '', quantity: 1, rate: 0, amount: 0 }])
    setTax(0)
    setDiscount(0)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleItemUpdate = (index, updatedItem) => {
    const newItems = [...items]
    newItems[index] = updatedItem
    setItems(newItems)
  }

  const addItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, rate: 0, amount: 0 }])
  }

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleClientSelect = (client) => {
    setFormData(prev => ({
      ...prev,
      client_name: client.name,
      client_email: client.email
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (items.some(item => !item.description || !item.quantity || !item.rate)) {
      toast.error('Please fill in all item fields')
      return
    }

    const invoiceData = {
      payment: {
        ...formData,
        amount: total
      },
      items: items.map(item => ({
        description: item.description,
        quantity: parseInt(item.quantity),
        rate: parseFloat(item.rate),
        amount: parseFloat(item.amount)
      }))
    }

    try {
      await dispatch(createInvoice(invoiceData)).unwrap()
    } catch (error) {
      toast.error('Failed to create invoice')
    }
  }

  return (
    <Drawer
      isOpen={newInvoiceDrawerOpen}
      onClose={handleClose}
      title="Create New Invoice"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Client Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Client Information</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Input
                label="Client Name"
                value={formData.client_name}
                onChange={(e) => handleInputChange('client_name', e.target.value)}
                required
                list="clients"
              />
              <datalist id="clients">
                {Array.isArray(clients) && clients.map((client) => (
                  <option key={client.id} value={client.name} />
                ))}
              </datalist>
            </div>
            
            <Input
              label="Client Email"
              type="email"
              value={formData.client_email}
              onChange={(e) => handleInputChange('client_email', e.target.value)}
              required
            />
            
            <Input
              label="Due Date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleInputChange('due_date', e.target.value)}
              required
            />
          </div>

          {/* Client suggestions */}
          {formData.client_name && clients.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-2 space-y-1 max-h-40 overflow-y-auto">
              {clients
                .filter(client => 
                  client.name.toLowerCase().includes(formData.client_name.toLowerCase()) ||
                  client.email.toLowerCase().includes(formData.client_name.toLowerCase())
                )
                .slice(0, 5)
                .map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                    onClick={() => handleClientSelect(client)}
                  >
                    <div className="font-medium">{client.name}</div>
                    <div className="text-gray-500">{client.email}</div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Invoice Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              Add Item
            </Button>
          </div>
          
          <div className="space-y-3">
            {items.map((item, index) => (
              <InvoiceItem
                key={index}
                item={item}
                index={index}
                onUpdate={handleItemUpdate}
                onRemove={removeItem}
              />
            ))}
          </div>
        </div>

        {/* Calculations */}
        <div className="border-t pt-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tax (%)"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              />
              <Input
                label="Discount (%)"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax ({tax}%):</span>
                  <span>${(subtotal * (tax / 100)).toFixed(2)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({discount}%):</span>
                  <span>-${(subtotal * (discount / 100)).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t pt-6 flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            loading={creating}
            disabled={creating || total <= 0}
          >
            Create Invoice
          </Button>
        </div>
      </form>
    </Drawer>
  )
}