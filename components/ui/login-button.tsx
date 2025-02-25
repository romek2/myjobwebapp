// src/components/login-button.tsx
'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogIn, LogOut, User } from 'lucide-react'
import Link from 'next/link'

export default function LoginButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <Button variant="outline" disabled>
        <User className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    )
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/profile">
          <Button variant="outline" className="flex items-center gap-2">
            {session.user?.image ? (
              <img 
                src={session.user.image} 
                alt="Profile" 
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <User className="h-4 w-4" />
            )}
            {session.user?.name || session.user?.email?.split('@')[0] || 'Profile'}
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={() => signIn('google')}>
      <LogIn className="mr-2 h-4 w-4" />
      Sign In with Google
    </Button>
  )
}