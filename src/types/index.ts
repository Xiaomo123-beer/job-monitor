export interface JobSite {
  id: string;
  name: string;
  url: string;
  status: "active" | "paused" | "error";
  lastCrawledAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    jobPostings: number;
  };
}

export interface JobPosting {
  id: string;
  siteId: string;
  externalId: string;
  title: string;
  company: string | null;
  salary: string | null;
  location: string | null;
  experience: string | null;
  education: string | null;
  description: string;
  url: string;
  publishedAt: string | null;
  firstSeenAt: string;
  createdAt: string;
  matchResults?: MatchResult[];
  site?: JobSite;
}

export interface MatchResult {
  id: string;
  jobPostingId: string;
  userId: string;
  score: number;
  matchReason: string;
  isNotified: boolean;
  isRead: boolean;
  isFavorited: boolean;
  createdAt: string;
  jobPosting?: JobPosting;
}

export interface UserSettings {
  id: string;
  monitorFrequency: number;
  minMatchScore: number;
  notifyBrowser: boolean;
  notifyEmail: boolean;
  emailAddress: string | null;
  emailPassword: string | null;
  emailHost: string | null;
  emailPort: number | null;
  notifyWebhook: boolean;
  webhookUrl: string | null;
  webhookType: string | null;
  notifyWorkHoursOnly: boolean;
  notifyStartHour: number;
  notifyEndHour: number;
  dataRetentionDays: number;
  openaiApiKey: string | null;
  openaiBaseUrl: string | null;
  aiProvider: string | null;
  aiModel: string | null;
  jobRequirements: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  locationCities: string | null;
  experienceLevel: string | null;
  educationLevel: string | null;
  bonusKeywords: string | null;
  excludeKeywords: string | null;
}

export interface NotificationLog {
  id: string;
  matchResultId: string;
  channel: "browser" | "email" | "webhook";
  status: "sent" | "failed";
  errorMessage: string | null;
  sentAt: string;
}

export interface CrawlLog {
  id: string;
  siteId: string;
  status: "success" | "partial" | "failed";
  jobsFound: number;
  jobsNew: number;
  error: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalSites: number;
  activeSites: number;
  todayNewJobs: number;
  totalMatches: number;
  totalUnread: number;
}
