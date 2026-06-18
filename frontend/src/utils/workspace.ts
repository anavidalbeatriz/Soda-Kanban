import type { User } from "../types";

export function workspaceHomePath(user: User | null): string {
  if (user?.workspace_id) {
    return `/workspaces/${user.workspace_id}`;
  }
  return "/";
}
