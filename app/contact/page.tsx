"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "../../components/layout/Footer";
import { motion } from "framer-motion";
import { Calendar, Mail, Send } from "lucide-react";

const BOOK_DEMO_URL = "https://cal.com/hydrilla";
const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app").replace(/\/+$/, "");

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
      setForm({ full_name: "", work_email: "", company: "", use_case: "", studio_size: "", message: "" });
    } catch {
      setError("Failed to send message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="w-full bg-white pt-[8rem] pb-12 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="m-0 mb-4 text-[#111] font-bold tracking-tight"
            style={{
              fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              letterSpacing: "-0.045em",
              lineHeight: 1.08,
            }}
          >
            Contact Us
          </h1>
          <p
            className="mx-auto max-w-[520px] m-0 text-[#6b6966] leading-relaxed"
            style={{
              fontFamily: "'DM Sans', Arial, sans-serif",
              fontSize: "1.0625rem",
            }}
          >
            Have questions about Hydrilla or want to integrate it into your production workflow?
            Send us a message and our team will respond shortly.
          </p>
        </motion.div>
      </section>

      {/* Form + Two cards in one section */}
      <section className="w-full px-4 sm:px-6 pb-24 max-w-6xl mx-auto">
        {/* Contact Form */}
        <div className="mb-16">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-[#11111114] bg-white p-8 sm:p-10 text-center shadow-sm"
            >
              <p className="text-lg font-semibold text-[#111] m-0 mb-2">Message sent!</p>
              <p className="text-[#6b6966] m-0">
                Thanks for reaching out. We&apos;ll get back to you at <strong>{submittedEmail}</strong> shortly.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="rounded-2xl border border-[#11111114] bg-white p-6 sm:p-8 shadow-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-[#444] mb-1.5">
                    Full Name <span className="text-[#3b8ee8]">*</span>
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    placeholder="John Carter"
                    value={form.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-[#1111111a] bg-[#11111102] text-[#111] placeholder:text-[#999] focus:outline-none focus:border-[#3b8ee8] focus:ring-2 focus:ring-[#3b8ee81a] transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="work_email" className="block text-sm font-medium text-[#444] mb-1.5">
                    Work Email <span className="text-[#3b8ee8]">*</span>
                  </label>
                  <input
                    id="work_email"
                    name="work_email"
                    type="email"
                    required
                    placeholder="john@studio.com"
                    value={form.work_email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-[#1111111a] bg-[#11111102] text-[#111] placeholder:text-[#999] focus:outline-none focus:border-[#3b8ee8] focus:ring-2 focus:ring-[#3b8ee81a] transition-all"
                  />
                </div>
              </div>

              <div className="mt-4 sm:mt-5">
                <label htmlFor="company" className="block text-sm font-medium text-[#444] mb-1.5">
                  Company / Studio Name <span className="text-[#888]">(optional)</span>
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  placeholder="PixelForge Studio"
                  value={form.company}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-[#1111111a] bg-[#11111102] text-[#111] placeholder:text-[#999] focus:outline-none focus:border-[#3b8ee8] focus:ring-2 focus:ring-[#3b8ee81a] transition-all"
                />
              </div>

              <div className="mt-4 sm:mt-5">
                <label htmlFor="use_case" className="block text-sm font-medium text-[#444] mb-1.5">
                  Use Case <span className="text-[#3b8ee8]">*</span>
                </label>
                <select
                  id="use_case"
                  name="use_case"
                  required
                  value={form.use_case}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-[#1111111a] bg-[#11111102] text-[#111] focus:outline-none focus:border-[#3b8ee8] focus:ring-2 focus:ring-[#3b8ee81a] transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select use case</option>
                  {USE_CASE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 sm:mt-5">
                <label htmlFor="studio_size" className="block text-sm font-medium text-[#444] mb-1.5">
                  Studio size (employees) <span className="text-[#888]">(optional)</span>
                </label>
                <select
                  id="studio_size"
                  name="studio_size"
                  value={form.studio_size}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-[#1111111a] bg-[#11111102] text-[#111] focus:outline-none focus:border-[#3b8ee8] focus:ring-2 focus:ring-[#3b8ee81a] transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select size</option>
                  {STUDIO_SIZE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 sm:mt-5">
                <label htmlFor="message" className="block text-sm font-medium text-[#444] mb-1.5">
                  Message <span className="text-[#3b8ee8]">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell us about your project, workflow, or how you plan to use Hydrilla."
                  value={form.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-[#1111111a] bg-[#11111102] text-[#111] placeholder:text-[#999] focus:outline-none focus:border-[#3b8ee8] focus:ring-2 focus:ring-[#3b8ee81a] transition-all resize-y"
                />
              </div>

              {error && (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#111] text-white font-semibold hover:bg-[#222] disabled:opacity-60 transition-all"
                >
                  {submitting ? "Sending…" : "Send Message"}
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.form>
          )}
        </div>

        {/* Book meeting + Email cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
          style={{ alignItems: "stretch" }}
        >
          <motion.a
            href={BOOK_DEMO_URL}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center justify-center gap-5 p-8 rounded-2xl border border-[#11111114] bg-white shadow-sm no-underline text-inherit hover:border-[#11111122] hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <span className="w-16 h-16 rounded-2xl bg-[#3b8ee81a] flex items-center justify-center text-[#3b8ee8]">
              <Calendar size={28} strokeWidth={2} />
            </span>
            <h2 className="m-0 text-xl font-bold text-[#111] text-center tracking-tight">
              Book a meeting
            </h2>
            <p className="m-0 text-[#6b6966] text-center text-[0.9375rem] leading-relaxed">
              Schedule a demo or call with our team. Pick a time that works for you.
            </p>
            <span className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#111] text-white text-[0.9375rem] font-semibold">
              Book Demo
            </span>
          </motion.a>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-[#11111114] bg-[#fafaf9] shadow-sm"
          >
            <span className="w-16 h-16 rounded-2xl bg-[#1111110f] flex items-center justify-center text-[#111]">
              <Mail size={28} strokeWidth={2} />
            </span>
            <h2 className="m-0 text-lg font-semibold text-[#11111199] text-center tracking-tight">
              Or email us
            </h2>
            <a
              href="mailto:founders@hydrilla.ai"
              className="text-[#111] font-bold no-underline hover:text-[#3b8ee8] transition-colors text-center"
              style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", letterSpacing: "-0.02em" }}
            >
              founders@hydrilla.ai
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
