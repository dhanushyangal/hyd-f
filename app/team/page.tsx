import Image from "next/image";
import Link from "next/link";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { TEAM_MEMBERS } from "@/lib/team";

export default function TeamPage() {
  return (
    <MarketingPage
      eyebrow="Company"
      title="Team"
      description="The people at Hydrilla and Hawan Research Labs building BlueFox 1."
      formats={false}
      related={[
        { label: "About", href: "/about", hint: "Lab, product, model" },
        { label: "Careers", href: "/careers", hint: "Who we hire" },
        { label: "Research", href: "/research", hint: "Model card" },
      ]}
    >
      <div className="mx-auto max-w-[42rem] px-5 py-14 sm:px-6 sm:py-16">
        <ul className="grid gap-8 sm:grid-cols-2">
          {TEAM_MEMBERS.map((member) => (
            <li key={member.id}>
              <div className="relative aspect-square overflow-hidden bg-neutral-100">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 21rem"
                />
              </div>
              <h2 id={member.id} className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-neutral-950">
                {member.name}
              </h2>
              <p className="mt-1 text-[14px] leading-6 text-neutral-600">
                {member.role}
              </p>
              {member.connect ? (
                <Link
                  href={member.connect}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-[13px] font-semibold text-neutral-950 underline underline-offset-2"
                >
                  LinkedIn
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </MarketingPage>
  );
}
