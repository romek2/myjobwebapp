// src/app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextAuthProvider } from '../components/ui/providers'
import Navbar from '@/components//ui/resume-matcher/navbar';
import Footer from '@/components/ui/footer'; 

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Resume Job Matcher',
  description: 'Match your resume with job postings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
        <Navbar />
          {children}
          <Footer />
        </NextAuthProvider>
      </body>
    </html>
  )
}