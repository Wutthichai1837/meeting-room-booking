// Test script for registration API
const testData = {
  username: "testuser123",
  email: "test@example.com",
  password: "password123",
  firstName: "Test",
  lastName: "User",
  phone: "0812345678",
  department: "IT"
};

async function testRegister() {
  try {
    console.log('Testing registration with data:', testData);
    
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Registration successful');
    } else {
      console.log('❌ Registration failed:', data.message);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Run the test
testRegister();
