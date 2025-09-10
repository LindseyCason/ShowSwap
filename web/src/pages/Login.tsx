import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/UserContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiTest, setApiTest] = useState('')
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  const testAPI = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setApiTest(`✅ API Working: ${data.message}`)
    } catch (error) {
      setApiTest(`❌ API Error: ${error}`)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const usernameRegex = /^(?=.{3,30}$)(?!.*[_.]{2})[a-zA-Z][a-zA-Z0-9._]*[a-zA-Z0-9]$/
    
    if (!username.trim()) {
      alert('Username is required')
      return
    }
    
    if (!usernameRegex.test(username.trim())) {
      alert('Username must be 3-30 characters, start with a letter, end with a letter or number, and cannot have consecutive underscores or periods')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
        credentials: 'include',
      })

      if (response.ok) {
        await refreshUser() // Refresh user data after successful login
        navigate('/')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to ShowSwap
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Discover shows through your friends' recommendations
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <input
              type="text"
              required
              pattern="^(?=.{3,30}$)(?!.*[_.]{2})[a-zA-Z][a-zA-Z0-9._]*[a-zA-Z0-9]$"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Enter your username (3-30 characters)"
              title="Username must be 3-30 characters, start with a letter, end with a letter or number, and cannot have consecutive underscores or periods"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-4">
          <button
            type="button"
            onClick={testAPI}
            className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Test API Connection
          </button>
          {apiTest && (
            <div className="text-center text-sm mt-2">
              {apiTest}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}