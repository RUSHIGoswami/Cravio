import type { CampaignStatus } from '../components/data-display/StatusPill';

export interface DemoInfluencer {
  name: string;
  handle: string;
  verified: boolean;
  location: string;
  niches: string[];
  followers: number;
  engagement: number;
  languages: string[];
}

export interface DemoCampaign {
  title: string;
  brand: string;
  type: string;
  budget: string;
  deadline: string;
  match: number;
  niches: string[];
  status?: CampaignStatus;
}

/** Demo data — fake, local, no network calls (per the <2s-on-4G constraint). */
export const INFLUENCERS: DemoInfluencer[] = [
  { name: 'Aanya R', handle: '@aanya.styles', verified: true, location: 'Jaipur', niches: ['Fashion', 'Beauty', 'Festive'], followers: 128000, engagement: 4.2, languages: ['Hindi', 'English'] },
  { name: 'Dev Kapoor', handle: '@devcooks', verified: true, location: 'Delhi', niches: ['Food', 'Vlogs'], followers: 342000, engagement: 5.1, languages: ['Hindi'] },
  { name: 'Meera S', handle: '@meera.fit', verified: false, location: 'Pune', niches: ['Fitness', 'Wellness'], followers: 54000, engagement: 6.8, languages: ['Marathi', 'English'] },
  { name: 'Karthik V', handle: '@kartech', verified: true, location: 'Chennai', niches: ['Tech', 'Gadgets'], followers: 211000, engagement: 3.4, languages: ['Tamil', 'English'] },
  { name: 'Riya B', handle: '@riya.travels', verified: false, location: 'Kolkata', niches: ['Travel', 'Lifestyle'], followers: 89000, engagement: 4.9, languages: ['Bengali', 'Hindi'] },
];

export const CAMPAIGNS: DemoCampaign[] = [
  { title: 'Summer ethnic-wear haul', brand: 'Libas', type: 'Reel + Story', budget: '₹15K', deadline: '5 days left', match: 92, niches: ['Fashion', 'Festive'], status: 'under-review' },
  { title: 'Protein snack launch', brand: 'Yoga Bar', type: 'Reel', budget: '₹22K', deadline: '8 days left', match: 78, niches: ['Fitness', 'Food'] },
  { title: 'Smart-home unboxing', brand: 'Mi India', type: 'Long-form video', budget: '₹40K', deadline: '12 days left', match: 64, niches: ['Tech'] },
  { title: 'Monsoon skincare routine', brand: 'Plum', type: 'Story + Post', budget: '₹12K', deadline: '3 days left', match: 88, niches: ['Beauty', 'Wellness'], status: 'applied' },
];

export const APPLICATIONS = [
  { brand: 'Libas', title: 'Summer ethnic-wear haul', status: 'under-review' as CampaignStatus, budget: '₹15K' },
  { brand: 'Plum', title: 'Monsoon skincare routine', status: 'approved' as CampaignStatus, budget: '₹12K' },
  { brand: 'Nykaa', title: 'Festive glam tutorial', status: 'paid' as CampaignStatus, budget: '₹28K' },
  { brand: 'Sugar', title: 'Matte lipstick launch', status: 'declined' as CampaignStatus, budget: '₹9K' },
];
