// Dashboard layout wrapper
'use client'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import ToastProvider from '@/components/ui/ToastProvider'

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
      
      {/* Toast notifications */}
      <ToastProvider />
    </div>
  )
}