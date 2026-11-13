import * as React from "react";
import Link from "next/link";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Rend la carte cliquable (navigation). */
  href?: string;
}

const cardBase =
  "rounded-lg border border-border bg-card text-card-foreground shadow-sm";

const interactive =
  "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3D9597]/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D9597]/40 focus-visible:ring-offset-2 active:translate-y-0";

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, href, onClick, children, ...props }, ref) => {
    if (href) {
      return (
        <Link
          href={href}
          className={cn(cardBase, interactive, "block", className)}
          {...(props as any)}
        >
          {children}
        </Link>
      );
    }

    const clickable = typeof onClick === "function";

    return (
      <div
        ref={ref}
        onClick={onClick}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={
          clickable
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onClick?.(event as any);
                }
              }
            : undefined
        }
        className={cn(cardBase, clickable && interactive, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };