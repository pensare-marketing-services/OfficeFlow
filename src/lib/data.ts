import { PlaceHolderImages } from './placeholder-images';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  avatar: string;
};

export type ContentType = 'Image Ad' | 'Video Ad' | 'Carousel' | 'Backend Ad' | 'Story' | 'Web Blogs';
export type ContentStatus = 'Scheduled' | 'On Work' | 'For Approval' | 'Approved' | 'Posted' | 'Hold';
export type TaskStatus = 'To Do' | 'In Progress' | 'Done' | 'Overdue' | ContentStatus;


export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'Low' | 'Medium' | 'High';
  deadline: string;
  assigneeId: string; // This will now be the user's email (which is also their ID)
  progressNotes: { note: string; date: string }[];
  clientId?: string;
  date?: string;
  contentType?: ContentType;
  createdAt?: string;
};

export type Client = {
  id: string;
  name: string;
};

const userAvatars: Record<string, string> = PlaceHolderImages.reduce((acc, img) => {
    acc[img.id] = img.imageUrl;
    return acc;
}, {} as Record<string, string>);

let nextId = 1;

export const users: User[] = [
  {
    id: 'admin@officeflow.com',
    name: 'Admin User',
    email: 'admin@officeflow.com',
    role: 'admin',
    avatar: userAvatars['user-avatar-1'] || `https://picsum.photos/seed/Admin/200/200`,
  },
  {
    id: 'alice@officeflow.com',
    name: 'Alice Johnson',
    email: 'alice@officeflow.com',
    role: 'employee',
    avatar: userAvatars['user-avatar-2'] || `https://picsum.photos/seed/Alice/200/200`,
  },
  {
    id: 'bob@officeflow.com',
    name: 'Bob Williams',
    email: 'bob@officeflow.com',
    role: 'employee',
    avatar: userAvatars['user-avatar-3'] || `https://picsum.photos/seed/Bob/200/200`,
  },
  {
    id: 'charlie@officeflow.com',
    name: 'Charlie Brown',
    email: 'charlie@officeflow.com',
    role: 'employee',
    avatar: userAvatars['user-avatar-4'] || `https://picsum.photos/seed/Charlie/200/200`,
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
    { id: 'client-1', name: 'Bar Co.' },
    { id: 'client-2', name: 'Mala Inc.' },
    { id: 'client-3', name: 'Habari Group' },
    { id: 'client-4', name: 'Tetra Corp.' },
    { id: 'client-5', name: 'Nexus Solutions' },
];

export const tasks: Task[] = [
  {
    id: `task-${nextId++}`,
    title: 'Develop new client reporting feature',
    description: 'Create a new feature that allows admins to generate PDF reports for clients. This should include AI-powered summaries.',
    status: 'In Progress',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
    assigneeId: 'alice@officeflow.com',
    progressNotes: [{ note: 'Initial setup and component creation complete.', date: new Date().toISOString() }],
  },
  {
    id: `task-${nextId++}`,
    title: 'Update UI Kit to v2.0',
    description: 'Update all components in the UI kit to match the new design specifications.',
    status: 'To Do',
    priority: 'Medium',
    deadline: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString(),
    assigneeId: 'alice@officeflow.com',
    progressNotes: [],
  },
  {
    id: `task-${nextId++}`,
    title: 'Fix login authentication bug',
    description: 'Users are reporting being unable to log in on Safari. Investigate and deploy a fix.',
    status: 'Done',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    assigneeId: 'bob@officeflow.com',
    progressNotes: [{ note: 'Identified issue with Safari cookie policy. Deployed a patch.', date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString() }],
  },
  {
    id: `task-${nextId++}`,
    title: 'Prepare Q3 financial projections',
    description: 'Gather all financial data and prepare the projection report for the next quarter.',
    status: 'To Do',
    priority: 'Medium',
    deadline: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
    assigneeId: 'charlie@officeflow.com',
    progressNotes: [],
  },
  {
    id: `task-${nextId++}`,
    title: 'Onboard new marketing intern',
    description: 'Create an onboarding plan and guide the new intern through their first week.',
    status: 'In Progress',
    priority: 'Low',
    deadline: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    assigneeId: 'bob@officeflow.com',
    progressNotes: [{ note: 'Onboarding plan created. First day activities completed.', date: new Date().toISOString() }],
  },
  {
    id: `task-${nextId++}`,
    title: 'Client Meeting Preparation',
    description: 'Prepare presentation slides for the upcoming meeting with Client X.',
    status: 'Overdue',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    assigneeId: 'alice@officeflow.com',
    progressNotes: [],
  },
  // New sample data for Habari Group
  {
      id: `task-${nextId++}`,
      clientId: 'client-3',
      date: '2024-11-12',
      deadline: '2024-11-12T00:00:00.000Z',
      title: 'Q-poll',
      description: 'Instagram question poll-1',
      contentType: 'Story',
      status: 'Posted',
      assigneeId: 'yaseen@officeflow.com',
      priority: 'Medium',
      progressNotes: [],
  },
  {
      id: `task-${nextId++}`,
      clientId: 'client-3',
      date: '2024-11-13',
      deadline: '2024-11-13T00:00:00.000Z',
      title: 'Gen Ad- Monday',
      description: 'Monday genreal AD- 17 Nov',
      contentType: 'Image Ad',
      status: 'Scheduled',
      assigneeId: 'issec@officeflow.com',
      priority: 'Medium',
      progressNotes: [],
  },
  {
      id: `task-${nextId++}`,
      clientId: 'client-3',
      date: '2024-11-13',
      deadline: '2024-11-13T00:00:00.000Z',
      title: 'Creative',
      description: 'Villa & Apartments',
      contentType: 'Image Ad',
      status: 'Scheduled',
      assigneeId: 'issec@officeflow.com',
      priority: 'Medium',
      progressNotes: [],
  },
  {
      id: `task-${nextId++}`,
      clientId: 'client-3',
      date: '2024-11-17',
      deadline: '2024-11-17T00:00:00.000Z',
      title: 'AI video',
      description: 'Creative AI video',
      contentType: 'Video Ad',
      status: 'Scheduled',
      assigneeId: 'issec@officeflow.com',
      priority: 'High',
      progressNotes: [],
  },
  {
      id: `task-${nextId++}`,
      clientId: 'client-3',
      date: '2024-11-18',
      deadline: '2024-11-18T00:00:00.000Z',
      title: 'Blog',
      description: 'Top 10 Factors',
      contentType: 'Web Blogs',
      status: 'Scheduled',
      assigneeId: 'zeenath@officeflow.com',
      priority: 'Medium',
      progressNotes: [],
  }
];
