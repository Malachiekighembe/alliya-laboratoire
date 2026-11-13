import * as React from "react";
import Link from "next/link";
import { cn } from "../../lib/utils";

// Alliya palette constants
const ALLIYA_TURQUOISE = "#3D9597";
const ALLIYA_TURQUOISE_700_TEXT = "#07122E";
const ALLIYA_DARK_800 = "#14203A";
const ALLIYA_DARK_700_TEXT = "#1E2A47";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  variant?: "default" | "turquoise" | "alliya-dark" | "alliya-turquoise" | "success" | "warning" | "outline";
  /** Rend la carte cliquable vers une page de détail. */
  href?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  variant = "default",
  className,
  href,
  ...props
}: StatCardProps) {
  const accent = {
    default: `border-l-[#${ALLIYA_TURQUOISE.slice(1)}] text-[#${ALLIYA_TURQUOISE_700_TEXT.slice(1)}]`,
    turquoise: `border-l-[#${ALLIYA_TURQUOISE.slice(1)}] text-[#${ALLIYA_TURQUOISE_700_TEXT.slice(1)}]`,
    "alliya-turquoise": `border-l-[#${ALLIYA_TURQUOISE.slice(1)}] text-[#${ALLIYA_TURQUOISE_700_TEXT.slice(1)}]`,
    blue: `border-l-[#${ALLIYA_DARK_800.slice(1)}] text-[#${ALLIYA_DARK_700_TEXT.slice(1)}]`,
    "alliya-dark": `border-l-[#${ALLIYA_DARK_800.slice(1)}] text-[#${ALLIYA_DARK_700_TEXT.slice(1)}]`,
    success: "border-l-[#3D9597] text-[#2E7A7C]",
    warning: "border-l-yellow-500 text-yellow-700",
    outline: "border-l-input text-muted-foreground",
  }[variant];

  const classes = cn(
    "rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md",
    "border-l-4",
    accent,
    href &&
      "block cursor-pointer hover:-translate-y-0.5 hover:border-[#3D9597]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D9597]/40 focus-visible:ring-offset-2",
    className
  );

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p className={cn("mt-1 text-xs", trend.value >= 0 ? "text-[#2E7A7C]" : "text-red-500")}>
              {trend.value >= 0 ? "▲" : "▼"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <div className={classes} {...props}>
      {content}
    </div>
  );
}
