#!/bin/bash

# Setup script for Next.js + shadcn/ui project structure
echo "🚀 Setting up Next.js project with shadcn/ui..."

# Install shadcn (new package name)
echo "📦 Installing shadcn..."
npx shadcn@latest init

# Create directory structure - breaking it down to avoid syntax issues
echo "📁 Creating folder structure..."
mkdir -p src/app/api
mkdir -p src/app/auth
mkdir -p src/app/dashboard/complaints
mkdir -p src/app/admin
mkdir -p src/components/ui
mkdir -p src/components/forms
mkdir -p src/components/layout
mkdir -p src/components/shared
mkdir -p src/config
mkdir -p src/constants
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p src/providers
mkdir -p src/styles
mkdir -p src/types
mkdir -p public/images

# Rest of the script remains the same...
# Add basic files
echo "📝 Creating base files..."

# Create layout components
cat << 'EOF' > src/components/layout/header.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/ui/mode-toggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="font-bold">
            Complaint System
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline">
            <Link href="/login">Sign In</Link>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
EOF

cat << 'EOF' > src/components/layout/footer.tsx
export function Footer() {
  return (
    <footer className="py-6 border-t">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Complaint Management System. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
EOF

# Create config files
cat << 'EOF' > src/config/site.ts
export const siteConfig = {
  name: "Complaint Management System",
  description: "Submit and manage product complaints efficiently.",
  links: {
    github: "https://github.com/yourusername/complaint-system",
  },
}
EOF

cat << 'EOF' > src/config/navigation.ts
export const mainNav = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "Submit Complaint",
    href: "/dashboard/complaints/new",
  },
  {
    title: "My Complaints",
    href: "/dashboard/complaints",
  },
]

export const dashboardNav = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: "dashboard",
  },
  {
    title: "Complaints",
    href: "/dashboard/complaints",
    icon: "fileText",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: "settings",
  },
]
EOF

# Create theme provider
cat << 'EOF' > src/providers/theme-provider.tsx
'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { type ThemeProviderProps } from 'next-themes/dist/types'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
EOF

# Update layout file
cat << 'EOF' > src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container py-8">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
EOF

# Install required dependencies
echo "📦 Installing additional dependencies..."
npm install next-themes zod @hookform/resolvers react-hook-form date-fns

# Add shadcn/ui components
echo "⚙️ Adding essential shadcn/ui components..."
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add form
npx shadcn@latest add label
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add radio-group
npx shadcn@latest add calendar
npx shadcn@latest add mode-toggle

echo "🎉 Setup complete! Your project is ready with:"
echo "- shadcn configured"
echo "- Organized folder structure"
echo "- Basic layout components"
echo "- Theme provider"
echo "- Essential shadcn components"

echo "🚀 Start developing with:"
echo "npm run dev"