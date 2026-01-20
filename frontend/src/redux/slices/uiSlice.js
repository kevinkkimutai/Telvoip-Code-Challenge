import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    // Modals
    paymentModalOpen: false,
    selectedPaymentId: null,
    
    // Drawers
    newInvoiceDrawerOpen: false,
    
    // Loading states
    pageLoading: false,
    
    // Toast notifications
    notifications: [],
    
    // Sidebar
    sidebarCollapsed: false,
    
    // Theme
    darkMode: false,
  },
  reducers: {
    // Modal actions
    openPaymentModal: (state, action) => {
      state.paymentModalOpen = true
      state.selectedPaymentId = action.payload
    },
    closePaymentModal: (state) => {
      state.paymentModalOpen = false
      state.selectedPaymentId = null
    },
    
    // Drawer actions
    openNewInvoiceDrawer: (state) => {
      state.newInvoiceDrawerOpen = true
    },
    closeNewInvoiceDrawer: (state) => {
      state.newInvoiceDrawerOpen = false
    },
    
    // Loading actions
    setPageLoading: (state, action) => {
      state.pageLoading = action.payload
    },
    
    // Notification actions
    addNotification: (state, action) => {
      const notification = {
        id: Date.now() + Math.random(),
        type: 'info',
        duration: 5000,
        ...action.payload
      }
      state.notifications.push(notification)
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      )
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload
    },
    
    // Theme actions
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload
    },
  },
})

export const {
  openPaymentModal,
  closePaymentModal,
  openNewInvoiceDrawer,
  closeNewInvoiceDrawer,
  setPageLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  toggleSidebar,
  setSidebarCollapsed,
  toggleDarkMode,
  setDarkMode,
} = uiSlice.actions

export default uiSlice.reducer