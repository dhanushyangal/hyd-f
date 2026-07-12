"use client";

import React from "react";

export default function DesignPartnersSection() {
  return (
    <section className="relative w-full bg-white border-t border-neutral-100 py-12 sm:py-14 md:py-16 px-4 sm:px-6 md:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <p
          className="text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-4"
          style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
        >
          Design partners
        </p>
        <p
          className="text-neutral-600 text-sm sm:text-base"
          style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
        >
          Studios and teams building production workflows with Hydrilla.
        </p>
      </div>
    </section>
  );
}
