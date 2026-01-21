'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Mail, Phone, Building2, Trash2, Edit2, Eye } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import Badge from '@/components/ui/Badge'
import ViewClientDrawer from '@/components/clients/ViewClientDrawer'
import EditClientDrawer from '@/components/clients/EditClientDrawer'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://telvoip-code-challenge-9z36.vercel.app/api/v1'

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingClient, setEditingClient] = useState(null)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [])

  // Calculate stats based on current clients data
  const stats = [
    {
      title: 'Total Clients',
      value: clients.length,
      icon: Building2,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Active Clients',
      value: clients.filter(c => c.status === 'active').length,
      icon: Building2,
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'New This Month',
      value: clients.filter(c => {
        const clientDate = new Date(c.createdAt)
        const now = new Date()
        return clientDate.getMonth() === now.getMonth() && 
               clientDate.getFullYear() === now.getFullYear()
      }).length,
      icon: Plus,
      trend: { value: 15, isPositive: true }
    }
  ]

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/clients?limit=100`)
      const data = await response.json()
      
      if (data.success) {
        setClients(data.data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData) => {
    try {
      const url = editingClient 
        ? `${API_URL}/clients/${editingClient.id}`
        : `${API_URL}/clients`
      
      const method = editingClient ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchClients()
        return true
      } else {
        alert(data.message || 'Failed to save client')
        return false
      }
    } catch (error) {
      console.error('Error saving client:', error)
      alert('Failed to save client')
      return false
    }
  }

  const handleDelete = async (clientId) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    
    try {
      const response = await fetch(`${API_URL}/clients/${clientId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchClients()
      } else {
        alert(data.message || 'Failed to delete client')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Failed to delete client')
    }
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setEditDrawerOpen(true)
  }

  const handleAddNew = () => {
    setEditingClient(null)
    setEditDrawerOpen(true)
  }

  const handleCloseEditDrawer = () => {
    setEditDrawerOpen(false)
    setTimeout(() => setEditingClient(null), 300)
  }

  const handleViewClient = (client) => {
    setSelectedClient(client)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setTimeout(() => setSelectedClient(null), 300)
  }

  const filteredClients = clients.filter(client => 
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTotalAmount = (payments) => {
    if (!payments || payments.length === 0) return 0
    return payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Manage your client relationships</p>
        </div>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Client
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search clients by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Client</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Contact</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Company</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Total Revenue</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Invoices</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500">
                    Loading clients...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-gray-500">
                    {searchTerm ? 'No clients found matching your search' : 'No clients yet. Add your first client!'}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr 
                    key={client.id} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleViewClient(client)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {client.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">ID: {client.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {client.company || 'N/A'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900">
                        ${getTotalAmount(client.payments).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-600">
                        {client.payments?.length || 0} invoice{client.payments?.length !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={client.status === 'active' ? 'completed' : 'pending'}>
                        {client.status || 'active'}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleViewClient(client)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="View client"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(client)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit client"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Add Client Drawer */}
      <EditClientDrawer 
        isOpen={editDrawerOpen}
        onClose={handleCloseEditDrawer}
        client={editingClient}
        onSave={handleSubmit}
      />

      {/* View Client Drawer */}
      <ViewClientDrawer 
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        client={selectedClient}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
