import Link from "next/link";
import {
  PickleArticlePage,
  PickleVisualThumb,
  type PickleRelatedItem,
} from "@/components/layout/PicklePage";
import { CONTACT_EMAIL } from "@/lib/brand";

const RELATED: PickleRelatedItem[] = [
  {
    title: "Enterprise",
    subtitle: "BlueFox 1 at studio volume: seats, API concurrency, and custom pipelines.",
    href: "/enterprise",
    date: "Oct 2026",
    author: "Hydrilla Team",
    thumbVariant: "critter-rig",
  },
  {
    title: "Privacy Policy",
    subtitle: "How Hydrilla collects, uses, and protects account and service data.",
    href: "/privacy-policy",
    date: "Jul 14, 2026",
    author: "Hydrilla Legal",
    thumbVariant: "docs-flow",
  },
];

export default function SecurityPage() {
  return (
    <PickleArticlePage
      kicker="Trust"
      kickerHref="/about"
      title="How Hydrilla protects your studio assets"
      subtitle="The keys to your account, how generated meshes stay scoped to your workspace, and how files enter your pipeline."
      date="Oct 1, 2026"
      author="Hydrilla Team"
      heroThumbVariant="privacy-enclave"
      ctaLabel="Contact Security"
      ctaHref={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Security Review / Hydrilla")}`}
      footnote={
        <>
          Need a vendor security review or questionnaire completed? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or read our{" "}
          <Link href="/privacy-policy">Privacy Policy</Link>.
        </>
      }
      relatedItems={RELATED}
    >
      <div className="pickle-text">
        <p>
          Hydrilla is a web studio. You sign in, generate with BlueFox 1, and
          download files you own under the{" "}
          <Link href="/terms-and-conditions">Terms of Service</Link>. This page
          is the public trust and architecture summary for creators and studios.
        </p>
      </div>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">Accounts &amp; session isolation</h2>
        <div className="pickle-text">
          <p>
            Authentication is handled by Clerk. Every session is user-specific
            and scoped by short-lived cryptographic tokens. Workspace,
            generation, and library routes are authenticated and never indexed
            by search engines.
          </p>
          <p>
            When you connect a local DCC plugin (Blender, Unity, Unreal, or
            Godot) via the Studio Bridge, tokens are pushed locally over{" "}
            <code>127.0.0.1:7345</code> or authenticated via a revocable{" "}
            <code>hyd_live_</code> API key that you control in Settings.
          </p>
        </div>
      </section>

      <section className="pickle-section">
        <div className="pickle-head-block">
          <h2 className="pickle-h2">Generated assets &amp; storage</h2>
          <div className="pickle-text">
            <p>
              Generated meshes and PBR maps are stored for your account so you
              can preview, iterate, and export. Starter and Pro keep generated
              assets and exports private to your account or workspace, as stated
              on <Link href="/pricing">Pricing</Link>. We do not sell customer
              assets as a dataset.
            </p>
          </div>
        </div>

        <figure className="pickle-figure">
          <div className="pickle-card-surface">
            <table className="pickle-table">
              <thead>
                <tr>
                  <th>Layer</th>
                  <th>Mechanism</th>
                  <th>Guarantee</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Authentication</th>
                  <td>Clerk JWT + revocable <code>hyd_live_</code> API keys</td>
                  <td>No plaintext passwords or payment cards stored on Hydrilla servers</td>
                </tr>
                <tr>
                  <th>Workspace storage</th>
                  <td>Account-scoped cloud object storage</td>
                  <td>Starter &amp; Pro assets remain private to your workspace</td>
                </tr>
                <tr>
                  <th>Payments</th>
                  <td>Merchant-of-record third-party processor</td>
                  <td>PCI-compliant checkout; card details never touch Hydrilla</td>
                </tr>
                <tr>
                  <th>Local DCC Bridge</th>
                  <td>Loopback <code>127.0.0.1:7345</code></td>
                  <td>Meshes transfer directly into your open Blender or engine session</td>
                </tr>
              </tbody>
            </table>
          </div>
          <figcaption className="pickle-caption">
            How authentication, storage, billing, and DCC transfers are isolated across Hydrilla.
          </figcaption>
        </figure>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">Exports &amp; vendor reviews</h2>
        <div className="pickle-text">
          <p>
            Downloads are standard GLB, FBX, OBJ, and USDZ files you take into
            Unity, Unreal, Blender, or AR viewers. Once exported, those files
            live entirely in your own pipeline and version control.
          </p>
          <p>
            Studios that need a security questionnaire, vendor review, or a
            named contact should email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We answer
            from the architecture facts on this page and the{" "}
            <Link href="/privacy-policy">Privacy Policy</Link> rather than a
            generic marketing PDF.
          </p>
        </div>
      </section>
    </PickleArticlePage>
  );
}
