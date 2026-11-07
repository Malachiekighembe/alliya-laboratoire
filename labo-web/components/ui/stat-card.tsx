import * as React from "react";
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
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  variant = "default",
  className,
  ...props
}: StatCardProps) {
  const accent = {
    default: `border-l-[#${ALLIYA_TURQUOISE.slice(1)}] text-[#${ALLIYA_TURQUOISE_700_TEXT.slice(1)}]`,
    turquoise: `border-l-[#${ALLIYA_TURQUOISE.slice(1)}] text-[#${ALLIYA_TURQUOISE_700_TEXT.slice(1)}]`,
    "alliya-turquoise": `border-l-[#${ALLIYA_TURQUOISE.slice(1)}] text-[#${ALLIYA_TURQUOISE_700_TEXT.slice(1)}]`,
    blue: `border-l-[#${ALLIYA_DARK_800.slice(1)}] text-[#${ALLIYA_DARK_700_TEXT.slice(1)}]`,
    "alliya-dark": `border-l-[#${ALLIYA_DARK_800.slice(1)}] text-[#${ALLIYA_DARK_700_TEXT.slice(1)}]`,
    success: "border-l-green-500 text-green-700",
    warning: "border-l-yellow-500 text-yellow-700",
    outline: "border-l-input text-muted-foreground",
  }[variant];

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md",
        "border-l-4",
        accent,
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <p className={cn("mt-1 text-xs", trend.value >= 0 ? "text-green-700" : "text-red-700")}>
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
    </div>
  );
}
