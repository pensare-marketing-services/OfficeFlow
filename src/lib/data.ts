

export type UserProfile = {
  uid?: string;
  name?: string;
  email?: string;
  role: 'admin' | 'employee';
  username?: string;
  password?: string;
  priority?: number;
  department?: 'digitalmarketing' | 'contentwriter' | 'designers' | 'videoeditor' | 'web' | 'seo';
};

export type User = UserProfile & { id: string };

export type ContentType = 'Image Ad' | 'Video Ad' | 'Carousel Ad' | 'Reels' | 'Story' | 'Hoarding' | 'Other' | 'Printing' | 'Board' | 'Backend Ad' | 'LED Video' | 'Web Blogs' | 'Podcast' | 'SEO' | 'Website' | 'Grid Insta' | 'EG Whatsapp' | 'EG Instagram' | 'EG FB Post' | 'EG Insta Post' | 'Traffic Web' | 'Lead Gen' | 'Lead Call' | 'Profile Visit Ad' | 'FB Page Like' | 'IG Engage' | 'Reach Ad';
export type ContentStatus = 'Scheduled' | 'On Work' | 'For Approval' | 'Approved' | 'Posted' | 'Hold' | 'Pending' | 'Completed' | 'Running' | 'Started';
export type TaskStatus = 'To Do' | ContentStatus | 'Ready for Next' | 'Reschedule' | 'Overdue' | 'Active' | 'Stopped';
export type ProgressNote = {
    note: string;
    date: string;
    authorId: string;
    authorName?: string;
    imageUrl?: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: number;
  deadline: string; 
  assigneeIds: string[]; 
  progressNotes: ProgressNote[];
  clientId?: string;
  date?: string; 
  contentType?: ContentType;
  createdAt?: any; // Allow serverTimestamp
  activeAssigneeIndex?: number;
};

export type ClientNoteStatus = "Done" | "On Work" | "Pending" | "Scheduled" | "For Approval";

export type ClientNote = {
  id: string;
  note: string;
  update: ClientNoteStatus;
  remarks?: ProgressNote[];
}

export type Client = {
  id: string;
  name: string;
  socialPlatforms?: string;
  plan?: string;
  billDuration?: string;
  monthlyReach?: string;
  employeeIds?: string[];
  priority?: number;
  notes?: ClientNote[];
  categories?: string[];
  paidPromotionsMainBudget?: number;
  planPromotionsMainBudget?: number;
  paidPromotionsOldBalance?: number;
  planPromotionsOldBalance?: number;
};

export type PromotionBase = {
    id: string;
    date: string;
    campaign: string;
    adType: 'EG Whatsapp' | 'EG Instagram' | 'EG FB Post' | 'EG Insta Post' | 'Traffic Web' | 'Lead Gen' | 'Lead Call' | 'Profile Visit Ad' | 'FB Page Like' | 'Carousel Ad' | 'IG Engage' | 'Reach Ad';
    budget: number;
    status: 'Active' | 'Stopped' | 'Scheduled';
    assignedTo: string;
    spent: number;
    remarks: ProgressNote[];
    clientId: string;
    linkedTaskId?: string;
}

export type PaidPromotion = PromotionBase;
export type PlanPromotion = PromotionBase;


export type CashInTransactionStatus = 'Received' | 'Not Received';

export type CashInTransaction = {
    id: string;
    date: string;
    amount: number;
    status: CashInTransactionStatus;
}

