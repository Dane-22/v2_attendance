import { chromium } from 'playwright';

(async () => {
  console.log('Starting Playwright End-to-End Test');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // We will attempt to login and navigate to drag&drop
    // Drag & Drop frontend is on http://localhost:5173
    console.log('Navigating to drag&drop application...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    console.log('Checking page title...');
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Test the API directly via Playwright's APIRequestContext
    console.log('Creating API request context to test endpoints...');
    const apiContext = await browser.newContext({
      baseURL: 'http://localhost:5001',
    });
    const request = apiContext.request;
    
    const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    console.log('Sending transfer sync request to drag&drop API via Playwright API Request...');
    
    const response = await request.post('/api/allocations/sync_transfer', {
      data: {
        employeeId: 119,
        branchCode: 'F',
        date: dateStr
      }
    });
    
    const responseBody = await response.json();
    console.log('Response from drag&drop sync_transfer:', responseBody);

    if (responseBody.success) {
      console.log('✅ Playwright API test passed for drag&drop sync');
    } else {
      console.error('❌ Playwright API test failed for drag&drop sync');
    }
  } catch (error) {
    console.error('Playwright Test Error:', error.message);
  } finally {
    await browser.close();
    console.log('Playwright test completed.');
  }
})();
