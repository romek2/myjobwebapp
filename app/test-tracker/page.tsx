// app/test-tracker/page.tsx
'use client';

export default function TestTracker() {
  const createMockData = async () => {
    const response = await fetch('/api/test/create-mock-data', { method: 'POST' });
    const result = await response.json();
    alert(JSON.stringify(result, null, 2));
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Application Tracker</h1>
      <button 
        onClick={createMockData}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create Mock Data
      </button>
    </div>
  );
}