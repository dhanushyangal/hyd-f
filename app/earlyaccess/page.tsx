import { redirect } from "next/navigation";

/**
 * Legacy early access route - redirect to pricing.
 */
export default function EarlyAccessPage() {
  redirect("/app/pricing");
}
