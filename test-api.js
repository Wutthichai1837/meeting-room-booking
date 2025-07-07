// Test script for my-bookings-today API
// Run this in browser console or as a separate test

async function testMyBookingsToday() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('No token found in localStorage');
    return;
  }

  try {
    const response = await fetch('/api/dashboard/my-bookings-today', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.status === 401) {
      console.error('Authentication failed - token may be invalid or expired');
    } else if (response.status === 200) {
      console.log('✅ API working correctly');
      console.log(`User: ${data.user?.firstName} ${data.user?.lastName}`);
      console.log(`Username: ${data.username}`);
      console.log(`Today's bookings count: ${data.count}`);
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Run the test
testMyBookingsToday();
