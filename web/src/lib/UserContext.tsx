import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import * as api from './api'
import type { User } from './api'

interface UserContextType {
  user: User | null
  loading: boolean
  error: string | null
  refreshUser: () => Promise<void>
  clearUser: () => void
  setUser: (user: User | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a UserProvider')
  }
  return context
}

interface UserProviderProps {
  children: ReactNode
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = async () => {
    try {
      setLoading(true)
      setError(null)
      const userData = await api.getCurrentUser()
      setUser(userData.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user')
      setUser(null)
      console.error('User error:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    await fetchUser()
  }

  const clearUser = () => {
    setUser(null)
    setError(null)
    setLoading(false)
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const value: UserContextType = {
    user,
    loading,
    error,
    refreshUser,
    clearUser,
    setUser
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
