// src/app/api/jobs/route.ts
import  { prisma }  from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { extractTechStack } from '@/lib/constants/tech-keywords';

const JOBS_PER_PAGE = 10;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title')?.toLowerCase() || '';
  const location = searchParams.get('location')?.toLowerCase() || '';
  const minSalary = searchParams.get('minSalary');
  const techStack = searchParams.get('techStack')?.split(',') || [];
  const page = parseInt(searchParams.get('page') || '1');

  try {
    // Get total count for pagination
    const totalJobs = await prisma.job.count({
      where: {
        AND: [
          {
            title: {
              contains: title,
            },
          },
          {
            location: {
              contains: location,
            },
          },
          ...(techStack.length > 0 ? [{
            techStack: {
              some: {
                tech: {
                  name: {
                    in: techStack,
                  },
                },
              },
            },
          }] : []),
        ],
      },
    });

    const jobs = await prisma.job.findMany({
      where: {
        AND: [
          {
            title: {
              contains: title,
            },
          },
          {
            location: {
              contains: location,
            },
          },
          ...(techStack.length > 0 ? [{
            techStack: {
              some: {
                tech: {
                  name: {
                    in: techStack,
                  },
                },
              },
            },
          }] : []),
        ],
      },
      include: {
        techStack: {
          include: {
            tech: true,
          },
        },
      },
      take: JOBS_PER_PAGE,
      skip: (page - 1) * JOBS_PER_PAGE,
      orderBy: {
        postedAt: 'desc',
      },
    });

    const formattedJobs = jobs.map(job => {
      // Extract tech stack from both stored tech stack and description
      const descriptionTechStack = extractTechStack(job.description);
      const storedTechStack = job.techStack.map(ts => ts.tech.name);
      
      // Combine and deduplicate tech stack
      const combinedTechStack = Array.from(new Set([...storedTechStack, ...descriptionTechStack]));

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        url: job.url,
        salary: job.salary,
        postedAt: job.postedAt,
        techStack: combinedTechStack,
        match: 0
      };
    });

    return NextResponse.json({
      jobs: formattedJobs,
      total: totalJobs,
      totalPages: Math.ceil(totalJobs / JOBS_PER_PAGE),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}