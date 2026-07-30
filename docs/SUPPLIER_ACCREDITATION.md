# Supplier Accreditation Feature - Implementation Guide

## Overview
The supplier accreditation feature adds a verification layer to the procurement process. Suppliers must be accredited before purchase requests can proceed normally, or their requests are flagged for manual approval.

## Architecture

### Database Models

#### Supplier (Extended)
```
- id: UUID
- name: String
- conta ct: String
- email: String
- phone: String
- address: String
- category: String
- rating: Decimal
- status: ACTIVE | INACTIVE | SUSPENDED
- accreditationStatus: ACCREDITED | NOT_ACCREDITED | PENDING_VERIFICATION | REJECTED
- accreditationExpiry: DateTime (nullable)
- createdAt: DateTime
- updatedAt: DateTime
```

#### SupplierAccreditation
```
- id: UUID (primary)
- supplierId: UUID (FK) - Unique
- status: ACCREDITED | NOT_ACCREDITED | PENDING_VERIFICATION | REJECTED
- documentPath: String (file path/URL)
- documentType: String (MIME type)
- uploadedAt: DateTime
- uploadedBy: Int (admin ID)
- expiryDate: DateTime (nullable)
- verifiedAt: DateTime (nullable)
- verifiedBy: Int (admin ID, nullable)
- rejectionReason: String (nullable)
- createdAt: DateTime
- updatedAt: DateTime
```

#### PurchaseOrder (Extended)
```
- id: UUID
- poNumber: String (unique)
- supplierId: UUID (FK)
- projectId: Int (nullable)
- projectName: String (nullable)
- status: DRAFT | PENDING | APPROVED | ORDERED | RECEIVED | CANCELLED | FLAGGED | REQUIRES_APPROVAL
- accreditationStatus: ACCREDITED | NOT_ACCREDITED | PENDING_VERIFICATION | REJECTED
- requiresManualApproval: Boolean
- subtotal: Decimal
- tax: Decimal
- total: Decimal
- orderDate: DateTime
- deliveryDate: DateTime (nullable)
- requestedBy: Int
- approvedBy: Int (nullable)
- approvedAt: DateTime (nullable)
- rejectionReason: String (nullable)
- createdAt: DateTime
- updatedAt: DateTime
```

#### PurchaseOrderItem
```
- id: UUID
- purchaseOrderId: UUID (FK)
- itemName: String
- description: String (nullable)
- quantity: Decimal
- unit: String
- unitPrice: Decimal
- total: Decimal
- createdAt: DateTime
```

## Frontend Implementation

### Components

#### PurchaseRequestModal.tsx
Modal for creating purchase requests with built-in supplier accreditation checking.

**Features:**
- Supplier selection dropdown
- Real-time accreditation status display
- Conditional accreditation file upload
- Item line management (add/remove/edit)
- Automatic tax calculation
- Form validation
- Visual warnings for unaccredited suppliers

**Props:**
```typescript
interface PurchaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onSubmit: (order: Partial<PurchaseOrder>) => void;
  isLoading?: boolean;
}
```

#### AccreditationUpload.tsx
Component for uploading and managing accreditation documents.

**Features:**
- Drag-and-drop file upload
- File type validation (PDF, JPEG, PNG)
- File size validation (5MB max)
- Upload progress indicator
- File preview
- Success/error messaging

**Props:**
```typescript
interface AccreditationUploadProps {
  supplierId: string;
  onFileSelect: (file: File | null) => void;
  onUploadComplete?: (path: string) => void;
  error?: string;
}
```

#### AccreditationStatus.tsx
Component for displaying supplier accreditation status with admin verification controls.

**Features:**
- Status badge display
- Expiry date tracking
- Admin verification form
- Rejection reason display
- Responsive color coding

**Props:**
```typescript
interface AccreditationStatusProps {
  supplier: Supplier;
  accreditation?: SupplierAccreditation;
  onVerify?: (supplierId: string, approved: boolean, reason?: string) => void;
  isAdmin?: boolean;
}
```

### Types
```typescript
export interface SupplierAccreditation {
  id: string;
  supplierId: string;
  status: 'ACCREDITED' | 'NOT_ACCREDITED' | 'PENDING_VERIFICATION' | 'REJECTED';
  documentPath: string;
  documentType: string;
  uploadedAt: string;
  uploadedBy: string;
  expiryDate?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

export interface Supplier {
  // ... existing fields
  accreditationStatus?: 'ACCREDITED' | 'NOT_ACCREDITED' | 'PENDING_VERIFICATION' | 'REJECTED';
  accreditationExpiry?: string;
}

export interface PurchaseOrder {
  // ... existing fields
  supplierId: string;
  accreditationStatus?: 'ACCREDITED' | 'NOT_ACCREDITED' | 'PENDING_VERIFICATION' | 'REJECTED';
  requiresManualApproval?: boolean;
  rejectionReason?: string;
}
```

## Backend Implementation

### API Endpoints

#### 1. Upload Accreditation Document
```
POST /api/procurement/suppliers/:supplierId/accreditation/upload
Content-Type: multipart/form-data

Parameters:
- file: File (PDF, JPEG, PNG) - max 5MB
- userId: Int (admin uploading)

Response:
{
  "success": true,
  "message": "Accreditation document uploaded successfully",
  "accreditation": { ... }
}
```

#### 2. Get Supplier Accreditation Status
```
GET /api/procurement/suppliers/:supplierId/accreditation

Response:
{
  "success": true,
  "supplier": {
    "id": 1,
    "name": "Supplier Name",
    "accreditationStatus": "PENDING_VERIFICATION",
    "accreditation": { ... }
  }
}
```

#### 3. Verify Accreditation (Admin)
```
PUT /api/procurement/suppliers/:supplierId/accreditation/verify
Content-Type: application/json

Body:
{
  "approved": true,
  "verifiedBy": 123,
  "expiryDate": "2027-12-31",
  "rejectionReason": null
}

Response:
{
  "success": true,
  "message": "Accreditation approved successfully"
}
```

#### 4. Create Purchase Order
```
POST /api/procurement/purchase-orders
Content-Type: application/json

Body:
{
  "supplierId": 1,
  "projectId": 101,
  "projectName": "Project Name",
  "items": [
    {
      "name": "Item Name",
      "description": "Description",
      "quantity": 10,
      "unit": "pcs",
      "unitPrice": 1000
    }
  ],
  "subtotal": 10000,
  "tax": 1200,
  "total": 11200,
  "deliveryDate": "2026-06-30",
  "requestedBy": 1
}

Response:
{
  "success": true,
  "message": "Purchase order created successfully",
  "purchaseOrder": { ... },
  "requiresApproval": true
}
```

#### 5. Get All Purchase Orders
```
GET /api/procurement/purchase-orders?status=REQUIRES_APPROVAL&requiresApproval=true

Query Parameters:
- status: String (optional)
- supplierId: Int (optional)
- requiresApproval: Boolean (optional)

Response:
{
  "success": true,
  "orders": [ ... ]
}
```

#### 6. Update Purchase Order Status
```
PATCH /api/procurement/purchase-orders/:orderId/status
Content-Type: application/json

Body:
{
  "status": "APPROVED",
  "approvedBy": 123,
  "rejectionReason": null
}

Response:
{
  "success": true,
  "order": { ... }
}
```

## Workflow

### Normal Flow (Accredited Supplier)
```
1. User selects accredited supplier
2. Shows green "ACCREDITED" badge
3. User can immediately create purchase request
4. PO created with status: PENDING (normal approval flow)
5. No manual accreditation review needed
```

### Flagged Flow (Unaccredited Supplier)
```
1. User selects unaccredited supplier
2. Shows red "NOT_ACCREDITED" badge
3. System shows warning: "This supplier is not accredited"
4. Force user to upload accreditation document
5. User uploads file (PDF/Image)
6. PO created with status: REQUIRES_APPROVAL
7. Admin must verify document before approval
8. If approved → status changes to APPROVED
9. If rejected → PO flagged and rejected
```

### Pending Verification Flow
```
1. User tries to select supplier with PENDING_VERIFICATION status
2. Shows yellow "PENDING VERIFICATION" badge
3. User cannot proceed (submit button disabled)
4. Message: "This supplier is pending verification. Please wait for admin approval."
5. User must wait for admin to verify before proceeding
```

## Status Transitions

### Supplier Accreditation Status
```
Initial: NOT_ACCREDITED
        ↓
Upload Document
        ↓
PENDING_VERIFICATION
        ↓
    ├→ ACCREDITED (valid doc, no issues)
    └→ REJECTED (invalid doc, issues found)

ACCREDITED
        ↓
Auto-expires based on expiryDate
        ↓
Back to NOT_ACCREDITED (optional renewal cycle)
```

### Purchase Order Status
```
DRAFT (initial)
  ↓
PENDING (normal, supplier accredited)
  ├→ APPROVED (approved by admin)
  │   ├→ ORDERED
  │   └→ RECEIVED
  └→ CANCELLED

OR

REQUIRES_APPROVAL (unaccredited supplier)
  ├→ APPROVED (admin verifies accreditation & approves)
  │   ├→ ORDERED
  │   └→ RECEIVED
  ├→ CANCELLED (admin rejects)
  └→ FLAGGED (admin manual review needed)
```

## Features

### For Regular Users
- [x] View supplier accreditation status before creating PO
- [x] Upload accreditation documents for unaccredited suppliers
- [x] See real-time warnings about accreditation status
- [x] Create POs with accredited suppliers (normal flow)
- [x] Submit POs with unaccredited suppliers (flagged for approval)
- [x] Cannot proceed with PENDING_VERIFICATION suppliers

### For Admin Users
- [x] View all accreditation documents
- [x] Verify/reject accreditation documents
- [x] Add rejection reasons
- [x] Set accreditation expiry dates
- [x] View flagged purchase orders
- [x] Approve/reject flagged POs
- [x] See accreditation history

## File Upload

### Storage
- Files stored in: `public/uploads/accreditation/`
- Filename format: `accreditation-{timestamp}-{random}.{ext}`
- Accessible via: `/uploads/accreditation/{filename}`

### Validation
- Accepted types: PDF, JPEG, PNG, JPG
- Max size: 5MB
- Multer middleware handles storage & validation

## Security Considerations

1. **File Upload Validation**
   - MIME type checking
   - Size restrictions
   - Original filename sanitization

2. **Access Control**
   - Only authenticated users can upload
   - Only admins can verify
   - Role-based restrictions

3. **Data Protection**
   - PII in documents not directly processed
   - Secure file paths
   - Document expiry management

## Testing Checklist

### Frontend Testing
- [x] Modal opens/closes correctly
- [x] Supplier selection updates accreditation status
- [x] File upload works with valid files
- [x] File upload rejects invalid types
- [x] Form validation prevents submission without required fields
- [x] Tax calculation is correct
- [x] Items can be added/removed
- [x] Warning displays for unaccredited suppliers
- [x] Submit button disabled for PENDING_VERIFICATION

### Backend Testing
- [x] File upload endpoint works
- [x] Accreditation status endpoint returns correct data
- [x] Verification endpoint updates status
- [x] Purchase order creation checks accreditation
- [x] requiresManualApproval flag set correctly
- [x] Status filters work
- [x] Error handling for missing files

### Integration Testing
- [x] Full workflow: upload → verify → create PO → approve
- [x] Supplier transitions between statuses
- [x] PO status reflects supplier accreditation
- [x] Admin can see flagged POs in dashboard

## Migration Steps

1. **Run Prisma Migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add_accreditation
   ```

2. **Install Dependencies**
   ```bash
   npm install multer
   ```

3. **Create Public Directory**
   ```bash
   mkdir -p public/uploads/accreditation
   ```

4. **Update Server Routes**
   - Added to `src/server.ts`

5. **Restart Backend Server**
   ```bash
   npm run dev
   ```

## Troubleshooting

### File Upload Issues
- Check `public/uploads/accreditation/` directory exists
- Verify file permissions (755)
- Check file size < 5MB
- Verify MIME type is supported

### Status Not Updating
- Clear browser cache
- Check Prisma connection
- Verify admin ID is correct
- Check database for status value

### Modal Not Showing
- Verify `isModalOpen` state is true
- Check imports are correct
- Verify supplier data is loaded

## Future Enhancements

1. **Document Verification Automation**
   - OCR for certificate verification
   - Automatic expiry date detection
   - Document classification ML

2. **Batch Approval**
   - Multi-select accreditation documents
   - Bulk verification
   - Email notifications

3. **Audit Trail**
   - Track all accreditation changes
   - Document modification history
   - Admin approval logs

4. **Integration**
   - Auto-sync with external compliance databases
   - Real-time compliance status
   - Automated renewal reminders

5. **Analytics**
   - Accreditation trends
   - Supplier performance metrics
   - Approval time analytics

## Support & Contact

For issues or questions about the accreditation feature, contact the development team or reference this documentation.
