export type UserProfile = {
  uid?: string;
  name?: string;
  email?: string;
  role: 'admin' | 'employee';
  username?: string;
  nickname?: string;
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
  time?: string;
  assigneeIds: string[]; 
  progressNotes: ProgressNote[];
  clientId?: string;
  date?: string; 
  contentType?: ContentType;
  createdAt?: any; // Allow serverTimestamp
  activeAssigneeIndex?: number;
  month?: string;
};

export type ClientNoteStatus = "Done" | "On Work" | "Pending" | "Scheduled" | "For Approval";

export type ClientNote = {
  id: string;
  note: string;
  update: ClientNoteStatus;
  remarks?: ProgressNote[];
}

export type MonthData = {
    name: string;
    plan?: string;
    billDuration?: string;
    socialPlatforms?: string;
    monthlyReach?: string;
    paidPromotionsMainBudget?: number;
    planPromotionsMainBudget?: number;
    paidPromotionsOldBalance?: number;
    planPromotionsOldBalance?: number;
    notes?: ClientNote[];
    billingStatus?: 'Issued' | 'Not Issued';
};

export type Client = {
  id: string;
  name: string;
  address?: string;
  socialPlatforms?: string;
  plan?: string;
  billDuration?: string;
  monthlyReach?: string;
  employeeIds?: string[];
  priority?: number;
  notes?: ClientNote[]; // Deprecated, kept for migration
  categories?: string[];
  months?: MonthData[];
  paidPromotionsMainBudget?: number; // Deprecated
  planPromotionsMainBudget?: number; // Deprecated
  paidPromotionsOldBalance?: number; // Deprecated
  planPromotionsOldBalance?: number; // Deprecated
  active?: boolean;
  deactivationReason?: string;
};

export type PromotionBase = {
    id: string;
    date: string;
    campaign: string;
    adType: 'EG Whatsapp' | 'EG Instagram' | 'EG FB Post' | 'EG Insta Post' | 'Traffic Web' | 'Lead Gen' | 'Lead Call' | 'Profile Visit Ad' | 'FB Page Like' | 'Carousel Ad' | 'IG Engage' | 'Reach Ad';
    budget: number;
    status: 'Active' | 'Stopped' | 'Scheduled' | 'To Do';
    assignedTo: string;
    spent: number;
    remarks: ProgressNote[];
    clientId: string;
    linkedTaskId?: string;
    month?: string;
}

export type PaidPromotion = PromotionBase;
export type PlanPromotion = PromotionBase;


export type CashInTransactionStatus = 'Received' | 'Not Received';

export type CashInTransaction = {
    id: string;
    date: string;
    amount: number;
    status: CashInTransactionStatus;
    month?: string;
}

export type BillStatus = "Issued" | "Paid" | "Partially" | "Overdue" | "Cancelled";

export type BillItem = {
    description: string;
    amount: number;
};

export type Bill = {
  id: string;
  slNo: number;
  duration: string;
  status: BillStatus;
  view: string; 
  billAmount: number;
  balance: number;
  clientId: string;
  month: string;
  issuedDate: string;
  items?: BillItem[];
};

export type InternalNote = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  color?: string;
  clientId?: string;
  clientName?: string;
  order?: number;
};

export type WebsiteEntry = {
  id: string;
  clientName: string;
  address: string;
  contactPerson: string;
  contactNo: string;
  domainName: string;
  domainAccount: string;
  domainEmail: string;
  purchasedBy: string;
  domainExpiry: string;
  hostingExpiry: string;
  hostingCompany: string;
  hostRemarks: string;
  platform: string;
  themeLink: string;
  adminPanelLink: string;
  adminPanelName: string;
  panelPassword: string;
  workDoneBy: string;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  wpUser: string;
  wpPassword: string;
  webmailUser: string;
  webmailPassword: string;
  createdAt: any;
};
