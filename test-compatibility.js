#!/usr/bin/env node

// Test script for compatibility calculation improvements

const API_BASE = 'http://localhost:3000';

async function testCompatibilityEndpoint() {
  try {
    // Test the health endpoint first
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Note: To test the compatibility endpoints, you'd need to:
    // 1. Login to get a session
    // 2. Have users with ratings in the database
    // 3. Call the debug endpoints
    
    console.log('📊 To test compatibility calculation:');
    console.log('1. Login to the app at http://localhost:5004');
    console.log('2. View a friend\'s profile who has mutual show ratings');
    console.log('3. Click the "Test Methods" button to see different calculations');
    console.log('4. Compare the results to see improved algorithm performance');
    
    console.log('\n🔧 New compatibility features:');
    console.log('- Hybrid method combines distance and correlation');
    console.log('- Weighted similarity for rating differences');
    console.log('- Pearson correlation for taste alignment');
    console.log('- Adaptive algorithm based on data size');
    console.log('- Configurable parameters for fine-tuning');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompatibilityEndpoint();
