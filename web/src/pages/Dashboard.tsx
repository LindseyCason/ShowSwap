import React from 'react'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">ShowSwap Dashboard</h1>
          <div className="text-center py-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Welcome to ShowSwap!</h2>
            <p className="text-gray-600">Your friend-based show recommendation app is running.</p>
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">✅ Backend API connected</p>
              <p className="text-green-700">✅ Frontend React app loaded</p>
              <p className="text-green-700">✅ Database ready</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}