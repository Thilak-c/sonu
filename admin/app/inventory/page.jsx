'use client';

import React from 'react';
import AdminShell from '@/components/AdminShell';

export default function InventoryPage() {
  return (
    <AdminShell>
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white rounded-2xl p-8 border border-neutral-200/60 shadow-xs text-center font-['Helvetica_Now_Text',sans-serif]">
        <h2 className="text-2xl font-bold text-[#111111]">Under Development</h2>
        <p className="text-neutral-500 mt-2 text-sm max-w-sm">
          This section is currently under development. Please visit Products to manage catalog.
        </p>
      </div>
    </AdminShell>
  );
}
