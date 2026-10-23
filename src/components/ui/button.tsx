import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/30 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-navy-950 text-white shadow-sm hover:bg-navy-900",
        primary: "bg-navy-950 text-white shadow-sm hover:bg-navy-900",
        gold: "bg-gold-500 text-white shadow-sm hover:bg-gold-600 focus-visible:ring-gold-500/30",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-slate-300 bg-white text-navy-950 hover:border-gold-500 hover:bg-gold-50/30 hover:text-gold-600",
        secondary:
          "border border-navy-100 bg-navy-50 text-navy-950 hover:bg-navy-100",
        ghost: "text-slate-700 hover:bg-slate-100 hover:text-navy-950",
        link: "text-navy-950 underline-offset-4 hover:text-gold-600 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2 text-sm rounded-lg",
        sm: "h-9 rounded-lg px-3.5 text-xs",
        lg: "h-13 rounded-xl px-7 text-base font-semibold",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
