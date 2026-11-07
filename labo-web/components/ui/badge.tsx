import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success:
          "border-transparent bg-success/15 text-success",
        warning:
          "border-transparent bg-warning/15 text-warning",
        info:
          "border-transparent bg-info/15 text-info",
        // Badge bleu Alliya (alliya-dark)
        "alliya-dark":
          "border-transparent bg-alliya-dark-100 text-alliya-dark-700",
        "alliya-dark-outline":
          "border-alliya-dark-200 bg-transparent text-alliya-dark-700",
        // Badge turquoise Alliya
        "alliya-turquoise":
          "border-transparent bg-alliya-turquoise-100 text-alliya-turquoise-700",
        "alliya-turquoise-outline":
          "border-alliya-turquoise-200 bg-transparent text-alliya-turquoise-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };