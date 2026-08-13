export type Role = 'student' | 'institution' | 'admin';

export interface User {
  id: number;
  email: string;
  role: Role;
  name: string;
  department?: string;
}

export interface Complaint {
  id: number;
  student_id: number;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  photo_url?: string;
  status: 'Registered' | 'Under Review' | 'Action In Progress' | 'Action Taken';
  response?: string;
  rating?: number;
  is_viewed?: number;
  viewed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Analytics {
  total: number;
  byStatus: { status: string; count: number }[];
  byCategory?: { category: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}
