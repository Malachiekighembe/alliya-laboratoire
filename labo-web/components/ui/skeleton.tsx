"use client";

import * as React from "react";

type SkeletonVariant = "text" | "circle" | "rect" | "line";

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  width?: string | number;
  height?: string | number;
  radius?: string;
}

export function Skeleton({
  variant = "text",
  className,
  width,
  height,
  radius = "0.375rem",
}: SkeletonProps) {
  const base =
    "animate-pulse rounded-md bg-muted border border-dashed border-muted";

  let w = "100%";
  let h = "0.875rem";

  if (variant === "circle") {
    w = typeof width === "string" ? width : "2.5rem";
    h = typeof height === "string" ? height : "2.5rem";
  } else if (variant === "rect") {
    w = typeof width === "string" ? width : "100%";
    h = typeof height === "string" ? height : "3rem";
  } else if (variant === "line") {
    w = typeof width === "string" ? width : "60%";
    h = "0.75rem";
  }

  return (
    <div
      className={[
        base,
        `rounded-[${radius}]`,
        w ? `w-[${w}]` : "",
        h ? `h-[${h}]` : "",
        className ?? "",
      ].filter(Boolean).join(" ")}
    />
  );
}

export function SkeletonText({
  count = 3,
  lastWidth = "40%",
  className,
}: {
  count?: number;
  lastWidth?: string;
  className?: string;
}) {
  return (
    <div className={[ "flex flex-col gap-2", className ?? "" ].filter(Boolean).join(" ")}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton
          key={i}
          variant="line"
          width={i === count - 1 ? lastWidth : "100%"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={[
        "animate-pulse rounded-xl border border-dashed border-muted p-6 bg-muted",
        className ?? "",
      ].filter(Boolean).join(" ")}
    >
      <Skeleton variant="rect" width="100%" height="3rem" />
      <div className="mt-4 space-y-3">
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="50%" />
      </div>
    </div>
  );
}

export function SkeletonTableRow({ className }: { className?: string }) {
  return (
    <tr
      className={[ "animate-pulse border-b border-muted", className ?? "" ].filter(Boolean).join(" ")}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <td key={i} className="px-4 py-3 h-8 bg-muted/50" />
      ))}
    </tr>
  );
}

export function SkeletonStatsGrid({ className }: { className?: string }) {
  return (
    <div className={[ "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className ?? "" ].filter(Boolean).join(" ")}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-xl p-4 bg-muted border border-dashed border-muted">
          <Skeleton variant="circle" width="3rem" height="3rem" />
          <Skeleton variant="text" width="60%" className="mt-3" />
          <Skeleton variant="text" width="30%" className="mt-2" />
        </div>
      ))}
    </div>
  );
}
