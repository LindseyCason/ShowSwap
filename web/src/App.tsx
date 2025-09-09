import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import AddShow from './pages/AddShow'
import Lists from './pages/Lists'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/add" element={<AddShow />} />
            <Route path="/lists" element={<Lists />} />
            <Route path="/" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App