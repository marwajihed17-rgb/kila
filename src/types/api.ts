// API Response Types

export interface User {
  id: string;
  username: string;
  modules: string[];
  role?: string;
  email?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  message?: string;
}

export interface FileAttachment {
  name: string;
  type: string;
  url: string;
  size: number;
}

export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  category?: 'invoice' | 'kdr' | 'ga' | 'kdr invoicing';
  userId?: string;
  files?: FileAttachment[];
}

export interface MessageResponse {
  success: boolean;
  message?: Message;
  botResponse?: Message;
  messages?: Message[];
  error?: string;
}

export interface SheetRow {
  [key: string]: string;
}

export interface SheetsResponse {
  data: SheetRow[];
  timestamp: string;
  rowCount: number;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  status?: number;
}
