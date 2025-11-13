import { PlaceHolderImages } from './placeholder-images';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  avatar: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Overdue';
  priority: 'Low' | 'Medium' | 'High';
  deadline: string;
  assigneeId: string;
  progressNotes: { note: string; date: string }[];
};

const userAvatars: Record<string, string> = PlaceHolderImages.reduce((acc, img) => {
    acc[img.id] = img.imageUrl;
    return acc;
}, {} as Record<string, string>);

const initialUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@officeflow.com',
    role: 'admin',
    avatar: userAvatars['user-avatar-1'] || '',
  },
  {
    id: '2',
    name: 'Alice Johnson',
    email: 'alice@officeflow.com',
    role: 'employee',
    avatar: userAvatars['user-avatar-2'] || '',
  },
  {
    id: '3',
    name: 'Bob Williams',
    email: 'bob@officeflow.com',
    role: 'employee',
    avatar: userAvatars['user-avatar-3'] || '',
  },
  {
    id: '4',
    name: 'Charlie Brown',
    email: 'charlie@officeflow.com',
    role: 'employee',
    avatar: userAvatars['user-avatar-4'] || '',
  },
];

export const tasks: Task[] = [
  {
    id: 'TASK-8782',
    title: 'Develop new client reporting feature',
    description: 'Create a new feature that allows admins to generate PDF reports for clients. This should include AI-powered summaries.',
    status: 'In Progress',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString(),
    assigneeId: '2',
    progressNotes: [{ note: 'Initial setup and component creation complete.', date: new Date().toISOString() }],
  },
  {
    id: 'TASK-7821',
    title: 'Update UI Kit to v2.0',
    description: 'Update all components in the UI kit to match the new design specifications.',
    status: 'To Do',
    priority: 'Medium',
    deadline: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString(),
    assigneeId: '2',
    progressNotes: [],
  },
  {
    id: 'TASK-4533',
    title: 'Fix login authentication bug',
    description: 'Users are reporting being unable to log in on Safari. Investigate and deploy a fix.',
    status: 'Done',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    assigneeId: '3',
    progressNotes: [{ note: 'Identified issue with Safari cookie policy. Deployed a patch.', date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString() }],
  },
  {
    id: 'TASK-9812',
    title: 'Prepare Q3 financial projections',
    description: 'Gather all financial data and prepare the projection report for the next quarter.',
    status: 'To Do',
    priority: 'Medium',
    deadline: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
    assigneeId: '4',
    progressNotes: [],
  },
  {
    id: 'TASK-5545',
    title: 'Onboard new marketing intern',
    description: 'Create an onboarding plan and guide the new intern through their first week.',
    status: 'In Progress',
    priority: 'Low',
    deadline: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString(),
    assigneeId: '3',
    progressNotes: [{ note: 'Onboarding plan created. First day activities completed.', date: new Date().toISOString() }],
  },
    {
    id: 'TASK-3214',
    title: 'Client Meeting Preparation',
    description: 'Prepare presentation slides for the upcoming meeting with Client X.',
    status: 'Overdue',
    priority: 'High',
    deadline: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    assigneeId: '2',
    progressNotes: [],
  },
];


let allUsers = [...initialUsers];

export const addUser = (user: User) => {
    allUsers.push(user);
    // Also add to the login list
    users.push(user);
}

export const getUsers = () => {
    return allUsers;
}

// This is used by the login page
export let users = [...initialUsers];

export let allTasks = [...tasks];

export const addTask = (task: Task) => {
    allTasks.unshift(task);
}
