import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/file-upload.component.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import {QueryProvider} from "@/providers/query-provider";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Complaint Management System',
  description: 'Submit and manage product complaints',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
      <QueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen px-2 mx-auto">
            <Header />
            <main className="flex-1 container py-8 mx-auto">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </QueryProvider>
      </body>
    </html>
  )
}
