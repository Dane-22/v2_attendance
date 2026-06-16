---
name: project-context
description: This is an attendance tracking system with Next.js frontend (App Router), Prisma ORM with MySQL backend, QR code-based clock in/out, multi-branch employee management, Face API integration for verification, and an Expo/React Native mobile app.
---

Key Domain Concepts:
- Employee: Has unique code, PIN, QR code, branch assignment
- Clock In/Out: Records attendance with timestamp, location, method (QR/Face/Manual)
- Branch: Company location with employees, schedules, and transfer capabilities
- QR Code: Generated per employee, contains encrypted employee ID + timestamp
- Face Verification: Uses face-api.js models for biometric attendance

Technology Stack:
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js API Routes, Prisma ORM, MySQL
- Mobile: Expo SDK, React Native, TypeScript
- Security: bcrypt, JWT tokens, environment variables for secrets
