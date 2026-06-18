import type { User } from "../types";

export function workspaceHomePath(_user: User | null): string {
  return "/";
}
