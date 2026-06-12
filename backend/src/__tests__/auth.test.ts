import request from 'supertest';

/**
 * Backend API Tests for Authentication
 * 
 * These tests verify the authentication API endpoints work correctly
 */

describe('Auth API', () => {
  
  // Base URL for backend API
  const API_URL = 'http://localhost:5000';

  test('POST /api/auth/login - Valid credentials returns token', async () => {
    const response = await request(API_URL)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      })
      .expect(200);

    // Verify response structure
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user).toHaveProperty('username');
    
    console.log('✅ API Auth: Valid login returns token');
  });

  test('POST /api/auth/login - Invalid credentials returns 401', async () => {
    const response = await request(API_URL)
      .post('/api/auth/login')
      .send({
        username: 'wronguser',
        password: 'wrongpassword'
      })
      .expect(401);

    // Verify error response
    expect(response.body).toHaveProperty('message');
    
    console.log('✅ API Auth: Invalid login returns 401');
  });

  test('POST /api/auth/login - Missing fields returns 400', async () => {
    const response = await request(API_URL)
      .post('/api/auth/login')
      .send({
        username: 'admin'
        // password missing
      })
      .expect(400);

    console.log('✅ API Auth: Missing fields returns 400');
  });

  test('POST /api/auth/login - Token structure validation', async () => {
    const response = await request(API_URL)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      })
      .expect(200);

    // Verify token is JWT format (has 3 parts separated by dots)
    const token = response.body.data.token;
    expect(token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    
    // Verify user data structure
    expect(response.body.data.user).toHaveProperty('id');
    expect(response.body.data.user).toHaveProperty('username');
    expect(response.body.data.user).toHaveProperty('role');
    
    console.log('✅ API Auth: Token structure is valid JWT format');
  });

  test('POST /api/auth/login - Branch user login', async () => {
    // Test with branch user pattern (if exists)
    const response = await request(API_URL)
      .post('/api/auth/login')
      .send({
        username: 'branch-a',
        password: 'admin123'
      });

    // Either user doesn't exist (401) or login succeeds (200)
    if (response.status === 200) {
      expect(response.body.data.userType).toBe('branch');
      expect(response.body.data.user).toHaveProperty('branch_name');
      console.log('✅ API Auth: Branch user login works');
    } else {
      expect(response.status).toBe(401);
      console.log('✅ API Auth: Branch user correctly rejected (user not found)');
    }
  });

});
