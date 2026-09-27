import { eveChannel } from "eve/channels/eve";
import { localDev, vercelOidc } from "eve/channels/auth";

/**
 * Inbound surface for the Cloud orchestrator.
 *
 * There is deliberately no `placeholderAuth()` here. This agent is internal machinery that
 * spends GPU credits on a customer's behalf — it is called by Hydrilla's backend, never by a
 * browser — so a placeholder that "will not allow browser requests in production" would
 * describe a surface that should not exist at all. `vercelOidc()` covers Hydrilla's own
 * deployments and `localDev()` covers `eve dev`.
 */
export default eveChannel({
  auth: [vercelOidc(), localDev()],
});
