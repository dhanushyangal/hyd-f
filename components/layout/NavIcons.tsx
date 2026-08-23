import type { ReactNode } from "react";
import type { NavIconName } from "@/lib/nav";

type IconProps = {
  name: NavIconName;
  className?: string;
};

function Glyph({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className ?? "h-7 w-7 shrink-0"}
    >
      {children}
    </svg>
  );
}

export function NavIcon({ name, className }: IconProps) {
  switch (name) {
    case "text":
      return (
        <Glyph className={className}>
          <rect x="4" y="5" width="24" height="22" rx="6" fill="#EEF2FF" />
          <path d="M10 12h12M10 16.5h8M10 21h10" stroke="#4F6BFF" strokeWidth="2" strokeLinecap="round" />
        </Glyph>
      );
    case "image":
      return (
        <Glyph className={className}>
          <rect x="4" y="6" width="24" height="20" rx="6" fill="#FFF1E6" />
          <circle cx="12" cy="13" r="2.2" fill="#FF8A3D" />
          <path d="M7 22l6.5-6.5 4 4L22 14l3 8H7z" fill="#F97316" />
        </Glyph>
      );
    case "bluefox":
      return (
        <Glyph className={className}>
          <path d="M8 24c0-6 3.4-11 8-11s8 5 8 11" fill="#D9F3EE" />
          <path d="M10 11l6-5 6 5-2.2 3.4H12.2L10 11z" fill="#12B5A0" />
          <circle cx="13.2" cy="18" r="1.15" fill="#0F766E" />
          <circle cx="18.8" cy="18" r="1.15" fill="#0F766E" />
        </Glyph>
      );
    case "features":
      return (
        <Glyph className={className}>
          <rect x="5" y="5" width="10" height="10" rx="3" fill="#7C5CFF" />
          <rect x="17" y="5" width="10" height="10" rx="3" fill="#C4B5FD" />
          <rect x="5" y="17" width="10" height="10" rx="3" fill="#DDD6FE" />
          <rect x="17" y="17" width="10" height="10" rx="3" fill="#5B3DF5" />
        </Glyph>
      );
    case "preview":
      return (
        <Glyph className={className}>
          <circle cx="16" cy="16" r="11" fill="#E8F1FF" />
          <path d="M8 16c2.4-4.4 5.2-6.5 8-6.5S21.6 11.6 24 16c-2.4 4.4-5.2 6.5-8 6.5S10.4 20.4 8 16z" fill="#3B82F6" />
          <circle cx="16" cy="16" r="3.2" fill="#DBEAFE" />
        </Glyph>
      );
    case "export":
      return (
        <Glyph className={className}>
          <rect x="6" y="8" width="20" height="16" rx="4" fill="#ECFDF5" />
          <path d="M16 12v8M16 12l-3 3M16 12l3 3" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Glyph>
      );
    case "api":
      return (
        <Glyph className={className}>
          <rect x="4" y="6" width="24" height="20" rx="6" fill="#F3E8FF" />
          <path d="M12 12l-4 4 4 4M20 12l4 4-4 4" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Glyph>
      );
    case "rigging":
      return (
        <Glyph className={className}>
          <circle cx="16" cy="8" r="3" fill="#FB7185" />
          <path d="M16 11v6M12 24l4-7 4 7M10 16h12" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" />
        </Glyph>
      );
    case "enterprise":
      return (
        <Glyph className={className}>
          <rect x="7" y="8" width="18" height="17" rx="3" fill="#E0E7FF" />
          <path d="M11 25V13h4v12M17 25V16h4v9" fill="#4338CA" />
        </Glyph>
      );
    case "security":
      return (
        <Glyph className={className}>
          <path d="M16 5l10 4v7c0 6.2-4.3 10.4-10 12-5.7-1.6-10-5.8-10-12V9l10-4z" fill="#D1FAE5" />
          <path d="M12.5 16.2l2.4 2.4 4.6-5" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </Glyph>
      );
    case "game":
      return (
        <Glyph className={className}>
          <rect x="4" y="10" width="24" height="14" rx="7" fill="#DBEAFE" />
          <path d="M11 15v6M8 18h6" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
          <circle cx="20" cy="16.5" r="1.3" fill="#F43F5E" />
          <circle cx="23.2" cy="19.2" r="1.3" fill="#F59E0B" />
        </Glyph>
      );
    case "film":
      return (
        <Glyph className={className}>
          <rect x="5" y="8" width="22" height="16" rx="4" fill="#FFE4E6" />
          <path d="M5 12h22M5 20h22M10 8v16M22 8v16" stroke="#E11D48" strokeWidth="1.8" />
        </Glyph>
      );
    case "architecture":
      return (
        <Glyph className={className}>
          <path d="M6 25V14l10-7 10 7v11H6z" fill="#FFEDD5" />
          <path d="M14 25v-7h4v7" fill="#EA580C" />
        </Glyph>
      );
    case "arvr":
      return (
        <Glyph className={className}>
          <rect x="4" y="11" width="24" height="12" rx="6" fill="#EDE9FE" />
          <circle cx="11.5" cy="17" r="3" fill="#7C3AED" />
          <circle cx="20.5" cy="17" r="3" fill="#7C3AED" />
        </Glyph>
      );
    case "product":
      return (
        <Glyph className={className}>
          <path d="M16 5l11 6v10L16 27 5 21V11L16 5z" fill="#FEF3C7" />
          <path d="M16 5v22M5 11l11 6 11-6" stroke="#D97706" strokeWidth="1.6" />
        </Glyph>
      );
    case "studio":
      return (
        <Glyph className={className}>
          <rect x="6" y="10" width="20" height="14" rx="3" fill="#CFFAFE" />
          <circle cx="16" cy="17" r="4" fill="#0E7490" />
          <path d="M12 10l2.5-4h3L20 10" fill="#22D3EE" />
        </Glyph>
      );
    case "startup":
      return (
        <Glyph className={className}>
          <path d="M16 5c4 5 8 8 8 14a8 8 0 11-16 0c0-6 4-9 8-14z" fill="#FDE68A" />
          <path d="M13 20c.8 2 2 3 3 3s2.2-1 3-3" stroke="#B45309" strokeWidth="1.8" strokeLinecap="round" />
        </Glyph>
      );
    case "docs":
      return (
        <Glyph className={className}>
          <path d="M9 5h10l6 6v16H9a3 3 0 01-3-3V8a3 3 0 013-3z" fill="#DBEAFE" />
          <path d="M19 5v6h6" fill="#93C5FD" />
          <path d="M12 16h8M12 20h6" stroke="#1D4ED8" strokeWidth="1.8" strokeLinecap="round" />
        </Glyph>
      );
    case "faq":
      return (
        <Glyph className={className}>
          <circle cx="16" cy="16" r="11" fill="#FEF3C7" />
          <path d="M13 13.2c0-1.7 1.3-3 3-3s3 1.2 3 2.8c0 1.5-1.4 2.2-2.2 2.7-.6.4-.8.8-.8 1.6" stroke="#B45309" strokeWidth="2" strokeLinecap="round" />
          <circle cx="16" cy="22.2" r="1.15" fill="#B45309" />
        </Glyph>
      );
    case "blog":
      return (
        <Glyph className={className}>
          <rect x="6" y="6" width="20" height="20" rx="5" fill="#FCE7F3" />
          <path d="M11 12h10M11 16h10M11 20h6" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" />
        </Glyph>
      );
    case "changelog":
      return (
        <Glyph className={className}>
          <rect x="7" y="5" width="18" height="22" rx="4" fill="#DCFCE7" />
          <path d="M12 12h8M12 16h8M12 20h5" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
        </Glyph>
      );
    case "compare":
      return (
        <Glyph className={className}>
          <rect x="5" y="7" width="9" height="18" rx="3" fill="#E0E7FF" />
          <rect x="18" y="7" width="9" height="18" rx="3" fill="#C7D2FE" />
          <path d="M9.5 13v6M22.5 11v8" stroke="#4338CA" strokeWidth="2" strokeLinecap="round" />
        </Glyph>
      );
    case "about":
      return (
        <Glyph className={className}>
          <circle cx="16" cy="16" r="11" fill="#E0F2FE" />
          <path d="M16 14v7" stroke="#0284C7" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="16" cy="10.5" r="1.3" fill="#0284C7" />
        </Glyph>
      );
    case "team":
      return (
        <Glyph className={className}>
          <circle cx="12" cy="13" r="4" fill="#FBCFE8" />
          <circle cx="21" cy="14" r="3.2" fill="#F9A8D4" />
          <path d="M5 25c.6-4 3.4-6.2 7-6.2S18.4 21 19 25H5z" fill="#DB2777" />
        </Glyph>
      );
    case "careers":
      return (
        <Glyph className={className}>
          <rect x="5" y="12" width="22" height="13" rx="4" fill="#FFE4E6" />
          <path d="M12 12V9.5A4 4 0 0116 5.5 4 4 0 0120 9.5V12" stroke="#E11D48" strokeWidth="2" />
        </Glyph>
      );
    case "contact":
      return (
        <Glyph className={className}>
          <rect x="5" y="8" width="22" height="16" rx="4" fill="#CCFBF1" />
          <path d="M7 11l9 6 9-6" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Glyph>
      );
    case "research":
      return (
        <Glyph className={className}>
          <circle cx="14" cy="14" r="7" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="2" />
          <path d="M19 19l5 5" stroke="#7C3AED" strokeWidth="2.4" strokeLinecap="round" />
        </Glyph>
      );
    case "brand":
      return (
        <Glyph className={className}>
          <circle cx="16" cy="16" r="11" fill="#D1FAE5" />
          <path d="M11 19c1.6-5 4-8 5-8s3.4 3 5 8" fill="#10B981" />
        </Glyph>
      );
    default:
      return null;
  }
}
