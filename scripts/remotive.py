import requests
import json
from datetime import datetime

def fetch_remotive_jobs(category=None, limit=15):
    """
    Fetch remote jobs from Remotive API with optional filtering
    
    Args:
        category (str, optional): Category to filter jobs by (e.g., "software-development")
        limit (int, optional): Maximum number of jobs to retrieve
    
    Returns:
        list: List of job dictionaries
    """
    # Base API URL
    api_url = "https://remotive.com/api/remote-jobs"
    
    # Build query parameters
    params = {}
    if category:
        params['category'] = category
    if limit and isinstance(limit, int) and limit > 0:
        params['limit'] = limit
    
    print(f"Fetching jobs from Remotive API: {api_url}")
    if params:
        print(f"With parameters: {params}")
    
    try:
        # Make the API request
        response = requests.get(api_url, params=params)
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        # Parse JSON response
        data = response.json()
        
        # Get job count
        job_count = data.get('job-count', 0)
        print(f"Found {job_count} jobs from Remotive API")
        
        # Extract jobs list
        jobs = data.get('jobs', [])
        
        # Process each job to standardize the format
        processed_jobs = []
        for job in jobs:
            processed_job = {
                'title': job.get('title', 'No Title'),
                'company': job.get('company_name', 'Unknown Company'),
                'location': job.get('candidate_required_location', 'Remote'),
                'description': job.get('description', ''),
                'url': job.get('url', ''),
                'source': 'Remotive',
                'posted_at': job.get('publication_date', ''),
                'salary': job.get('salary', ''),
                'job_type': job.get('job_type', ''),
                'category': job.get('category', ''),
                'company_logo': job.get('company_logo', ''),
                'scraped_date': datetime.now().strftime("%Y-%m-%d")
            }
            processed_jobs.append(processed_job)
        
        return processed_jobs
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from Remotive API: {e}")
        return []

def save_jobs_to_json(jobs, filename="remotive_jobs.json"):
    """Save the fetched jobs to a JSON file"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(jobs, f, indent=4, ensure_ascii=False)
        print(f"Successfully saved {len(jobs)} jobs to {filename}")
        return True
    except Exception as e:
        print(f"Error saving jobs to JSON: {e}")
        return False

def main():
    # Fetch software development jobs (limit to 50 for testing)
    jobs = fetch_remotive_jobs(category="software-development", limit=50)
    
    if jobs:
        # Save to JSON file
        save_jobs_to_json(jobs)
        
        # Print sample of the first job
        if len(jobs) > 0:
            print("\nSample job:")
            sample_job = jobs[0]
            for key, value in sample_job.items():
                if key != 'description':  # Skip long description
                    print(f"{key}: {value}")
    else:
        print("No jobs were fetched from Remotive API")

if __name__ == "__main__":
    main()