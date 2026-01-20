// Header component with search and notifications
'use client'
import { useDispatch, useSelector } from 'react-redux'
import { toggleSidebar, toggleDarkMode } from '@/redux/slices/uiSlice'
import Button from '@/components/ui/Button'
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  PlusIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

export default function Header() {
  const dispatch = useDispatch()
  const { darkMode } = useSelector(state => state.ui)
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden text-gray-500 hover:text-gray-600 mr-4"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search invoices, clients..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
        </div>
        
        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* New Invoice button */}
          <Button 
            variant="primary" 
            onClick={() => dispatch({ type: 'ui/openNewInvoiceDrawer' })}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
          
          {/* Notifications */}
          <button className="relative text-gray-500 hover:text-gray-700">
            <BellIcon className="h-6 w-6" />
            {/* Notification badge */}
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </button>
          
          {/* Dark mode toggle */}
          <button
            onClick={() => dispatch(toggleDarkMode())}
            className="text-gray-500 hover:text-gray-700"
          >
            {darkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>
          
          {/* User menu */}
          <div className="relative">
            <button className="flex items-center space-x-3 text-sm text-gray-700 hover:text-gray-900">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">U</span>
              </div>
              <span className="hidden md:block font-medium">User</span>
              <ChevronDownIcon className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}