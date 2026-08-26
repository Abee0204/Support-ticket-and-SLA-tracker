export type Role = "USER" | "AGENT";
export type Priority = "LOW" | "MEDIUM" | "HIGH";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type SLAStatus = "ON_TRACK" | "AT_RISK" | "BREACHED";

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface AuthPayload {
  token: string;
  user: User;
}

export interface Comment {
  id: string;
  message: string;
  createdAt: string;
  ticketId: string;
  userId: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  createdAt: string;
  slaDeadline: string;
  slaStatus: SLAStatus;
  assignedToId: string | null;
  firstResponseAt?: string | null;
  comments?: Comment[];
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}
