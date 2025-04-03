import requests
import json
from datetime import datetime

def fetch_jobicy_jobs(count=50, tag='remote'):
    """
    Fetch remote jobs from Jobicy API with proper response handling
    
    Args:
        count (int): Number of job listings to return (1-50)
        tag (str): Search by job title and description
        
    Returns:
        list: List of job dictionaries
    """
    # Base API URL
    api_url = "https://jobicy.com/api/v2/remote-jobs"
    
    # Build query string
    query_parts = []
    if count and 1 <= count <= 50:
        query_parts.append(f"count={count}")
    if tag:
        query_parts.append(f"tag={tag}")
    
    # Construct full URL with query string
    if query_parts:
        full_url = f"{api_url}?{'&'.join(query_parts)}"
    else:
        full_url = api_url
    
    print(f"Fetching jobs from Jobicy API: {full_url}")
    
    try:
        # Make the API request
        response = requests.get(full_url)
        
        # Print status code for debugging
        print(f"Response status code: {response.status_code}")
        
        # Check if request was successful
        if response.status_code != 200:
            print(f"API request failed with status code: {response.status_code}")
            print(f"Response content: {response.text[:500]}...")
            return []
        
        # Parse JSON response
        try:
            data = response.json()
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON response: {e}")
            print(f"Response content: {response.text[:500]}...")
            return []
        
        # Check if the response contains the jobs array
        if not isinstance(data, dict) or 'jobs' not in data:
            print(f"Unexpected API response format. Expected dictionary with 'jobs' key.")
            print(f"Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dictionary'}")
            return []
        
        # Extract jobs from the response
        jobs = data['jobs']
        job_count = data.get('jobCount', len(jobs))
        
        print(f"Found {job_count} jobs from Jobicy API")
        
        # Process each job to standardize the format
        processed_jobs = []
        for job in jobs:
            # Map the fields from the API response to our standardized format
            processed_job = {
                'title': job.get('jobTitle', 'No Title'),
                'company': job.get('companyName', 'Unknown Company'),
                'location': job.get('jobGeo', 'Remote'),
                'description': job.get('jobExcerpt', ''),
                'html_description': job.get('jobDescription', ''),
                'url': job.get('url', ''),
                'source': 'Jobicy',
                'posted_at': job.get('pubDate', ''),
                'salary': '',  # Default empty string
                'job_type': ', '.join(job.get('jobType', [])) if isinstance(job.get('jobType'), list) else job.get('jobType', ''),
                'category': ', '.join(job.get('jobIndustry', [])) if isinstance(job.get('jobIndustry'), list) else job.get('jobIndustry', ''),
                'company_logo': job.get('companyLogo', ''),
                'job_level': job.get('jobLevel', ''),
                'scraped_date': datetime.now().strftime("%Y-%m-%d")
            }
            
            # Add salary information if available
            if job.get('annualSalaryMin') or job.get('annualSalaryMax'):
                min_salary = job.get('annualSalaryMin', 0)
                max_salary = job.get('annualSalaryMax', 0)
                currency = job.get('salaryCurrency', 'USD')
                
                if min_salary and max_salary:
                    processed_job['salary'] = f"{currency} {min_salary:,} - {max_salary:,}"
                elif min_salary:
                    processed_job['salary'] = f"{currency} {min_salary:,}+"
                elif max_salary:
                    processed_job['salary'] = f"Up to {currency} {max_salary:,}"
            
            processed_jobs.append(processed_job)
        
        return processed_jobs
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from Jobicy API: {e}")
        return []

def save_jobs_to_json(jobs, filename="jobicy_jobs.json"):
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
    # Fetch remote jobs
    jobs = fetch_jobicy_jobs(count=30, tag='remote')
    
    if jobs:
        # Save to JSON file
        save_jobs_to_json(jobs)
        
        # Print sample of the first job
        if len(jobs) > 0:
            print("\nSample job:")
            sample_job = jobs[0]
            for key, value in sample_job.items():
                if key not in ['description', 'html_description']:  # Skip long descriptions
                    print(f"{key}: {value}")
    else:
        print("No jobs were fetched from Jobicy API")

if __name__ == "__main__":
    main()