export async function GET() {
  const now = new Date();
  const utcTime = now.toISOString();
  const localTime = now.toLocaleString();
  
  console.log(`UTC Time: ${utcTime}`);
  console.log(`Local Time: ${localTime}`);
  
  return NextResponse.json({
    success: true,
    utcTime: utcTime,
    localTime: localTime,
    message: "Cron executed!"
  });
}