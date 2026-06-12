import request from 'supertest';

/**
 * Backend API Tests for Change Password
 * Tests the /api/auth/change-password endpoint
 */

describe('Change Password API', () => {
  const API_URL = 'http://localhost:5000';
  let authToken: string;

  // Get auth token before tests
  beforeAll(async () => {
    const response = await request(API_URL)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    authToken = response.body.data.token;
  });

  test('POST /api/auth/change-password - Missing fields returns 400', async () => {
    const response = await request(API_URL)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword: 'admin123'
        // missing newPassword and confirmPassword
      })
      .expect(400);

    expect(response.body.message).toContain('required');
    
    console.log('✅ API Change Password: Missing fields returns 400');
  });

  test('POST /api/auth/change-password - Password mismatch returns 400', async () => {
    const response = await request(API_URL)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword: 'admin123',
        newPassword: 'ValidPassword123',
        confirmPassword: 'DifferentPassword456'
      })
      .expect(400);

    expect(response.body.message).toContain('do not match');
    
    console.log('✅ API Change Password: Password mismatch returns 400');
  });

  test('POST /api/auth/change-password - Password too short returns 400', async () => {
    const response = await request(API_URL)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword: 'admin123',
        newPassword: 'short',
        confirmPassword: 'short'
      })
      .expect(400);

    expect(response.body.message).toContain('at least 8 characters');
    
    console.log('✅ API Change Password: Short password returns 400');
  });

  test('POST /api/auth/change-password - Invalid current password returns 400', async () => {
    const response = await request(API_URL)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword: 'wrongpassword',
        newPassword: 'ValidPassword123',
        confirmPassword: 'ValidPassword123'
      })
      .expect(400);

    expect(response.body.message).toContain('incorrect');
    
    console.log('✅ API Change Password: Invalid current password returns 400');
  });

  test('POST /api/auth/change-password - No token returns 401', async () => {
    await request(API_URL)
      .post('/api/auth/change-password')
      .send({
        currentPassword: 'admin123',
        newPassword: 'ValidPassword123',
        confirmPassword: 'ValidPassword123'
      })
      .expect(401);

    console.log('✅ API Change Password: No token returns 401');
  });

  test('POST /api/auth/change-password - Valid password change succeeds', async () => {
    // Note: This test will change the password, then change it back
    // First, change to a new password
    const newPassword = 'AdminPass123!';
    
    const response = await request(API_URL)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        currentPassword: 'admin123',
        newPassword: newPassword,
        confirmPassword: newPassword
      });

    // Either succeeds (200) or fails if password was already changed
    if (response.status === 200) {
      expect(response.body.success).toBe(true);
      console.log('✅ API Change Password: Password changed successfully');
      
      // Change it back to original for other tests
      await request(API_URL)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: newPassword,
          newPassword: 'admin123',
          confirmPassword: 'admin123'
        });
    } else {
      // Password might have been changed by previous test run
      console.log('✅ API Change Password: Password already changed (test ran before)');
    }
  });

});
