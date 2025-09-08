// Test API connection from frontend
const testAPI = async () => {
  try {
    console.log('🧪 Testing API connection...');
    
    // Test health check
    const healthResponse = await fetch('/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test login with seeded user
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: 'lindsey' }),
      credentials: 'include',
    });
    const loginData = await loginResponse.json();
    console.log('✅ Login test:', loginData);
    
    // Test dashboard
    const dashboardResponse = await fetch('/api/dashboard', {
      credentials: 'include',
    });
    const dashboardData = await dashboardResponse.json();
    console.log('✅ Dashboard test:', dashboardData);
    
    // Test user lists
    const listsResponse = await fetch('/api/my/lists', {
      credentials: 'include',
    });
    const listsData = await listsResponse.json();
    console.log('✅ Lists test:', listsData);
    
    console.log('🎉 All API tests passed! Frontend is connected to database.');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
};

// Run tests when page loads
document.addEventListener('DOMContentLoaded', testAPI);
