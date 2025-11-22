import { PlaceHolderImages } from './placeholder-images';
import type { Timestamp } from 'firebase/firestore';

export type UserProfile = {
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  avatar: string;
};

export type User = UserProfile & { id: string };

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
  assigneeId: string; 
  progressNotes: { note: string; date: string }[];
  clientId?: string;
  date?: string; 
  contentType?: ContentType;
  createdAt?: Timestamp | string;
};

export type Client = {
  id: string;
  name: string;
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
    { id: 'client-1', name: 'Bar Co.' },
    { id: 'client-2', name: 'Mala Inc.' },
    { id: 'client-3', name: 'Habari Group' },
    { id: 'client-4', name: 'Tetra Corp.' },
    { id: 'client-5', name: 'Nexus Solutions' },
];

export const tasks: Task[] = [];
