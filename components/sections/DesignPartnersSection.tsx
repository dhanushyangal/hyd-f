"use client";

import React from "react";
import { DESCRIPTION_WEIGHT, GEIST_FONT, SANS_FONT, SECTION_WEIGHT } from "@/lib/fonts";

export default function DesignPartnersSection() {
  return (
    <section className="relative w-full bg-white border-t border-neutral-100 py-12 sm:py-14 md:py-16 px-4 sm:px-6 md:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <p
          className="text-xs font-medium uppercase tracking-widest text-neutral-400 mb-4"
          style={{ fontFamily: SANS_FONT, fontWeight: SECTION_WEIGHT }}
        >
          Design partners
        </p>
        <p
          className="text-neutral-600 text-sm leading-6 sm:text-base sm:leading-7"
          style={{ fontFamily: GEIST_FONT, fontWeight: DESCRIPTION_WEIGHT }}
        >
          Studios and teams building production workflows with Hydrilla.
        </p>
      </div>
    </section>
  );
}
