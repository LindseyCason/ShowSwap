import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserProvider } from './lib/UserContext'
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import AddShow from './pages/AddShow'
import Lists from './pages/Lists'
import Friends from './pages/Friends'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/add" element={<AddShow />} />
              <Route path="/lists" element={<Lists />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/" element={<Dashboard />} />
            </Routes>
          </div>
        </Router>
      </UserProvider>
    </QueryClientProvider>
  )
}

export default App