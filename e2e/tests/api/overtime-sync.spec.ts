import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe.serial('Overtime Request API Sync', () => {
  let createdRequestId: number;
  let adminId: number;
  let employeeId: number = 1; // Default employee ID for testing
  let token: string = '';

  test.beforeAll(() => {
    // Read the token from the storage state
    const storageState = JSON.parse(fs.readFileSync(path.join(__dirname, '../../storageState.json'), 'utf-8'));
    const origin = storageState.origins.find((o: any) => o.origin === 'http://localhost:3000');
    token = origin?.localStorage?.find((item: any) => item.name === 'token')?.value || '';
  });

  test('should create an overtime request via API', async ({ request }) => {
    // We need to fetch an employee ID to use for the test, or just use 1.
    // Assuming 1 exists, or we could fetch the first employee.
    const headers = { Authorization: `Bearer ${token}` };
    const empRes = await request.get('http://localhost:5000/api/employees', { headers });
    if (empRes.ok()) {
      const empData = await empRes.json();
      if (empData.data && empData.data.length > 0) {
        employeeId = empData.data[0].id;
      }
    }

    const randomStr = Math.random().toString(36).substring(7);
    const date = new Date();
    // Add random days to avoid collision (up to 100 days in future)
    date.setDate(date.getDate() + Math.floor(Math.random() * 100) + 1);
    
    const payload = {
      employeeId,
      requestDate: date.toISOString().split('T')[0],
      startTime: '17:00',
      endTime: '19:00',
      reason: `E2E API Test ${randomStr}`
    };

    const response = await request.post('http://localhost:5000/api/overtime-requests', {
      headers,
      data: payload
    });

    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    if (!body.success) console.error('Create failed:', body);
    expect(body.success).toBe(true);
    createdRequestId = body.data.id;
    adminId = body.data.requestedByAdminId;
    
    console.log(`Created Overtime Request ID: ${createdRequestId}`);
  });

  test('should auto-sync the pending request to the notifications table', async ({ request }) => {
    const headers = { Authorization: `Bearer ${token}` };
    // The notifications endpoint auto-syncs pending requests on GET
    const response = await request.get('http://localhost:5000/api/notifications?filter=ALL&page=1&limit=50', { headers });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    const notifications = body.data.notifications || body.data;
    const targetLink = `/dashboard/notifications?overtimeRequestId=${createdRequestId}`;
    
    const syncNotification = notifications.find((n: any) => n.link === targetLink && n.title === 'New Overtime Request');
    expect(syncNotification).toBeDefined();
    expect(syncNotification.type).toBe('OVERTIME_REQUEST');
  });

  test('should approve the overtime request and remove old notification', async ({ request }) => {
    const headers = { Authorization: `Bearer ${token}` };
    // Approve it
    const approveResponse = await request.patch(`http://localhost:5000/api/overtime-requests/${createdRequestId}/approve`, {
      headers,
      data: { reviewNote: 'Approved via Playwright E2E' }
    });

    expect(approveResponse.status()).toBe(200);
    const approveBody = await approveResponse.json();
    if (!approveBody.success) console.error('Approve failed:', approveBody);
    expect(approveBody.success).toBe(true);
    expect(approveBody.data.status).toBe('APPROVED');
    expect(approveBody.data.reviewNote).toBe('Approved via Playwright E2E');

    // Fetch notifications again to ensure the "New Overtime Request" is gone
    const response = await request.get('http://localhost:5000/api/notifications?filter=ALL&page=1&limit=50', { headers });
    const body = await response.json();
    const notifications = body.data.notifications || body.data;
    
    const targetLink = `/dashboard/notifications?overtimeRequestId=${createdRequestId}`;
    
    // The old "New Overtime Request" should be gone
    const pendingNotification = notifications.find((n: any) => n.link === targetLink && n.title === 'New Overtime Request');
    expect(pendingNotification).toBeUndefined();

    // The new "Overtime Request Approved" should exist
    const approvedNotification = notifications.find((n: any) => n.link === targetLink && n.title === 'Overtime Request Approved');
    expect(approvedNotification).toBeDefined();
  });
});
