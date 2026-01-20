// Custom hook for Supabase realtime subscriptions
'use client'
import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { supabase } from '@/lib/supabase'
import { addPaymentRealtime, updatePaymentRealtime, removePaymentRealtime } from '@/redux/slices/paymentsSlice'
import { addNotification } from '@/redux/slices/uiSlice'
import toast from 'react-hot-toast'

export function useRealtimePayments() {
  const dispatch = useDispatch()
  const subscriptionRef = useRef(null)

  useEffect(() => {
    // Create subscription for payments changes
    const channel = supabase
      .channel('payments_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('New payment:', payload.new)
          dispatch(addPaymentRealtime(payload.new))
          dispatch(addNotification({
            type: 'success',
            message: `New invoice ${payload.new.invoice_number} created`,
            duration: 5000
          }))
          toast.success(`New invoice ${payload.new.invoice_number} created`)
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('Payment updated:', payload.new)
          dispatch(updatePaymentRealtime(payload.new))
          
          // Show notification for status changes
          if (payload.old.status !== payload.new.status) {
            const message = `Invoice ${payload.new.invoice_number} marked as ${payload.new.status}`
            dispatch(addNotification({
              type: 'info',
              message,
              duration: 4000
            }))
            toast.success(message)
          }
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('Payment deleted:', payload.old)
          dispatch(removePaymentRealtime(payload.old.id))
          dispatch(addNotification({
            type: 'warning',
            message: `Invoice ${payload.old.invoice_number} was deleted`,
            duration: 4000
          }))
          toast.error(`Invoice ${payload.old.invoice_number} was deleted`)
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
        
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to payments changes')
          toast.success('Real-time updates enabled', { duration: 2000 })
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Subscription error')
          toast.error('Failed to connect to real-time updates')
        }
      })

    subscriptionRef.current = channel

    // Cleanup on unmount
    return () => {
      if (subscriptionRef.current) {
        console.log('Unsubscribing from realtime')
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [dispatch])

  // Return subscription status
  return {
    isSubscribed: subscriptionRef.current?.state === 'subscribed',
    unsubscribe: () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }
}

// Hook for clients realtime updates
export function useRealtimeClients() {
  const dispatch = useDispatch()
  
  useEffect(() => {
    const channel = supabase
      .channel('clients_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => {
          console.log('Client change:', payload)
          // You can dispatch actions to update clients state if needed
          if (payload.eventType === 'INSERT') {
            toast.success(`New client ${payload.new.name} added`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])
}

// Hook for invoice items realtime updates
export function useRealtimeInvoiceItems() {
  const dispatch = useDispatch()
  
  useEffect(() => {
    const channel = supabase
      .channel('invoice_items_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'invoice_items' },
        (payload) => {
          console.log('Invoice item change:', payload)
          // Handle invoice items changes if needed
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dispatch])
}

// Combined hook for all realtime features
export function useQuickPayRealtime() {
  const paymentsStatus = useRealtimePayments()
  useRealtimeClients()
  useRealtimeInvoiceItems()
  
  return {
    ...paymentsStatus,
    isConnected: paymentsStatus.isSubscribed
  }
}