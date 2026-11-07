import * as React from "react";
import { cn } from "../../lib/utils";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "info" | "alliya-dark" | "alliya-turquoise";
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-background border-border text-foreground",
      destructive:
        "bg-destructive/50 border-destructive/20 text-destructive",
      info: "bg-info/50 border-info/20 text-info",
      "alliya-dark":
        "bg-alliya-dark-50 border-alliya-dark-200 text-alliya-dark-700",
      "alliya-turquoise":
        "bg-alliya-turquoise-50 border-alliya-turquoise-200 text-alliya-turquoise-700",
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "rounded-lg border p-4",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Alert.displayName = "Alert";

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-sm font-semibold", className)}
      {...props}
    />
  )
);
AlertTitle.displayName = "AlertTitle";

interface AlertDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  AlertDescriptionProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };

// Helper for Alliya dark alert
export function AlliyaDarkAlert({
  title,
  description,
  className,
  ...props
}: {
  title?: string;
  description?: string;
  className?: string;
} & React.ComponentPropsWithoutRef<typeof Alert>) {
  return (
    <Alert
      variant="alliya-dark"
      className={className}
      {...props}
    >
      {title && <AlertTitle className="text-alliya-dark-800">{title}</AlertTitle>}
      {description && (
        <AlertDescription className="text-alliya-dark-700">{description}</AlertDescription>
      )}
    </Alert>
  );
}

// Helper for Alliya turquoise alert
export function AlliyaTurquoiseAlert({
  title,
  description,
  className,
  ...props
}: {
  title?: string;
  description?: string;
  className?: string;
} & React.ComponentPropsWithoutRef<typeof Alert>) {
  return (
    <Alert
      variant="alliya-turquoise"
      className={className}
      {...props}
    >
      {title && <AlertTitle className="text-alliya-turquoise-800">{title}</AlertTitle>}
      {description && (
        <AlertDescription className="text-alliya-turquoise-700">{description}</AlertDescription>
      )}
    </Alert>
  );
}