# Face Capture Functionality

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend API](#backend-api)
5. [Face Recognition Service](#face-recognition-service)
6. [Web Frontend](#web-frontend)
7. [Mobile App](#mobile-app)
8. [File Storage](#file-storage)
9. [Security](#security)
10. [Environment Variables](#environment-variables)
11. [Dependencies](#dependencies)
12. [Flow Diagrams](#flow-diagrams)
13. [Current Limitations & Future Work](#current-limitations--future-work)

---

## Overview

The face capture system allows employees to have their facial image recorded and associated with their profile. It is designed to support biometric attendance verification — employees can be identified via face recognition during clock-in/out, either alongside or as a replacement for QR code scanning.

The system spans three layers:

| Layer    | Technology                        | Purpose                                      |
|----------|-----------------------------------|----------------------------------------------|
| Mobile   | React Native (Expo Camera)        | Capture face image after QR scan at kiosk    |
| Web      | Next.js + face-api.js             | Branch-level face enrollment via browser     |
| Backend  | Node.js + Express + Prisma        | Store images, manage embeddings, verify faces |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│  ┌──────────────────────┐     ┌──────────────────────────────┐  │
│  │   Mobile App         │     │   Web Frontend               │  │
│  │  (Expo Camera)       │     │  (face-api.js + TF.js)       │  │
│  │                      │     │                              │  │
│  │  FaceCaptureScreen   │     │  /branch/face-capture        │  │
│  │  ScannerKioskScreen  │     │  Real-time face detection    │  │
│  └──────────┬───────────┘     └──────────────┬───────────────┘  │
│             │                                │                  │
└─────────────┼────────────────────────────────┼──────────────────┘
              │  POST /api/employees/:id/       │
              │  upload-face-capture            │
              ▼                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Employee Controller                                     │   │
│  │  uploadFaceCapture()                                     │   │
│  │  - Validate employee & branch                            │   │
│  │  - Duplicate detection (SHA-256 hash)                    │   │
│  │  - Store file via multer                                 │   │
│  │  - Update DB record                                      │   │
│  │  - Log activity                                          │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │  Face Recognition Service (prepared, not yet mounted)    │   │
│  │  - AES-256-CBC embedding encryption                      │   │
│  │  - Euclidean distance comparison                         │   │
│  │  - Register / Verify / Delete facial data                │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │  Storage                                                 │   │
│  │  backend/assets/face-captures/employees/                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Employee Model (Prisma)

The following fields on the `Employee` model are relevant to face capture:

```prisma
model Employee {
  // ... other fields

  faceCaptureImage  String?  @map("face_capture_image") @db.VarChar(255)
  // Path to the stored face capture image file

  faceConsentGiven  Boolean? @default(false) @map("face_consent_given")
  // Whether the employee has given consent for biometric data collection

  faceDataVersion   String?  @map("face_data_version") @db.VarChar(10)
  // Version tag for future schema migrations of facial data
}
```

### Migration

File: `backend/prisma/migrations/003_add_face_capture_image.sql`

```sql
ALTER TABLE employees
  ADD COLUMN face_capture_image VARCHAR(255);
```

> **Note:** `faceEmbedding` and `faceRegisteredAt` fields are referenced in the face recognition service but are not yet present in the Prisma schema. These will need to be added when the recognition service is fully activated.

---

## Backend API

### Upload Face Capture

Stores a face image for a given employee and associates it with their profile.

```
POST /api/employees/:id/upload-face-capture
```

**Authentication:** Required (JWT Bearer token)

**Content-Type:** `multipart/form-data`

**URL Parameters:**

| Parameter | Type   | Description         |
|-----------|--------|---------------------|
| `id`      | number | Employee's database ID |

**Request Body (form-data):**

| Field         | Type   | Required | Description                          |
|---------------|--------|----------|--------------------------------------|
| `faceCapture` | File   | Yes      | Image file (JPEG, JPG, PNG, or WebP) |
| `branchCode`  | string | Yes      | Branch code the employee belongs to  |

**File Constraints:**
- Accepted MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- Maximum file size: **10 MB**
- Stored filename format: `{employeeId}_face_{timestamp}.{ext}`

**Success Response `200 OK`:**

```json
{
  "success": true,
  "message": "Face capture uploaded successfully",
  "data": {
    "id": 117,
    "employeeCode": "EMP-001",
    "firstName": "Juan",
    "middleName": "Santos",
    "lastName": "Dela Cruz",
    "branchCode": "BR-001",
    "branchName": "Main Branch",
    "profileImage": "/assets/profile-images/employees/117_1777361022966.png",
    "faceCaptureImage": "/assets/face-captures/employees/117_face_1778133702393.jpg",
    "updatedAt": "2026-05-21T10:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Condition                                              |
|--------|--------------------------------------------------------|
| `400`  | Missing `branchCode` or invalid file type              |
| `403`  | Branch admin attempting to upload for another branch   |
| `404`  | Employee not found                                     |
| `409`  | Duplicate image detected (same SHA-256 hash exists)    |
| `500`  | Internal server error                                  |

---

### Face Recognition Routes (Prepared — Not Yet Mounted)

These routes exist in `backend/src/routes/faceRecognition.routes.ts` but are not currently registered in the main Express server. They will be activated when `FACIAL_RECOGNITION_ENABLED=true` is set and the service is fully integrated.

| Method   | Endpoint                                  | Description                          |
|----------|-------------------------------------------|--------------------------------------|
| `POST`   | `/face-recognition/register/:employeeId`  | Register a facial embedding          |
| `POST`   | `/face-recognition/verify`                | Verify a face against stored data    |
| `GET`    | `/face-recognition/status/:employeeId`    | Get registration status              |
| `DELETE` | `/face-recognition/delete/:employeeId`    | Delete all facial data for employee  |
| `GET`    | `/face-recognition/logs/:employeeId`      | Retrieve recognition attempt logs    |

---

## Face Recognition Service

File: `backend/src/services/faceRecognition.service.ts`

This service handles the cryptographic and mathematical operations for facial biometrics. It is fully implemented but not yet wired into the attendance clock-in flow.

### Embedding Encryption

Facial embeddings (128-dimensional float arrays) are encrypted before storage using **AES-256-CBC**.

```
Key:    FACE_ENCRYPTION_KEY env var (32-byte hex string)
IV:     Random 16 bytes generated per encryption
Format: {iv_hex}:{encrypted_hex}
```

### Core Functions

#### `encryptEmbedding(embedding: number[]): string`
Serializes and encrypts a 128-dimensional facial embedding array.

#### `decryptEmbedding(encrypted: string): number[]`
Decrypts and deserializes a stored embedding back to a float array.

#### `compareFaces(embedding1: number[], embedding2: number[]): number`
Calculates the **Euclidean distance** between two facial embeddings. Lower distance = higher similarity.

```
distance = sqrt( Σ (a_i - b_i)² )
```

#### `distanceToConfidence(distance: number): number`
Converts a raw Euclidean distance to a normalized confidence score between 0 and 1.

```
confidence = max(0, 1 - (distance / maxDistance))
```

#### `registerFace(employeeId, embedding, consentGiven): Promise<void>`
Encrypts and stores a facial embedding for an employee. Sets `faceConsentGiven` and `faceDataVersion`.

#### `verifyFace(employeeId, embedding, threshold?): Promise<VerificationResult>`
Retrieves the stored embedding for an employee, decrypts it, and compares it against the provided embedding.

- Default threshold: **0.7** (configurable via `FACE_CONFIDENCE_THRESHOLD`)
- Returns `{ matched: boolean, confidence: number }`

#### `getFaceRegistrationStatus(employeeId): Promise<RegistrationStatus>`
Returns whether an employee has a registered facial embedding and when it was registered.

#### `deleteFaceData(employeeId): Promise<void>`
Clears all facial data fields for an employee (embedding, consent, version, registration date).

#### `logFaceRecognition(employeeId, result, confidence, ipAddress): Promise<void>`
Writes a recognition attempt to the activity log with timestamp, result, and confidence score.

#### `getFaceRecognitionLogs(employeeId, limit?): Promise<Log[]>`
Retrieves the most recent recognition attempts for an employee. Default limit: 50.

---

## Web Frontend

File: `frontend/src/app/branch/face-capture/page.tsx`

The web-based face capture page is used by branch operators to enroll employees. It uses **face-api.js** (backed by TensorFlow.js) for real-time face detection directly in the browser.

### Model Loading

On page mount, the following face-api.js models are loaded from `/face-api-models`:

- **SSD MobileNet v1** — Fast, lightweight face detection model

### Face Quality Validation

Before a capture is accepted, the detected face must pass all of the following checks:

| Check              | Requirement                                      |
|--------------------|--------------------------------------------------|
| Face count         | Exactly **1** face in frame                      |
| Minimum face area  | Face bounding box ≥ **12%** of total frame area  |
| Horizontal center  | Face center X between **35%** and **65%** of frame width |
| Vertical center    | Face center Y between **30%** and **70%** of frame height |

### Capture Modes

**Automatic Capture:**
- Once a face passes all quality checks, a **3-second countdown** begins
- If the face remains stable and valid throughout the countdown, the photo is captured automatically
- Countdown resets if the face moves out of the valid zone

**Manual Capture:**
- A "Capture" button is always available for the operator to trigger manually
- Bypasses the countdown timer

### Visual Feedback

The camera preview border changes color to indicate face positioning status:

| Color  | Meaning                                      |
|--------|----------------------------------------------|
| Green  | Face is well-positioned, countdown active    |
| Yellow | Face detected but needs adjustment           |
| Red    | No face detected or multiple faces in frame  |

### Post-Capture Flow

1. Captured image is shown as a preview
2. Operator can retake or confirm
3. On confirm, image is uploaded via `POST /api/employees/:id/upload-face-capture`
4. On success, the page automatically redirects back to the QR scanner

---

## Mobile App

File: `attendance-mobile/src/screens/FaceCaptureScreen.tsx`

The mobile face capture screen is part of the kiosk attendance flow. It is triggered automatically after a successful QR code scan.

### Camera Configuration

- Camera type: **Front-facing**
- Capture quality: **0.7** (70% JPEG quality)
- Uses Expo Camera API

### UI Elements

- Face frame overlay with **corner guide markers** to help the employee position their face
- Employee information display (name, employee code, branch)
- "Capture" button for manual trigger
- "Retake" button to discard and try again
- Loading indicator during upload

### Integration with Kiosk Flow

```
ScannerKioskScreen
  └── QR Code Scanned
        └── Employee Resolved
              └── FaceCaptureScreen (receives employee data + branchCode)
                    └── Photo Captured
                          └── Upload to Backend
                                └── Callback → Update resolved employee state
```

The `FaceCaptureScreen` receives:
- `employee` — resolved employee object from QR scan
- `branchCode` — current branch identifier
- `onCaptureDone(employee)` — callback to update parent state after upload

---

## File Storage

### Directory Structure

```
backend/
└── assets/
    ├── profile-images/
    │   └── employees/
    │       └── {employeeId}_{timestamp}.{ext}
    └── face-captures/
        └── employees/
            └── {employeeId}_face_{timestamp}.{ext}
```

### Filename Convention

| Component      | Example                              |
|----------------|--------------------------------------|
| Employee ID    | `117`                                |
| Separator      | `_face_`                             |
| Unix timestamp | `1778133702393`                      |
| Extension      | `.jpg`, `.png`, `.webp`              |
| Full example   | `117_face_1778133702393.jpg`         |

### Static File Serving

Face capture images are served as static files by Express:

```
GET /assets/face-captures/employees/{filename}
```

The `faceCaptureImage` field stored in the database contains this relative path.

---

## Security

### Authentication & Authorization

- All face capture endpoints require a valid **JWT Bearer token**
- **Branch admins** are restricted to uploading face captures only for employees within their own branch
- Super admins can upload for any employee

### Duplicate Detection

Before saving a new face capture, the backend computes a **SHA-256 hash** of the uploaded image binary and compares it against all existing face capture files. If a match is found, the upload is rejected with a `409 Conflict` response. This prevents:

- Accidentally assigning the same photo to multiple employees
- Re-uploading identical images

### Embedding Encryption

When face recognition is activated, facial embeddings are never stored in plaintext. The AES-256-CBC encryption ensures that even if the database is compromised, raw biometric data cannot be extracted without the encryption key.

### File Validation

Multer middleware enforces:
- Allowed MIME types: `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- Maximum file size: 10 MB
- Files are stored server-side only; no CDN or third-party storage

### Activity Logging

Every face capture upload is written to the activity log with:
- Acting user (who performed the upload)
- IP address
- Timestamp
- Employee ID
- Before/after state of `faceCaptureImage` field

---

## Environment Variables

| Variable                    | Required | Default | Description                                                  |
|-----------------------------|----------|---------|--------------------------------------------------------------|
| `FACE_ENCRYPTION_KEY`       | Yes*     | —       | 32-byte hex string used as AES-256-CBC key for embeddings    |
| `FACIAL_RECOGNITION_ENABLED`| No       | `false` | Set to `true` to mount face recognition routes               |
| `FACE_CONFIDENCE_THRESHOLD` | No       | `0.7`   | Minimum confidence score (0–1) to accept a face match        |

> *Required only when `FACIAL_RECOGNITION_ENABLED=true`

---

## Dependencies

### Backend

| Package              | Version       | Purpose                              |
|----------------------|---------------|--------------------------------------|
| `multer`             | 1.4.5-lts.1   | Multipart file upload handling       |
| `@prisma/client`     | 5.10.0        | Database ORM                         |
| `crypto` (built-in)  | Node.js       | AES-256-CBC encryption, SHA-256 hash |

### Web Frontend

| Package              | Version  | Purpose                                      |
|----------------------|----------|----------------------------------------------|
| `face-api.js`        | 0.22.2   | Face detection and recognition in browser    |
| `@tensorflow/tfjs`   | 4.22.0   | TensorFlow.js runtime for face-api.js models |

### Mobile App

| Package                | Version  | Purpose                              |
|------------------------|----------|--------------------------------------|
| `expo-camera`          | 17.0.10  | Camera access and photo capture      |
| `expo-face-detector`   | 13.0.2   | Expo built-in face detection         |

---

## Flow Diagrams

### Web Frontend Flow

```
Branch Operator opens /branch/face-capture
          │
          ▼
Load face-api.js models (SSD MobileNet v1)
          │
          ▼
Camera stream starts
          │
          ▼
Real-time face detection loop
          │
    ┌─────┴──────┐
    │            │
No face       Face detected
detected      │
    │         ▼
    │    Quality checks
    │    (size, position, count)
    │         │
    │    ┌────┴────┐
    │    │         │
    │  Fail      Pass
    │    │         │
    │  Yellow    Green border
    │  border    + 3s countdown
    │             │
    │         Countdown
    │         complete
    │             │
    └─────────────┤
                  ▼
           Photo captured
                  │
                  ▼
           Preview shown
                  │
          ┌───────┴───────┐
          │               │
        Retake          Confirm
          │               │
          │    POST /api/employees/:id/upload-face-capture
          │               │
          │          ┌────┴────┐
          │          │         │
          │        Error     Success
          │          │         │
          │       Show       Redirect to
          └──────── alert    QR Scanner
```

### Mobile App Flow

```
Employee scans QR code at kiosk
          │
          ▼
ScannerKioskScreen resolves employee
          │
          ▼
FaceCaptureScreen opens
(employee data + branchCode passed in)
          │
          ▼
Front camera activates
          │
          ▼
Employee positions face in frame
          │
          ▼
Employee taps "Capture"
          │
          ▼
Photo taken (quality: 0.7)
          │
          ▼
Preview shown
          │
    ┌─────┴──────┐
    │            │
  Retake      Confirm
    │            │
    │   POST /api/employees/:id/upload-face-capture
    │            │
    │       ┌────┴────┐
    │       │         │
    │     Error     Success
    │       │         │
    │    Show       onCaptureDone(employee)
    └──── alert     callback fires
```

### Backend Upload Flow

```
POST /api/employees/:id/upload-face-capture
          │
          ▼
JWT authentication middleware
          │
          ▼
uploadFaceCaptureMiddleware (multer)
- Validate MIME type
- Enforce 10MB limit
- Write to /assets/face-captures/employees/
          │
          ▼
uploadFaceCapture controller
          │
          ▼
Validate employee exists (by :id)
          │
          ▼
Validate branchCode matches employee
          │
          ▼
Branch admin authorization check
          │
          ▼
SHA-256 duplicate detection
(compare hash against all existing captures)
          │
    ┌─────┴──────┐
    │            │
Duplicate     Unique
found         │
    │         ▼
  409        Update employee.faceCaptureImage in DB
Conflict      │
              ▼
           Log activity (before/after)
              │
              ▼
           Return updated employee object
```

---

## Current Limitations & Future Work

### What's Working Now

- ✅ Face image capture via mobile kiosk (Expo Camera)
- ✅ Face image capture via web browser (face-api.js with quality validation)
- ✅ Image upload and storage on the backend
- ✅ Duplicate image detection via SHA-256 hashing
- ✅ `faceCaptureImage` path stored in employee record
- ✅ Face recognition service fully implemented (encryption, comparison, logging)

### What's Not Yet Active

| Feature                              | Status         | Notes                                                                 |
|--------------------------------------|----------------|-----------------------------------------------------------------------|
| Face recognition routes              | Not mounted    | Routes exist but not registered in Express server                     |
| Attendance clock-in via face         | Not integrated | Face capture not yet used in clock-in/out flow                        |
| `faceEmbedding` DB field             | Missing        | Referenced in service but not in Prisma schema — migration needed     |
| `faceRegisteredAt` DB field          | Missing        | Same as above                                                         |
| Liveness detection                   | Not implemented| No anti-spoofing (photo/video replay attacks not prevented)           |
| Real-time face comparison at kiosk   | Not implemented| Currently only stores image; no live verification                     |
| Batch face verification              | Not implemented| No bulk re-verification capability                                    |

### Recommended Next Steps

1. **Add missing DB fields** — Add `faceEmbedding` (Text) and `faceRegisteredAt` (DateTime) to the Prisma schema and run a migration.

2. **Mount face recognition routes** — Register `faceRecognition.routes.ts` in the main Express server when `FACIAL_RECOGNITION_ENABLED=true`.

3. **Integrate into clock-in flow** — After QR scan resolves an employee, optionally verify their face before recording attendance.

4. **Add liveness detection** — Consider integrating a challenge-response (blink, turn head) or depth-based check to prevent photo spoofing.

5. **Employee consent UI** — Build a consent screen that sets `faceConsentGiven=true` before any biometric data is collected, to comply with data privacy regulations.
