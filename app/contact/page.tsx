"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Calendar, Mail, Send } from "lucide-react";
import {
  PickleArticlePage,
  type PickleRelatedItem,
} from "@/components/layout/PicklePage";

const BOOK_DEMO_URL = "https://cal.com/hydrilla";
const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app"
).replace(/\/+$/, "");

const USE_CASE_OPTIONS = [
  "Game Development",
  "Film / Animation",
  "Architecture / Interiors",
  "AR / VR / XR",
  "Product Visualization",
  "Other",
] as const;

const STUDIO_SIZE_OPTIONS = [
  "1–5",
  "6–15",
  "16–50",
  "51–200",
  "200+",
] as const;

const RELATED: PickleRelatedItem[] = [
  {
    title: "Enterprise",
    subtitle: "Volume credits, shared studio workspaces, and programmatic REST API access.",
    href: "/enterprise",
    date: "Oct 2026",
    author: "Hydrilla Team",
    thumbVariant: "critter-rig",
  },
  {
    title: "Documentation",
    subtitle: "From first prompt in the studio to a production GLB, FBX, OBJ, or USDZ export.",
    href: "/docs",
    date: "Aug 19, 2026",
    author: "Hydrilla Team",
    thumbVariant: "docs-flow",
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({
    full_name: "",
    work_email: "",
    company: "",
    use_case: "",
    studio_size: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setSubmittedEmail(form.work_email);
      setSubmitted(true);
      setForm({
        full_name: "",
        work_email: "",
        company: "",
        use_case: "",
        studio_size: "",
        message: "",
      });
    } catch {
      setError("Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PickleArticlePage
      kicker="Company"
      kickerHref="/about"
      title="Contact Us"
      subtitle="Questions about Hydrilla, a studio pipeline, or a live demo. Send a note or book a time with the founders."
      date="Direct response"
      author="founders@hydrilla.ai"
      relatedItems={RELATED}
    >
      <div style={{ width: "min(600px, 100%)" }}>
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pickle-card-surface text-center"
            style={{ padding: "48px 36px", borderRadius: "32px" }}
          >
            <h2 className="pickle-h3" style={{ width: "100%" }}>
              Message sent
            </h2>
            <p className="pickle-text" style={{ width: "100%", marginTop: "12px" }}>
              Thanks for reaching out. We will get back to you at{" "}
              <strong>{submittedEmail}</strong> shortly.
            </p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="pickle-card-surface"
            style={{ padding: "36px 36px", borderRadius: "32px" }}
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="full_name"
                  className="mb-2 block text-[14px] font-medium text-black"
                >
                  Full Name *
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  placeholder="John Carter"
                  value={form.full_name}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[16px] text-black placeholder:text-black/35 transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="work_email"
                  className="mb-2 block text-[14px] font-medium text-black"
                >
                  Work Email *
                </label>
                <input
                  id="work_email"
                  name="work_email"
                  type="email"
                  required
                  placeholder="john@studio.com"
                  value={form.work_email}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[16px] text-black placeholder:text-black/35 transition-all"
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="company"
                  className="mb-2 block text-[14px] font-medium text-black"
                >
                  Company / Studio <span className="text-black/40">(optional)</span>
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  placeholder="PixelForge Studio"
                  value={form.company}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-[16px] text-black placeholder:text-black/35 transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="studio_size"
                  className="mb-2 block text-[14px] font-medium text-black"
                >
                  Studio size <span className="text-black/40">(optional)</span>
                </label>
                <select
                  id="studio_size"
                  name="studio_size"
                  value={form.studio_size}
                  onChange={handleChange}
                  className="w-full cursor-pointer appearance-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-[16px] text-black transition-all"
                >
                  <option value="">Select size</option>
                  {STUDIO_SIZE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="use_case"
                className="mb-2 block text-[14px] font-medium text-black"
              >
                Primary Use Case *
              </label>
              <select
                id="use_case"
                name="use_case"
                required
                value={form.use_case}
                onChange={handleChange}
                className="w-full cursor-pointer appearance-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-[16px] text-black transition-all"
              >
                <option value="">Select use case</option>
                {USE_CASE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5">
              <label
                htmlFor="message"
                className="mb-2 block text-[14px] font-medium text-black"
              >
                Message *
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                placeholder="Tell us about your project, engine, or how you plan to use Hydrilla."
                value={form.message}
                onChange={handleChange}
                className="w-full resize-y rounded-2xl border border-black/10 bg-white px-4 py-3 text-[16px] text-black placeholder:text-black/35 transition-all"
              />
            </div>

            {error && <p className="mt-3 text-[14px] text-red-600">{error}</p>}

            <div className="mt-7">
              <button
                type="submit"
                disabled={submitting}
                className="pickle-pill-solid disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Send Message"}
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.form>
        )}
      </div>

      {/* 2-column cards matching Pickle Research grid proportions */}
      <div
        className="pickle-research-grid"
        style={{ width: "100%", marginTop: 0 }}
      >
        <a
          href={BOOK_DEMO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col justify-between rounded-[28px] bg-[#f5f5f7] p-8 no-underline transition-colors hover:bg-[#ededf0]"
        >
          <div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
              <Calendar size={22} strokeWidth={1.8} />
            </span>
            <h2 className="mt-6 mb-0 text-[26px] font-medium tracking-[-0.26px] text-black">
              Book a meeting
            </h2>
            <p className="mt-2 mb-0 text-[17px] italic leading-[1.45] text-black/50">
              Schedule a 1-on-1 demo or pipeline walkthrough with our founders.
            </p>
          </div>
          <span className="mt-7 inline-flex items-center text-[15px] font-medium text-black underline underline-offset-4">
            Open calendar →
          </span>
        </a>

        <a
          href="mailto:founders@hydrilla.ai"
          className="flex flex-col justify-between rounded-[28px] bg-[#f5f5f7] p-8 no-underline transition-colors hover:bg-[#ededf0]"
        >
          <div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
              <Mail size={22} strokeWidth={1.8} />
            </span>
            <h2 className="mt-6 mb-0 text-[26px] font-medium tracking-[-0.26px] text-black">
              Direct email
            </h2>
            <p className="mt-2 mb-0 text-[17px] italic leading-[1.45] text-black/50">
              Write straight to the founders for enterprise, API, or press inquiries.
            </p>
          </div>
          <span className="mt-7 inline-flex items-center text-[15px] font-medium text-black underline underline-offset-4">
            founders@hydrilla.ai →
          </span>
        </a>
      </div>
    </PickleArticlePage>
  );
}
