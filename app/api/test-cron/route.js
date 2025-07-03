import { NextResponse } from 'next/server';

export async function GET() {
  const now = new Date();
  const message = `🎉 Cron job executed successfully!`;
  
  console.log('='.repeat(50));
  console.log(message);
  console.log(`Timestamp: ${now.toISOString()}`);
  console.log(`Local time: ${now.toLocaleString()}`);
  console.log('='.repeat(50));
  
  return NextResponse.json({
    success: true,
    message: message,
    timestamp: now.toISOString(),
    localTime: now.toLocaleString(),
    testData: {
      randomNumber: Math.floor(Math.random() * 1000),
      serverTime: now.getTime()
    }
  });
}