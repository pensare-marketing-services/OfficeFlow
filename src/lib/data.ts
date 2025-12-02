
export type UserProfile = {
  uid?: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  avatar: string;
};

export type User = UserProfile & { id: string };

export type ContentType = 'Image Ad' | 'Video Ad' | 'Carousel' | 'Backend Ad' | 'Story' | 'Web Blogs';
export type ContentStatus = 'Scheduled' | 'On Work' | 'For Approval' | 'Approved' | 'Posted' | 'Hold';
export type TaskStatus = 'To Do' | 'In Progress' | 'Done' | 'Overdue' | ContentStatus | 'Ready for Next';
export type ProgressNote = {
    note: string;
    date: string;
    authorId: string;
    authorName: string;
    imageUrl?: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'Low' | 'Medium' | 'High';
  deadline: string; 
  assigneeIds: string[]; 
  progressNotes: ProgressNote[];
  clientId?: string;
  date?: string; 
  contentType?: ContentType;
  createdAt?: any; // Allow serverTimestamp
  activeAssigneeIndex?: number;
};

export type Client = {
  id: string;
  name: string;
  socialPlatforms?: string;
  plan?: string;
  billDuration?: string;
  monthlyReach?: string;
};

// This is now primarily for seeding the database or local testing.
// In a production app, user creation would happen through a registration flow.
export const users: User[] = [
  {
    id: 'admin@officeflow.com',
    name: 'Admin User',
    email: 'admin@officeflow.com',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxwZXJzb24lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjI5MzU5MTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'alice@officeflow.com',
    name: 'Alice Johnson',
    email: 'alice@officeflow.com',
    role: 'employee',
    avatar: 'https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHx3b21hbiUyMHNtaWxpbmd8ZW58MHx8fHwxNzYyOTc1Nzg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'bob@officeflow.com',
    name: 'Bob Williams',
    email: 'bob@officeflow.com',
    role: 'employee',
    avatar: 'https://images.unsplash.com/photo-1624395213043-fa2e123b2656?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxtYW4lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjI5NTI2MDJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'charlie@officeflow.com',
    name: 'Charlie Brown',
    email: 'charlie@officeflow.com',
    role: 'employee',
    avatar: 'https://images.unsplash.com/photo-1634795776422-5a85c8e0f1ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxwZXJzb24lMjBnbGFzc2VzfGVufDB8fHx8MTc2Mjk3MjM1N3ww&ixlib=rb-4.1.0&q=80&w=1080',
  },
   {
    id: 'yaseen@officeflow.com',
    name: 'Yaseen',
    email: 'yaseen@officeflow.com',
    role: 'employee',
    avatar: `https://picsum.photos/seed/yaseen/200/200`
  },
  {
    id: 'issec@officeflow.com',
    name: 'Issec',
    email: 'issec@officeflow.com',
    role: 'employee',
    avatar: `https://picsum.photos/seed/issec/200/200`
  },
   {
    id: 'zeenath@officeflow.com',
    name: 'Zeenath',
    email: 'zeenath@officeflow.com',
    role: 'employee',
    avatar: `https://picsum.photos/seed/zeenath/200/200`
  },
   {
    id: 'jasnas@officeflow.com',
    name: 'Jasnas',
    email: 'jasnas@officeflow.com',
    role: 'employee',
    avatar: `https://picsum.photos/seed/jasnas/200/200`
  },
];


export const clients: Client[] = [
    { id: 'client-1', name: 'Bar Co.', plan: '10 Designs, 2 Reels', billDuration: 'Dec 1 - Dec 31', monthlyReach: '10k - 20k', socialPlatforms: 'FB-Insta' },
    { id: 'client-2', name: 'Mala Inc.', plan: '20 Designs, 5 Reels, 1 Carousal', billDuration: 'Dec 1 - Dec 31', monthlyReach: '50k - 75k', socialPlatforms: 'FB-Insta-Ytb' },
    { id: 'client-3', name: 'Habari Group', plan: '12 Designs, 4 Reels, 2 Carousal', billDuration: 'Dec 1 to Dec 31', monthlyReach: '1 Lack - 2 Lack', socialPlatforms: 'FB-Insta-Ytb-GMB-SnapChat-linked-in' },
    { id: 'client-4', name: 'Tetra Corp.', plan: '5 Designs', billDuration: 'Dec 1 - Dec 31', monthlyReach: '5k', socialPlatforms: 'FB' },
    { id: 'client-5', name: 'Nexus Solutions', plan: '15 Designs, 3 Reels', billDuration: 'Dec 1 - Dec 31', monthlyReach: '30k - 40k', socialPlatforms: 'Insta-Ytb' },
];

export const tasks: Task[] = [
  {
    id: 'task-1',
    title: 'Launch Campaign Video',
    description: 'Finalize and launch the main campaign video ad.',
    status: 'For Approval',
    priority: 'High',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    assigneeIds: ['yaseen@officeflow.com', 'issec@officeflow.com'],
    clientId: 'client-1',
    contentType: 'Video Ad',
    progressNotes: [{ note: 'First draft is ready for review.', date: new Date().toISOString(), authorId: 'admin@officeflow.com', authorName: 'Admin User' }],
    activeAssigneeIndex: 0,
  },
  {
    id: 'task-2',
    title: 'Weekly Social Media Posts',
    description: 'Create and schedule posts for all social channels.',
    status: 'On Work',
    priority: 'Medium',
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    assigneeIds: ['issec@officeflow.com'],
    clientId: 'client-2',
    contentType: 'Image Ad',
    progressNotes: [],
    activeAssigneeIndex: 0,
  },
  {
    id: 'task-3',
    title: 'Q3 Analytics Report',
    description: 'Compile and present the performance report for Q3.',
    status: 'Approved',
    priority: 'Medium',
    deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    assigneeIds: ['zeenath@officeflow.com'],
    clientId: 'client-3',
    contentType: 'Backend Ad',
    progressNotes: [{note: 'Report is complete and has been sent to the client.', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), authorId: 'zeenath@officeflow.com', authorName: 'Zeenath'}],
    activeAssigneeIndex: 0,
  },
  {
    id: 'task-4',
    title: 'New Website Blog Post',
    description: 'Write and publish a blog post on "The Future of AI".',
    status: 'Scheduled',
    priority: 'Low',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    assigneeIds: ['jasnas@officeflow.com'],
    clientId: 'client-1',
    contentType: 'Web Blogs',
    progressNotes: [],
    activeAssigneeIndex: 0,
  },
  {
    id: 'task-5',
    title: 'Instagram Story Poll',
    description: 'Run an interactive poll in the Instagram story.',
    status: 'Posted',
    priority: 'Medium',
    deadline: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    assigneeIds: ['yaseen@officeflow.com'],
    clientId: 'client-4',
    contentType: 'Story',
    progressNotes: [],
    activeAssigneeIndex: 0,
  },
  {
    id: 'task-6',
    title: 'Client Onboarding Carousel',
    description: 'Design a carousel for the new client onboarding flow.',
    status: 'On Work',
    priority: 'High',
    deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    assigneeIds: ['issec@officeflow.com', 'zeenath@officeflow.com'],
    clientId: 'client-5',
    contentType: 'Carousel',
    progressNotes: [{note: 'Wireframes are done.', date: new Date().toISOString(), authorId: 'issec@officeflow.com', authorName: 'Issec'}],
    activeAssigneeIndex: 1,
  },
  {
    id: 'task-7',
    title: 'Overdue Task Example',
    description: 'This task is intentionally overdue for demonstration.',
    status: 'On Work',
    priority: 'High',
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    assigneeIds: ['zeenath@officeflow.com'],
    clientId: 'client-2',
    contentType: 'Image Ad',
    progressNotes: [],
    activeAssigneeIndex: 0,
  }
];
