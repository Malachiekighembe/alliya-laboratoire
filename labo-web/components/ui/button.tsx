import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D9597]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#07122E] text-white hover:bg-[#0B172C] shadow-sm",
        destructive: "bg-red-600/90 text-white hover:bg-red-600 shadow-sm",
        outline: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
        secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200/80",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        link: "text-[#07122E] underline-offset-4 hover:underline",
        "alliya-dark": "bg-[#07122E] text-white hover:bg-[#0B172C] shadow-sm",
        "alliya-dark-outline": "border border-[#07122E]/20 bg-transparent text-[#07122E] hover:bg-[#07122E]/5",
        "alliya-dark-ghost": "text-[#07122E] hover:bg-[#07122E]/5",
        "alliya-turquoise": "bg-[#3D9597] text-white hover:bg-[#2E7A7C] shadow-sm",
        "alliya-turquoise-outline": "border border-[#3D9597]/40 bg-transparent text-[#2E7A7C] hover:bg-[#3D9597]/10",
        turquoise: "bg-[#3D9597] text-white hover:bg-[#2E7A7C] shadow-sm",
        success: "bg-[#3D9597]/15 text-[#2E7A7C] hover:bg-[#3D9597]/25 border border-[#3D9597]/30",
        warning: "bg-amber-100 text-amber-800 hover:bg-amber-200/80 border border-amber-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-xl px-6",
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
