import posthog from "posthog-js";
import { getPostHogHost, getPostHogToken } from "./lib/posthog";

const token = getPostHogToken();

if (token) {
  posthog.init(token, {
    api_host: getPostHogHost(),
    defaults: "2026-01-30",
    person_profiles: "identified_only",
  });
}
