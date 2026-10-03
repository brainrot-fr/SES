import { Skeleton } from "@/components/shadcn/skeleton";

export default function Page({
  as: Element = "div",
  width = "app",
  className = "",
  children,
  ...props
}) {
  return (
    <Element
      className={`layout-page layout-page--${width}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </Element>
  );
}

export function AppShellSkeleton({ label, bodyOnly = false }) {
  const body = (
    <div className="mx-auto grid max-w-[var(--content-width)] gap-6 px-[var(--page-gutter)] pt-4">
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-64 w-full" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      ))}
    </div>
  );

  if (bodyOnly) {
    return (
      <div role="status" aria-label={label} className="min-h-dvh bg-background">
        <span className="sr-only">{label}</span>
        {body}
      </div>
    );
  }

  return (
    <div role="status" aria-label={label} className="min-h-dvh bg-background">
      <span className="sr-only">{label}</span>
      <div className="flex h-[var(--header-height)] items-center justify-between px-4">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="h-5 w-28" />
        <Skeleton className="size-11 rounded-full" />
      </div>
      {body}
      <div className="fixed inset-x-0 bottom-[var(--bottom-nav-gap)] mx-auto flex h-16 w-[min(30rem,calc(100vw-24px))] items-center justify-around rounded-[var(--radius-md)] border border-border bg-card p-2 lg:hidden">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="size-9 rounded-full" />
        ))}
      </div>
    </div>
  );
}
