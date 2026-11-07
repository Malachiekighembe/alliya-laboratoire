import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

// Alliya palette constants
const ALLIYA_DARK = "#07122E";
const ALLIYA_DARK_700 = "#1E2A47";
const ALLIYA_DARK_800 = "#14203A";
const ALLIYA_TURQUOISE = "#3D9597";
const ALLIYA_TURQUOISE_600 = "#2E7A7C";
const ALLIYA_TURQUOISE_50 = "#E3F2F2";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: `bg-[#${ALLIYA_DARK.slice(1)}] text-white hover:bg-[#${ALLIYA_DARK_700.slice(1)}] hover:text-white shadow-sm`,
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Variantes bleu Alliya (alliya-dark - palette Commerce)
        "alliya-dark": `bg-[#${ALLIYA_DARK_700.slice(1)}] text-white hover:bg-[#${ALLIYA_DARK_800.slice(1)}] hover:text-white shadow-sm border border-[#${ALLIYA_DARK_700.slice(1)}]`,
        "alliya-dark-outline": `border-[#${ALLIYA_DARK_700.slice(1)}] bg-transparent text-[#${ALLIYA_DARK_700.slice(1)}] hover:bg-[#${ALLIYA_TURQUOISE_50.slice(1)}] hover:text-[#${ALLIYA_DARK_800.slice(1)}]`,
        "alliya-dark-ghost": `text-[#${ALLIYA_DARK_700.slice(1)}] hover:bg-[#${ALLIYA_TURQUOISE_50.slice(1)}] hover:text-[#${ALLIYA_DARK_800.slice(1)}]`,
        // Variante turquoise Alliya (accent)
        "alliya-turquoise": `bg-[#${ALLIYA_TURQUOISE.slice(1)}] text-[#${ALLIYA_DARK.slice(1)}] hover:bg-[#${ALLIYA_TURQUOISE_600.slice(1)}] hover:text-[#${ALLIYA_DARK.slice(1)}] shadow-sm border border-[#${ALLIYA_TURQUOISE.slice(1)}]`,
        "alliya-turquoise-outline": `border-[#${ALLIYA_TURQUOISE.slice(1)}] bg-transparent text-[#${ALLIYA_TURQUOISE.slice(1)}] hover:bg-[#${ALLIYA_TURQUOISE_50.slice(1)}] hover:text-[#${ALLIYA_TURQUOISE.slice(1)}]`,
        // Variantes utilitaires
        turquoise: `bg-[#${ALLIYA_TURQUOISE.slice(1)}] text-[#${ALLIYA_DARK.slice(1)}] hover:bg-[#${ALLIYA_TURQUOISE_600.slice(1)}] shadow-sm border border-[#${ALLIYA_TURQUOISE.slice(1)}]`,
        success: "bg-green-500 text-white hover:bg-green-600 shadow-sm border border-green-400",
        warning: "bg-yellow-500 text-[#07122E] hover:bg-yellow-600 shadow-sm border border-yellow-400",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
