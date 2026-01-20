// Drawer component for slide-out panels
'use client'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Drawer({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  position = 'right'
}) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  }
  
  const positions = {
    left: {
      container: 'justify-start',
      panel: isOpen ? 'translate-x-0' : '-translate-x-full'
    },
    right: {
      container: 'justify-end',
      panel: isOpen ? 'translate-x-0' : 'translate-x-full'
    }
  }
  
  // Handle ESC key
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])
  
  if (!isOpen && (typeof window === 'undefined' || !document.querySelector('.drawer-backdrop'))) return null
  
  const drawerContent = (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className={`
          drawer-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={closeOnBackdropClick ? onClose : undefined}
      />
      
      {/* Drawer panel */}
      <div className={`fixed inset-y-0 flex ${positions[position].container}`}>
        <div 
          className={`
            relative w-full ${sizes[size]} h-full bg-white shadow-xl 
            transform transition-transform duration-300 ease-in-out
            ${positions[position].panel}
          `}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              {title && (
                <h2 className="text-lg font-semibold text-gray-900">
                  {title}
                </h2>
              )}
              
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
  
  // Render in portal
  if (typeof window !== 'undefined') {
    return createPortal(drawerContent, document.body)
  }
  
  return null
}