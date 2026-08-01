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

      const headers: HeadersInit = {
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

      const data = await response.json();
      
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
}
