// src/app/api/applications/route.ts
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// src/app/api/applications/route.ts
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: {
      job: {
        select: {
          title: true,
          company: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(applications);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const data = await request.json();
  const { jobId } = data;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const application = await prisma.application.create({
    data: {
      userId: user.id,
      jobId,
      status: 'applied'
    }
  });

  return NextResponse.json(application);
}