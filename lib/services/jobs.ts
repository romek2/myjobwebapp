// src/lib/services/jobs.ts
export async function searchJobs(title: string, location: string, minSalary: string) {
    const params = new URLSearchParams()
    if (title) params.append('title', title)
    if (location) params.append('location', location)
    if (minSalary) params.append('minSalary', minSalary)
  
    const response = await fetch(`/api/jobs?${params.toString()}`)
    if (!response.ok) {
      throw new Error('Failed to fetch jobs')
    }
    return response.json()
  }