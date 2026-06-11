import './globals.css'
import ClientLayout from '../components/layout/ClientLayout'
import OfflineSyncWrapper from '../components/offline/OfflineSyncWrapper'

export const metadata = {
  title: 'Golf Club Scorer',
  description: 'Track your golf scores, stableford points, and view live club leaderboards.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Golf Club Scorer',
  },
}

export const viewport = {
  themeColor: '#1B4332',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-white text-black antialiased">
        <ClientLayout>
          <OfflineSyncWrapper>{children}</OfflineSyncWrapper>
        </ClientLayout>
      </body>
    </html>
  )
}
