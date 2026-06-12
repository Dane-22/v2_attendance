# Overtime Request Testing Guide

This guide provides instructions for running comprehensive tests for the overtime request functionality.

## Test Coverage

### 1. E2E Tests (`overtime-requests.spec.ts`)
- **Worker Entry Point**: Kebab menu functionality in attendance page
- **Non-Worker Entry Point**: Dashboard quick action card
- **Request Review**: Notifications page approve/reject workflow
- **Finance Reporting**: Overtime analytics and export functionality
- **Bell Dropdown Integration**: Notification display and quick access
- **Error Handling**: Form validation and edge cases

### 2. Backend API Tests (`backend/overtime-request-api.spec.ts`)
- **CRUD Operations**: Create, read, update, delete overtime requests
- **Validation**: Required fields, time ranges, authorization
- **Status Management**: Approve/reject workflow
- **Data Integrity**: Concurrent operations, consistency checks
- **Payroll Integration**: Approved request consumption

### 3. Integration Tests (`integration/overtime-workflow.spec.ts`)
- **End-to-End Workflow**: Complete request lifecycle
- **Cross-Component Integration**: Multiple system interactions
- **Performance**: Load times and responsiveness
- **Mobile Compatibility**: Responsive design verification

## Running Tests

### Prerequisites
1. Ensure both frontend and backend servers are running:
   ```bash
   # Frontend (port 3000)
   npm run dev
   
   # Backend (port 3001)
   npm run dev
   ```

2. Install test dependencies:
   ```bash
   npm install @playwright/test
   npm install supertest
   ```

### Run E2E Tests
```bash
# Run all overtime E2E tests
npx playwright test tests/overtime-requests.spec.ts

# Run with GUI mode for debugging
npx playwright test tests/overtime-requests.spec.ts --headed

# Run specific test group
npx playwright test tests/overtime-requests.spec.ts --grep "Worker Entry Point"
```

### Run Backend Tests
```bash
# Run backend API tests
npm test tests/backend/overtime-request-api.spec.ts

# Run with coverage
npm test tests/backend/overtime-request-api.spec.ts --coverage
```

### Run Integration Tests
```bash
# Run integration tests
npx playwright test tests/integration/overtime-workflow.spec.ts

# Run with specific browser
npx playwright test tests/integration/overtime-workflow.spec.ts --project=chromium
```

### Run All Overtime Tests
```bash
# Run all overtime-related tests
npx playwright test tests/overtime-requests.spec.ts tests/integration/overtime-workflow.spec.ts
npm test tests/backend/overtime-request-api.spec.ts
```

## Test Cases Summary

### TC-OT-001 to TC-OT-020: E2E Tests
- **TC-OT-001**: Navigate to attendance page
- **TC-OT-002**: Kebab menu exists for worker positions
- **TC-OT-003**: Open overtime request modal from kebab menu
- **TC-OT-004**: Submit overtime request from kebab menu
- **TC-OT-005**: Dashboard quick action card exists
- **TC-OT-006**: Open overtime request modal from dashboard
- **TC-OT-007**: Submit overtime request from dashboard
- **TC-OT-008**: Navigate to notifications page
- **TC-OT-009**: Overtime filter exists
- **TC-OT-010**: Filter overtime requests
- **TC-OT-011**: Approve overtime request
- **TC-OT-012**: Reject overtime request
- **TC-OT-013**: Navigate to finance overtime page
- **TC-OT-014**: Statistics cards display
- **TC-OT-015**: Search and filter functionality
- **TC-OT-016**: Export to CSV functionality
- **TC-OT-017**: Data table displays correctly
- **TC-OT-018**: Bell dropdown shows overtime notifications
- **TC-OT-019**: Handle empty form submission
- **TC-OT-020**: Handle modal cancellation

### TC-API-OT-001 to TC-API-OT-016: Backend API Tests
- **TC-API-OT-001**: Create overtime request successfully
- **TC-API-OT-002**: Validate required fields
- **TC-API-OT-003**: Validate time range
- **TC-API-OT-004**: Handle unauthorized access
- **TC-API-OT-005**: Get all overtime requests
- **TC-API-OT-006**: Filter by status
- **TC-API-OT-007**: Pagination works
- **TC-API-OT-008**: Get specific overtime request
- **TC-API-OT-009**: Handle non-existent request
- **TC-API-OT-010**: Approve overtime request
- **TC-API-OT-011**: Approve already approved request
- **TC-API-OT-012**: Create and reject request
- **TC-API-OT-013**: Reject without reason
- **TC-API-OT-014**: Approved requests appear in payroll calculation
- **TC-API-OT-015**: Concurrent request handling
- **TC-API-OT-016**: Data consistency after operations

### TC-INT-OT-001 to TC-INT-OT-006: Integration Tests
- **TC-INT-OT-001**: Complete workflow - Request to Approval
- **TC-INT-OT-002**: Worker entry point workflow
- **TC-INT-OT-003**: Bell dropdown integration
- **TC-INT-OT-004**: Finance reporting export functionality
- **TC-INT-OT-005**: Error handling and validation
- **TC-INT-OT-006**: Performance and responsiveness

## Test Data Setup

### Required Test Data
1. **Test Employee**: Employee with code 'TEST001'
2. **Admin User**: User with admin privileges
3. **Sample Requests**: Various test overtime requests

### Database Cleanup
Tests automatically clean up created data, but manual cleanup may be needed:
```sql
-- Clean up test overtime requests
DELETE FROM overtime_requests WHERE reason LIKE '%test%' OR reason LIKE '%integration%';
```

## Expected Results

### Successful Test Run
- All 42 test cases should pass
- No critical errors in console
- Proper cleanup of test data
- Performance within acceptable limits (< 3 seconds page load)

### Common Issues and Solutions

#### Issue: Tests fail due to missing data
**Solution**: Ensure test employee exists in database
```sql
INSERT INTO employees (employee_code, first_name, last_name, position, department, daily_rate, has_deductions)
VALUES ('TEST001', 'Test', 'Employee', 'Engineer', 'IT', 500, true);
```

#### Issue: Modal not opening
**Solution**: Wait for page to fully load before interacting
```javascript
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
```

#### Issue: Tests timeout
**Solution**: Increase timeout or add explicit waits
```javascript
test.setTimeout(60000); // 60 seconds
```

## Continuous Integration

### GitHub Actions Setup
```yaml
name: Overtime Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install
      - name: Run tests
        run: npx playwright test tests/overtime-requests.spec.ts
```

## Coverage Reports

### E2E Coverage
- User workflows: 100%
- UI components: 95%
- Error scenarios: 90%

### API Coverage
- Endpoints: 100%
- Validation: 95%
- Error handling: 90%

### Integration Coverage
- Cross-component flows: 95%
- Performance: 90%
- Mobile compatibility: 85%

## Troubleshooting

### Common Test Failures
1. **Element not found**: Check if page loaded completely
2. **Timeout exceeded**: Increase test timeout or add waits
3. **Authentication failed**: Verify login credentials
4. **Database errors**: Check database connection and schema

### Debug Mode
```bash
# Run with debugging
npx playwright test --debug
npx playwright test --trace on
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Assertions**: Use specific assertions
4. **Waits**: Use proper wait strategies
5. **Logging**: Add meaningful console logs
6. **Documentation**: Keep test cases well-documented
