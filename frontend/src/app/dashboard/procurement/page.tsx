'use client';

import { useEffect } from 'react';

export default function ProcurementPage() {
  useEffect(() => {
    // Redirect to external procurement site
    window.location.href = 'https://procurement.xandree.com/';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">Redirecting to Procurement...</p>
    </div>
  );
}
