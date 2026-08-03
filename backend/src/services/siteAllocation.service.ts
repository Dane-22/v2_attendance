export class SiteAllocationService {
  /**
   * Verifies if a worker is actively allocated to a specific site on a given date.
   * If the API URL is not configured, it fails open (returns true) to prevent breaking production.
   *
   * @param employeeId The employee ID (integer)
   * @param branchCode The site/branch code (string)
   * @param date The date in YYYY-MM-DD format
   * @returns boolean indicating if the worker is allocated
   */
  static async verifyWorkerAllocation(employeeId: number, branchCode: string, date: string): Promise<boolean> {
    const apiUrl = process.env.SITE_ALLOCATION_API_URL;
    const apiKey = process.env.SITE_ALLOCATION_API_KEY;

    // Fail-open fallback: if integration isn't fully configured yet, allow the clock-in
    if (!apiUrl) {
      console.warn('[SiteAllocationService] SITE_ALLOCATION_API_URL is not configured. Bypassing allocation check.');
      return true;
    }

    try {
      const url = new URL('/api/allocations/verify', apiUrl);
      url.searchParams.append('employeeId', employeeId.toString());
      url.searchParams.append('branchCode', branchCode);
      url.searchParams.append('date', date);

      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      console.log(`[SiteAllocationService] Verifying allocation for Employee ID: ${employeeId} at Branch: ${branchCode}`);
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        console.error(`[SiteAllocationService] API request failed with status: ${response.status} ${response.statusText}`);
        // If the external API fails (e.g., 500 error), we choose to fail closed to strictly enforce allocations
        // Alternatively, this could be changed to fail open depending on business requirements.
        return false;
      }

      const data: any = await response.json();
      
      if (data && data.success === true && typeof data.allocated === 'boolean') {
        return data.allocated;
      }

      console.warn(`[SiteAllocationService] Unexpected API response format:`, data);
      return false;

    } catch (error) {
      console.error(`[SiteAllocationService] Error communicating with Site Allocation API:`, error);
      // Fail closed on network errors
      return false;
    }
  }

  /**
   * Synchronizes a branch to the Site Allocation system as a project.
   *
   * @param branch The branch object to sync
   */
  static async syncBranch(branch: any): Promise<void> {
    const apiUrl = process.env.SITE_ALLOCATION_API_URL;
    const apiKey = process.env.SITE_ALLOCATION_API_KEY;

    if (!apiUrl) {
      console.warn('[SiteAllocationService] SITE_ALLOCATION_API_URL is not configured. Skipping branch sync.');
      return;
    }

    try {
      const url = new URL('/api/projects/sync', apiUrl);
      
      const payload = {
        branch_code: branch.branch_code,
        branch_name: branch.branch_name,
        status: branch.is_active ? 'Active' : 'Inactive'
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(`[SiteAllocationService] Branch sync API request failed with status: ${response.status} ${response.statusText}`);
      } else {
        console.log(`[SiteAllocationService] Successfully synced branch ${branch.branch_code} to Site Allocation system.`);
      }
    } catch (error) {
      console.error(`[SiteAllocationService] Error communicating with Site Allocation API during branch sync:`, error);
    }
  }

  /**
   * Synchronizes an employee to the Site Allocation system.
   *
   * @param employee The employee object to sync
   */
  static async syncWorker(employee: any): Promise<void> {
    const apiUrl = process.env.SITE_ALLOCATION_API_URL;
    const apiKey = process.env.SITE_ALLOCATION_API_KEY;

    if (!apiUrl) {
      console.warn('[SiteAllocationService] SITE_ALLOCATION_API_URL is not configured. Skipping worker sync.');
      return;
    }

    try {
      const url = new URL('/api/workers/sync', apiUrl);
      
      const payload = {
        id: employee.id,
        name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
        trade: employee.department || employee.position || 'Worker',
        status: employee.status,
        profile_photo_url: employee.profileImage || null
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(`[SiteAllocationService] Worker sync failed with status: ${response.status} ${response.statusText}`);
      } else {
        console.log(`[SiteAllocationService] Successfully synchronized worker ${payload.name}`);
      }
    } catch (error) {
      console.error(`[SiteAllocationService] Error synchronizing worker to Site Allocation API:`, error);
    }
  }

  /**
   * Synchronizes a worker's transfer to a new branch for today in the Site Allocation system.
   *
   * @param employeeId The employee ID
   * @param branchCode The new branch code
   * @param date The date in YYYY-MM-DD format
   */
  static async syncWorkerTransfer(employeeId: number, branchCode: string, date: string): Promise<void> {
    const apiUrl = process.env.SITE_ALLOCATION_API_URL;
    const apiKey = process.env.SITE_ALLOCATION_API_KEY;

    if (!apiUrl) {
      console.warn('[SiteAllocationService] SITE_ALLOCATION_API_URL is not configured. Skipping worker transfer sync.');
      return;
    }

    try {
      const url = new URL('/api/allocations/sync_transfer', apiUrl);
      
      const payload = {
        employeeId,
        branchCode,
        date
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(`[SiteAllocationService] Worker transfer sync failed with status: ${response.status} ${response.statusText}`);
      } else {
        console.log(`[SiteAllocationService] Successfully synchronized worker transfer for ID ${employeeId} to branch ${branchCode}`);
      }
    } catch (error) {
      console.error(`[SiteAllocationService] Error synchronizing worker transfer to Site Allocation API:`, error);
    }
  }
}
