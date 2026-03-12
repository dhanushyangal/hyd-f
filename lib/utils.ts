import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** SessionStorage key for the current workspace ID (URL shows /workspace only) */
export const WORKSPACE_CURRENT_ID_KEY = "workspace_current_id";

export function setCurrentWorkspaceId(id: string): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(WORKSPACE_CURRENT_ID_KEY, id);
  }
}

export function getCurrentWorkspaceId(): string | null {
  if (typeof window !== "undefined") {
    return window.sessionStorage.getItem(WORKSPACE_CURRENT_ID_KEY);
  }
  return null;


  
}


