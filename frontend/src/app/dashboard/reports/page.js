'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, Users, FileText, Calendar, Download } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import Badge from '@/components/ui/Badge'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7200/api/v1'

export default function ReportsPage() {
  const [payments, setPayments] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month') // week, month, year, all

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [paymentsRes, clientsRes] = await Promise.all([
        fetch(`${API_URL}/payments?limit=1000`),
        fetch(`${API_URL}/clients?limit=1000`)
      ])
      
      const paymentsData = await paymentsRes.json()
      const clientsData = await clientsRes.json()
      
      if (paymentsData.success) {
        setPayments(paymentsData.data.payments || [])
      }
      if (clientsData.success) {
        setClients(clientsData.data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter payments by date range
  const getFilteredPayments = () => {
    const now = new Date()
    return payments.filter(payment => {
      const paymentDate = new Date(payment.createdAt)
      
      switch(dateRange) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return paymentDate >= weekAgo
        case 'month':
          return paymentDate.getMonth() === now.getMonth() && 
                 paymentDate.getFullYear() === now.getFullYear()
        case 'year':
          return paymentDate.getFullYear() === now.getFullYear()
        case 'all':
        default:
          return true
      }
    })
  }

  const filteredPayments = getFilteredPayments()

  // Calculate metrics
  const totalRevenue = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  const completedRevenue = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  const pendingRevenue = filteredPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  const averageInvoiceValue = filteredPayments.length > 0 ? totalRevenue / filteredPayments.length : 0

  // Payment status breakdown
  const statusBreakdown = {
    completed: filteredPayments.filter(p => p.status === 'completed').length,
    pending: filteredPayments.filter(p => p.status === 'pending').length,
    processing: filteredPayments.filter(p => p.status === 'processing').length,
    failed: filteredPayments.filter(p => p.status === 'failed').length,
    cancelled: filteredPayments.filter(p => p.status === 'cancelled').length
  }

  // Top clients by revenue
  const clientRevenue = {}
  filteredPayments.forEach(payment => {
    if (payment.client) {
      if (!clientRevenue[payment.client.id]) {
        clientRevenue[payment.client.id] = {
          client: payment.client,
          totalRevenue: 0,
          invoiceCount: 0
        }
      }
      clientRevenue[payment.client.id].totalRevenue += parseFloat(payment.amount || 0)
      clientRevenue[payment.client.id].invoiceCount++
    }
  })

  const topClients = Object.values(clientRevenue)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5)

  // Payment methods breakdown
  const paymentMethods = {}
  filteredPayments.forEach(payment => {
    const method = payment.paymentMethod || 'Unknown'
    paymentMethods[method] = (paymentMethods[method] || 0) + 1
  })

  // Monthly trend (last 6 months)
  const getMonthlyTrend = () => {
    const months = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthPayments = payments.filter(p => {
        const paymentDate = new Date(p.createdAt)
        return paymentDate.getMonth() === date.getMonth() && 
               paymentDate.getFullYear() === date.getFullYear()
      })
      
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
        count: monthPayments.length
      })
    }
    
    return months
  }

  const monthlyTrend = getMonthlyTrend()

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      trend: { value: 12, isPositive: true }
    },
    {
      title: 'Completed Revenue',
      value: `$${completedRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      trend: { value: 8, isPositive: true }
    },
    {
      title: 'Average Invoice',
      value: `$${averageInvoiceValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: FileText,
      trend: { value: 5, isPositive: true }
    },
    {
      title: 'Active Clients',
      value: clients.length,
      icon: Users,
      trend: { value: 10, isPositive: true }
    }
  ]

  const handleExport = () => {
    const csvContent = [
      ['Invoice Number', 'Client', 'Amount', 'Status', 'Due Date', 'Created At'].join(','),
      ...filteredPayments.map(payment => [
        payment.invoiceNumber,
        payment.client?.name || 'N/A',
        payment.amount,
        payment.status,
        payment.dueDate,
        payment.createdAt
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights into your business performance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Revenue Trend (Last 6 Months)</h2>
          <div className="space-y-4">
            {monthlyTrend.map((month, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">{month.month}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${month.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ 
                      width: `${Math.max(5, (month.revenue / Math.max(...monthlyTrend.map(m => m.revenue))) * 100)}%` 
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">{month.count} invoices</div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Status Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Status Breakdown</h2>
          <div className="space-y-4">
            {Object.entries(statusBreakdown).map(([status, count]) => {
              const percentage = filteredPayments.length > 0 
                ? (count / filteredPayments.length) * 100 
                : 0
              
              return (
                <div key={status}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={status}>{status}</Badge>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status === 'completed' ? 'bg-green-500' :
                        status === 'pending' ? 'bg-yellow-500' :
                        status === 'processing' ? 'bg-blue-500' :
                        status === 'failed' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}
                      style={{ width: `${Math.max(5, percentage)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-white rounded-lg shadow-sm mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Top Clients by Revenue</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Rank</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Client</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Email</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">Invoices</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-gray-700">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    Loading data...
                  </td>
                </tr>
              ) : topClients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    No client data available for this period
                  </td>
                </tr>
              ) : (
                topClients.map((item, index) => (
                  <tr key={item.client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                        <span className="text-blue-600 font-bold">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900">{item.client.name}</div>
                      <div className="text-sm text-gray-500">{item.client.company || 'N/A'}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {item.client.email}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {item.invoiceCount} invoice{item.invoiceCount !== 1 ? 's' : ''}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="font-semibold text-gray-900">
                        ${item.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Methods Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(paymentMethods).map(([method, count]) => {
            const percentage = filteredPayments.length > 0 
              ? (count / filteredPayments.length) * 100 
              : 0
            
            return (
              <div key={method} className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900 mb-1">{count}</div>
                <div className="text-sm text-gray-600 mb-2">{method}</div>
                <div className="text-xs text-gray-500">{percentage.toFixed(1)}% of total</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
