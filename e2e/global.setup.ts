import { request } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup() {
  const requestContext = await request.newContext();
  
  // Login to the backend API directly to get the token
  const response = await requestContext.post('http://localhost:5000/api/auth/login', {
    data: {
      username: 'admin',
      password: 'admin123'
    }
  });

  if (!response.ok()) {
    throw new Error(`Failed to login during global setup: ${response.status()} ${response.statusText()}`);
  }

  const responseBody = await response.json();
  
  if (!responseBody.success || !responseBody.data?.token) {
    throw new Error('Login failed: Token not found in response');
  }

  const { token, user } = responseBody.data;

  // We need to inject the token and user into localStorage for the frontend to recognize the session
  // Playwright's storageState allows setting origins and localStorage
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3000',
        localStorage: [
          {
            name: 'token',
            value: token
          },
          {
            name: 'user',
            value: JSON.stringify(user)
          },
          {
            name: 'jajr-app-storage',
            value: JSON.stringify({
              state: {
                theme: 'dark',
                user: user,
                branchId: null,
                sidebarOpen: true
              },
              version: 0
            })
          }
        ]
      }
    ]
  };

  // Save the storage state to a file
  fs.writeFileSync(
    path.join(__dirname, 'storageState.json'),
    JSON.stringify(storageState, null, 2)
  );

  console.log('Global setup complete. Authenticated as Admin.');
}

export default globalSetup;
