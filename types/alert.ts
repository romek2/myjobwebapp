// types/alert.ts
export interface JobAlert {
    id: string;
    userId: string;
    name: string;
    keywords: string;
    frequency: 'daily' | 'weekly' | 'realtime';
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface PremiumJob {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    description: string;
    url: string;
    isPremium: boolean;
    postedAt: Date;
  }