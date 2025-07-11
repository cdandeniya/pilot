'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

interface ToastProps {
  type: 'success' | 'error' | 'info'
  message: string
  onClose: () => void
  duration?: number
}

export function Toast({ type, message, onClose, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Auto-close after duration
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for fade out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          className: 'border-green-200 bg-green-50',
        }
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          className: 'border-red-200 bg-red-50',
        }
      case 'info':
        return {
          icon: <Info className="w-5 h-5 text-blue-500" />,
          className: 'border-blue-200 bg-blue-50',
        }
    }
  }

  const toastStyles = getToastStyles()

  return (
    <div
      className={`flex items-start space-x-3 p-4 rounded-2xl border shadow-soft transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      } ${toastStyles.className}`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {toastStyles.icon}
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
        aria-label="Close toast"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
} 