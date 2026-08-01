# Site Allocation System - API Integration Plan & Prompt

This document outlines the API integration between the **Attendance System** and the **Site Allocation & Planning Grid System**. It includes a prompt that you can copy and paste to the AI working on the Site Allocation project.

---

## The Integration Strategy

The Attendance System will make an HTTP GET request to the Site Allocation System every time a worker attempts to clock in via QR code. 

**Flow:**
1. Worker scans QR code at `Branch-A` (Branch Code: `2`).
2. Attendance System extracts employee code (e.g., `13`).
3. Attendance System calls `GET https://[site-allocation-url]/api/allocations/verify?workerId=13&siteNumber=2&date=2026-07-31`.
4. Site Allocation API returns whether the worker is allocated there on that date.
5. If `true`, the worker is clocked in. If `false`, the clock-in is denied.

---

## 🤖 Copy-Paste Prompt for the Site Allocation System AI

**Copy the text below and paste it into the IDE/AI that is managing the Site Allocation & Planning Grid System:**

```text
Hello! I am currently integrating this Site Allocation & Planning Grid System with our production Attendance System. 

The Attendance System needs a way to verify if a worker is actively allocated to a specific site on a specific date before allowing them to clock in via QR code.

Please create a new API endpoint in our Express backend to handle this verification.

### Endpoint Requirements:
- **Method:** `GET`
- **Route:** `/api/allocations/verify`
- **Query Parameters:**
  - `workerId` (string/number) - Maps to `workers.id`
  - `siteNumber` (string/number) - Maps to `projects.site_number` (or `projects.id`)
  - `date` (string, format: "YYYY-MM-DD") - Maps to `allocations.allocation_date`
- **Authentication:** The endpoint must be protected by an API Key (please define an API key environment variable for service-to-service communication, e.g., `SERVICE_API_KEY`).

### Expected Database Query Logic:
Based on our `worker_allocation_db` schema, you will need to execute a query similar to this:
\`\`\`sql
SELECT a.id 
FROM allocations a
JOIN projects p ON a.project_id = p.id
WHERE a.worker_id = ? 
  AND p.site_number = ? 
  AND a.allocation_date = ? 
  AND a.status = 'assigned';
\`\`\`
*(If the query returns a row, they are allocated).*

### Expected Response:
If the worker IS allocated to the specified branch on the specified date:
{
  "success": true,
  "allocated": true
}

If the worker IS NOT allocated, or the allocation was removed/completed:
{
  "success": true,
  "allocated": false
}

If parameters are missing or invalid:
{
  "success": false,
  "message": "Invalid parameters"
}

### Task:
1. Please write the Express route and controller logic for this endpoint using `mysql2`.
2. Update the necessary documentation to reflect this new endpoint.
3. Let me know what environment variables I need to add for the `SERVICE_API_KEY`.
```
