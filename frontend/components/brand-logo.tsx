import Link from "next/link";
import { LogoMark } from "./icons";

export function BrandLogo({
  href = "/",
  subtitle,
  compact = false,
  dark = false,
}: {
  href?: string;
  subtitle?: string;
  compact?: boolean;
  dark?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 group">
      <LogoMark className={`h-9 w-9 shrink-0 transition group-hover:scale-105 ${dark ? 'text-[#F5F6F7]' : 'text-[#2B2E33]'}`} />
      {!compact ? (
        <div>
          <span className={`block text-lg font-bold tracking-tight ${dark ? 'text-[#F5F6F7]' : 'text-[#2B2E33]'}`}>
            OpenAssess
          </span>
          {subtitle ? (
            <span className={`block text-xs font-medium ${dark ? 'text-[#C1C4C8]' : 'text-[#7B7F85]'}`}>
              {subtitle}
            </span>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}

