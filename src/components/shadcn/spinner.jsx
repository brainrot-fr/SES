import { cn } from "@/lib/utils"
import { Loader2Icon } from "lucide-react"

function Spinner({
  className,
  label,
  ...props
}) {
  return (
    <Loader2Icon
      role={label ? "status" : undefined}
      aria-label={label}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
