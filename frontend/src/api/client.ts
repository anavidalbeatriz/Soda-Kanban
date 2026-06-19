import axios from "axios";
import type {
  Board,
  BoardDetail,
  Card,
  Comment,
  Invitation,
  NotificationPreference,
  TokenResponse,
  User,
  Workspace,
  WorkspaceMember,
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post<TokenResponse>(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          localStorage.clear();
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (payload: { email: string; password: string; name: string; invite_token?: string }) =>
    api.post<TokenResponse>("/auth/register", payload),
  login: (payload: { email: string; password: string }) =>
    api.post<TokenResponse>("/auth/login", payload),
  logout: () => api.post("/auth/logout", { refresh_token: localStorage.getItem("refresh_token") }),
};

export const userApi = {
  me: () => api.get<User>("/users/me"),
  updateMe: (payload: { name?: string; phone?: string | null }) =>
    api.patch<User>("/users/me", payload).then((r) => r.data),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<User>("/users/me/avatar", formData, {
      headers: { "Content-Type": undefined },
    }).then((r) => r.data);
  },
  fetchAvatar: () => api.get<Blob>("/users/me/avatar", { responseType: "blob" }).then((r) => r.data),
  getNotificationPreferences: () =>
    api.get<NotificationPreference[]>("/users/me/notification-preferences"),
  updateNotificationPreferences: (preferences: NotificationPreference[]) =>
    api.patch<NotificationPreference[]>("/users/me/notification-preferences", { preferences }),
};

export const workspaceApi = {
  list: () => api.get<Workspace[]>("/workspaces"),
  create: (name: string) => api.post<Workspace>("/workspaces", { name }),
  delete: (workspaceId: string) => api.delete(`/workspaces/${workspaceId}`),
  boards: (workspaceId: string) => api.get<Board[]>(`/workspaces/${workspaceId}/boards`),
  createBoard: (workspaceId: string, name: string, visibility = "team") =>
    api.post<Board>(`/workspaces/${workspaceId}/boards`, { name, visibility }),
  members: (workspaceId: string) =>
    api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`),
  updateMember: (workspaceId: string, memberId: string, role: "admin" | "member") =>
    api.patch<WorkspaceMember>(`/workspaces/${workspaceId}/members/${memberId}`, { role }),
  removeMember: (workspaceId: string, memberId: string) =>
    api.delete(`/workspaces/${workspaceId}/members/${memberId}`),
  createInvitation: (workspaceId: string, email?: string, boardId?: string) =>
    api.post<Invitation>(`/workspaces/${workspaceId}/invitations`, { email, board_id: boardId }),
  listInvitations: (workspaceId: string) =>
    api.get<Invitation[]>(`/workspaces/${workspaceId}/invitations`),
  revokeInvitation: (workspaceId: string, invitationId: string) =>
    api.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`),
};

export const boardApi = {
  detail: (boardId: string) => api.get<BoardDetail>(`/boards/${boardId}/detail`),
  update: (boardId: string, payload: Partial<Board>) => api.patch<Board>(`/boards/${boardId}`, payload),
  deleteBoard: (boardId: string) => api.delete(`/boards/${boardId}`),
  createCard: (listId: string, payload: Partial<Card> & { title: string }) =>
    api.post<Card>(`/lists/${listId}/cards`, payload),
  updateCard: (cardId: string, payload: Partial<Card>) =>
    api.patch<Card>(`/cards/${cardId}`, payload),
  moveCard: (cardId: string, listId: string, position: number) =>
    api.patch<Card>(`/cards/${cardId}/move`, { list_id: listId, position }),
  deleteCard: (cardId: string) => api.delete(`/cards/${cardId}`),
  comments: (cardId: string) => api.get<Comment[]>(`/cards/${cardId}/comments`),
  addComment: (cardId: string, content: string) =>
    api.post<Comment>(`/cards/${cardId}/comments`, { content }),
};
