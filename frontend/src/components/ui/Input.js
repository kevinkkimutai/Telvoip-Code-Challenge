// Input component with labels and validation
import { forwardRef } from 'react'

const Input = forwardRef(({ 
  label, 
  type = 'text', 
  error, 
  helperText,
  required = false,
  className = '',
  containerClassName = '',
  ...props 
}, ref) => {
  const inputClasses = `
    block w-full rounded-lg border ${
      error 
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
    }
    bg-white px-3 py-2 text-sm
    focus:outline-none focus:ring-1 focus:ring-offset-0
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${className}
  `.trim().replace(/\s+/g, ' ')
  
  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        type={type}
        className={inputClasses}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input