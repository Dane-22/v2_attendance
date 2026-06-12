---
name: testing-requirements
description: Ensure all critical business logic has unit test coverage. Use Jest for backend logic and React Testing Library for frontend components. Maintain minimum 70% coverage for attendance-related functions (clock-in, QR validation, face verification).
---

Instructions:
- Write tests for all new utility functions and API endpoints
- Mock external dependencies (Prisma, Face API, QR scanner) in tests
- Include edge cases: network failures, invalid QR codes, duplicate clock-ins
- Run tests before committing; never commit code with failing tests
- Use descriptive test names that explain the expected behavior
