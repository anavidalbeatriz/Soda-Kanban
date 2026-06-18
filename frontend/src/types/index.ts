export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  workspace_id: string | null;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  user_id: string;
  role: string;
  user: User;
}

export interface Board {
  id: string;
  workspace_id: string;
  name: string;
  visibility: "private" | "team" | "public";
  position: number;
  created_at: string;
}

export interface BoardList {
  id: string;
  board_id: string;
  name: string;
  position: number;
}

export interface Card {
  id: string;
  list_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  card_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author: User;
}

export interface BoardDetail {
  board: Board;
  lists: BoardList[];
  cards: Card[];
}

export interface NotificationPreference {
  event_type: string;
  email_enabled: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface BoardEvent {
  type: string;
  card_id?: string;
  list_id?: string;
  position?: number;
  actor_id?: string;
}
