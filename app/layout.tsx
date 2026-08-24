import { Analytics } from '@vercel/analytics/next'
import { DM_Serif_Display, Geist } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const dmSerif = DM_Serif_Display({ weight: '400', subsets: ['latin'], variable: '--font-dm-serif' })

export const metadata: Metadata = {
  title: 'Verde Limón Bakery | Pastelería artesanal',
  description: 'Panificados y pastelería artesanal hechos con cariño.',
  icons: {
    icon: '/logo-verde-limon.png',
    shortcut: '/logo-verde-limon.png',
    apple: '/logo-verde-limon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#174d3d',
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background">
      <body className={`${geist.variable} ${dmSerif.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
