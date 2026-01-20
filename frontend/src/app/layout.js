import { Inter } from 'next/font/google'
import "./globals.css"
import ReduxProvider from '@/components/providers/ReduxProvider'
import DashboardLayout from '@/components/layout/DashboardLayout'

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

export const metadata = {
  title: "QuickPay Dashboard - Invoice Management",
  description: "Modern invoice management dashboard with real-time updates",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <ReduxProvider>
          <DashboardLayout>
  {children}
          </DashboardLayout>
        
        </ReduxProvider>
      </body>
    </html>
  )
}
