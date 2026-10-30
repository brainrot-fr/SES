import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/shadcn/spinner"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-transform outline-none active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary-action-background)] text-[var(--primary-action-foreground)] enabled:hover:brightness-95",
        onboarding: "min-w-0 min-h-12 flex-1 justify-center px-4 py-3 font-[inherit] font-semibold text-center enabled:cursor-pointer disabled:cursor-not-allowed max-[25rem]:px-2",
        onboardingOutline: "min-w-0 min-h-12 flex-1 justify-center px-4 py-3 font-[inherit] font-semibold text-center enabled:cursor-pointer disabled:cursor-not-allowed max-[25rem]:px-2 border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        reelAction: "min-w-[52px] min-h-14 flex-col gap-0.5 rounded-[14px] p-0.5 bg-transparent font-[inherit] text-[0.7rem] font-bold text-[var(--reel-fg)] [text-shadow:0_1px_5px_rgb(0_0_0/60%)] enabled:hover:scale-[1.06] active:scale-[0.96] disabled:cursor-wait disabled:opacity-[0.65]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        "destructive-outline": "border border-destructive/45 bg-transparent text-destructive hover:bg-destructive/10",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4",
        xs: "h-11 px-3 text-sm",
        sm: "h-11 px-3 text-sm",
        lg: "h-12 px-6",
        icon: "size-11",
        "icon-xs": "size-11",
        "icon-sm": "size-11",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  busy = false,
  loadingLabel,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
      disabled={busy || props.disabled}
      aria-busy={busy || undefined}
    >
      {busy && <Spinner label={loadingLabel} aria-hidden="true" />}
      {asChild ? <Slot.Slottable>{props.children}</Slot.Slottable> : props.children}
    </Comp>
  )
}

export { Button, buttonVariants }
