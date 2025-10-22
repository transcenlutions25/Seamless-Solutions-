'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export interface User {
  id: string
  email: string
  firstName: string
  lastName?: string
  role: 'OWNER' | 'STAFF' | 'VENDOR' | 'CLIENT'
  orgId: string
}

export interface Organization {
  id: string
  name: string
  slug: string
}

interface AuthContextType {
  user: User | null
  org: Organization | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [org, setOrg] = useState<Organization | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      setToken(storedToken)
      // Verify token and get user info
      verifyToken(storedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  const verifyToken = async (token: string) => {
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setUser(response.data.user)
      setOrg(response.data.org)
      setToken(token)
    } catch (error) {
      // Token is invalid, remove it
      localStorage.removeItem('auth_token')
      setToken(null)
      setUser(null)
      setOrg(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { user, token } = response.data
      
      localStorage.setItem('auth_token', token)
      setToken(token)
      setUser(user)
      
      // Get organization info
      const meResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOrg(meResponse.data.org)
      
      router.push('/dashboard')
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
    setOrg(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        org,
        isLoading,
        login,
        logout,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}