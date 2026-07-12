import { PostHog } from "posthog-node";
import { getPostHogHost, getPostHogToken } from "./posthog";

let posthogInstance: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  const token = getPostHogToken();
  if (!token) return null;

  if (!posthogInstance) {
    posthogInstance = new PostHog(token, {
      host: getPostHogHost(),
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogInstance;
}
