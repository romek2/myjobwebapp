'use client';

// components/ProRequiredMessage.tsx
import React from 'react';
import Link from 'next/link';

export default function ProRequiredMessage() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-xl font-semibold mb-4">PRO Access Required</h2>
      <p className="mb-4">This feature requires a PRO subscription.</p>
      <Link
        href="/pricing"
        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
      >
        View Plans
      </Link>
    </div>
  );
}