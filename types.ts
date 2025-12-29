
export type LeadStatus = 'Open' | 'Won' | 'Lost';
export type ActivityType = 'Note' | 'Call' | 'Email' | 'Meeting' | 'Automation';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Company {
  id: string;
  name: string;
  segment?: string;
  size?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  date: string;
  owner: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  priority: TaskPriority;
}

export interface Pipeline {
  id: string;
  name: string;
}

export interface SaleRecord {
  id: string;
  date: string;
  amount: number;
  status: LeadStatus;
  stage: string;
  owner: string;
  pipelineId: string;
  commercialName: string; // Mapeia para Company Name
  source: 'Facebook' | 'Instagram' | 'Meta Ads' | 'Google' | 'Direct';
  
  // Relacionamentos estendidos
  contact?: Contact;
  activities: Activity[];
  tasks: Task[];
  tags: string[];
  score: number;
}

export type TimePeriod = 'Last 7 Days' | 'Last 30 Days' | 'Last 60 Days' | 'Year to Date';
export type ViewMode = 'dashboard' | 'leads' | 'settings' | 'tasks';
