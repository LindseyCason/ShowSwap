import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/UserContext'
import { logout } from '../lib/api'

export default function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, clearUser } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      clearUser() // Clear user state immediately
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Don't show navigation on login page
  if (location.pathname === '/login') {
    return null
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <span className="text-2xl">📺</span>
            <span className="text-xl font-bold text-gray-900">ShowSwap</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => navigate('/')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive('/') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/add')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive('/add') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Add Show
            </button>
            <button
              onClick={() => navigate('/lists')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive('/lists') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              My Lists
            </button>
            <button
              onClick={() => navigate('/friends')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive('/friends') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
              }`}
            >
              Friends
            </button>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block">
                  <span className="text-sm text-gray-700">Welcome, </span>
                  <span className="text-sm font-medium text-gray-900">{user.username}</span>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              <button
                onClick={() => {
                  navigate('/')
                  setIsMobileMenuOpen(false)
                }}
                className={`block px-3 py-2 text-base font-medium rounded-md w-full text-left transition-colors ${
                  isActive('/') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  navigate('/add')
                  setIsMobileMenuOpen(false)
                }}
                className={`block px-3 py-2 text-base font-medium rounded-md w-full text-left transition-colors ${
                  isActive('/add') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Add Show
              </button>
              <button
                onClick={() => {
                  navigate('/lists')
                  setIsMobileMenuOpen(false)
                }}
                className={`block px-3 py-2 text-base font-medium rounded-md w-full text-left transition-colors ${
                  isActive('/lists') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                My Lists
              </button>
              <button
                onClick={() => {
                  navigate('/friends')
                  setIsMobileMenuOpen(false)
                }}
                className={`block px-3 py-2 text-base font-medium rounded-md w-full text-left transition-colors ${
                  isActive('/friends') 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                Friends
              </button>
              
              {/* Mobile User Menu */}
              {user && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center px-3 py-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-blue-600">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-base font-medium text-gray-900">{user.username}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 w-full text-left rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
