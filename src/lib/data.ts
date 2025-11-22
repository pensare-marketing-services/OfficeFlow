import { PlaceHolderImages } from './placeholder-images';

// This represents the data structure in Firestore, not the full User object used in the auth context
export type UserProfile = {
  id?: string; // Firestore ID will be the doc id
  name: string;
  email: string;
  role: 'admin' | 'employee';
  avatar: string;
};

// This type alias is for local mock data structure compatibility
export type User = UserProfile & { id: string };

export type ContentType = 'Image Ad' | 'Video Ad' | 'Carousel' | 'Backend Ad' | 'Story' | 'Web Blogs';
export type ContentStatus = 'Scheduled' | 'On Work' | 'For Approval' | 'Approved' | 'Posted' | 'Hold';
export type TaskStatus = 'To Do' | 'In Progress' | 'Done' | 'Overdue' | ContentStatus;

export type Task = {
  id: string; // Firestore document ID
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'Low' | 'Medium' | 'High';
  deadline: string; // ISO string
  assigneeId: string; // This will now be the user's Firestore UID
  progressNotes: { note: string; date: string }[];
  clientId?: string;
  date?: string; // ISO string
  contentType?: ContentType;
  createdAt?: string; // ISO string, but will be a server timestamp in Firestore
};

export type Client = {
  id: string;
  name: string;
};

const userAvatars: Record<string, string> = PlaceHolderImages.reduce((acc, img) => {
    acc[img.id] = img.imageUrl;
    return acc;
}, {} as Record<string, string>);

// This 'users' array is now for providing initial data for login mapping and seeding Firestore
// The 'id' here is the user's email, used to find the user for login.
// In a real app, user creation would be a formal process.
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

// Mock tasks are no longer the source of truth, but can be kept for reference or seeding scripts.
export const tasks: Task[] = [];
