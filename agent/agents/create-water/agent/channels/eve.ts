import { eveChannel } from "eve/channels/eve";
import { localDev, vercelOidc } from "eve/channels/auth";

/**
 * Inbound surface for the Water orchestrator.
 *
 * No `placeholderAuth()`: this agent orchestrates runs that use a customer's BYOK key held in
 * the Hydrilla backend, so its only legitimate caller is that backend. `vercelOidc()` covers
 * Hydrilla's own deployments and `localDev()` covers `eve dev`.
 */
export default eveChannel({
  auth: [vercelOidc(), localDev()],
});
