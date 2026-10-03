import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
} from "react";

const SheetContext = createContext(null);
const TabsContext = createContext(null);

function containsSheetDescription(children) {
  return Children.toArray(children).some((child) => (
    isValidElement(child) &&
    (child.type === SheetDescription || containsSheetDescription(child.props.children))
  ));
}

const buttonVariants = {
  default: "bg-primary text-on-primary [@media(hover:hover)]:hover:bg-primary/90",
  destructive: "bg-danger text-on-danger [@media(hover:hover)]:hover:bg-danger/90",
  outline: "border border-border bg-background text-body [@media(hover:hover)]:hover:bg-surface-2",
  secondary: "bg-surface-2 text-body [@media(hover:hover)]:hover:bg-surface-3",
  ghost: "bg-transparent text-body [@media(hover:hover)]:hover:bg-surface-2",
  link: "bg-transparent text-primary underline-offset-4 [@media(hover:hover)]:hover:underline",
};

const buttonSizes = {
  default: "min-h-11 px-4 py-2",
  sm: "min-h-11 px-3 text-sm",
  lg: "min-h-12 px-6",
  icon: "size-11 p-0",
};

export function Button({
  variant = "default",
  size = "default",
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] motion-reduce:active:scale-100 ${buttonVariants[variant] ?? buttonVariants.default} ${buttonSizes[size] ?? buttonSizes.default} ${className}`}
      {...props}
    />
  );
}

export function Sheet({ open, onOpenChange, children }) {
  const titleId = useId();
  const descriptionId = useId();
  return (
    <SheetContext.Provider value={{ open, onOpenChange, titleId, descriptionId }}>
      {children}
    </SheetContext.Provider>
  );
}

export function SheetContent({
  side = "bottom",
  className = "",
  children,
  ...props
}) {
  const context = useContext(SheetContext);
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (context?.open && !dialog.open) dialog.showModal();
    else if (!context?.open && dialog.open) dialog.close();
  }, [context?.open]);

  if (!context) throw new Error("SheetContent must be used inside Sheet.");

  const sideClasses = {
    top: "inset-x-0 top-0 max-h-[90dvh] w-full max-w-2xl rounded-b-[var(--radius-lg)] border-t-0",
    bottom: "inset-x-0 bottom-0 max-h-[90dvh] w-full max-w-2xl rounded-t-[var(--radius-lg)] border-b-0",
    left: "inset-y-0 left-0 h-dvh w-[min(20rem,85vw)] max-w-full rounded-e-[var(--radius-lg)] border-s-0",
    right: "inset-y-0 right-0 h-dvh w-[min(20rem,85vw)] max-w-full rounded-s-[var(--radius-lg)] border-e-0",
  };

  return (
    <dialog
      ref={dialogRef}
      className={`fixed m-0 overflow-auto overscroll-contain border border-border bg-card p-0 text-foreground shadow-lg backdrop:bg-black/50 ${sideClasses[side] ?? sideClasses.bottom} ${className}`}
      aria-labelledby={context.titleId}
      aria-describedby={containsSheetDescription(children) ? context.descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        context.onOpenChange(false);
      }}
      onClose={() => {
        if (context.open) context.onOpenChange(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) context.onOpenChange(false);
      }}
      {...props}
    >
      <div className="grid gap-4 p-6">{children}</div>
    </dialog>
  );
}

export function SheetHeader({ className = "", ...props }) {
  return <div className={`grid gap-1.5 text-start ${className}`} {...props} />;
}

export function SheetTitle({ className = "", ...props }) {
  const context = useContext(SheetContext);
  return (
    <h2
      id={context?.titleId}
      className={`text-lg font-semibold leading-none text-heading ${className}`}
      {...props}
    />
  );
}

export function SheetDescription({ className = "", ...props }) {
  const context = useContext(SheetContext);
  return (
    <p
      id={context?.descriptionId}
      className={`text-sm text-muted-foreground ${className}`}
      {...props}
    />
  );
}

export function SheetClose({ className = "", children, ...props }) {
  const context = useContext(SheetContext);
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      {...props}
      onClick={() => context?.onOpenChange(false)}
    >
      {children}
    </Button>
  );
}

export function Progress({ value = 0, className = "", ...props }) {
  const clampedValue = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clampedValue}
      className={`relative h-2 w-full overflow-hidden rounded-full bg-surface-2 ${className}`}
      {...props}
    >
      <div
        className="h-full bg-primary transition-[width]"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

export function Tabs({ value, onValueChange, className = "", children }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = "", ...props }) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center rounded-md bg-surface-2 p-1 ${className}`}
      {...props}
    />
  );
}

export function TabsTrigger({ value, className = "", ...props }) {
  const context = useContext(TabsContext);
  const selected = context?.value === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={`min-h-11 rounded-sm px-3 text-sm font-medium text-muted-foreground transition-colors aria-selected:bg-card aria-selected:text-foreground ${className}`}
      onClick={() => context?.onValueChange(value)}
      {...props}
    />
  );
}

export function Input({ className = "", type = "text", ...props }) {
  return (
    <input
      type={type}
      className={`flex min-h-11 w-full rounded-sm border border-border bg-background px-3 py-2 text-body outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      {...props}
    />
  );
}

export function ScrollArea({ className = "", children, ...props }) {
  return (
    <div
      className={`min-h-0 overflow-auto overscroll-contain ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function Slider({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  onValueCommit,
  className = "",
  ...props
}) {
  const commitValue = (event) =>
    onValueCommit?.([Number(event.currentTarget.value)]);
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value?.[0] ?? defaultValue?.[0] ?? min}
      className={`h-11 w-full accent-primary ${className}`}
      onChange={(event) => onValueChange?.([Number(event.currentTarget.value)])}
      onPointerUp={commitValue}
      onKeyUp={commitValue}
      {...props}
    />
  );
}

export function Switch({
  checked = false,
  onCheckedChange,
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      className={`relative inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      <span className={`pointer-events-none flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${checked ? "bg-primary" : "bg-surface-3"}`}>
        <span
          aria-hidden="true"
          className={`size-5 rounded-full bg-card shadow-sm transition-transform ${checked ? "translate-x-5 rtl:-translate-x-5" : ""}`}
        />
      </span>
    </button>
  );
}

export function Select({
  value,
  onValueChange,
  className = "",
  children,
  ...props
}) {
  return (
    <select
      value={value}
      onChange={(event) => onValueChange?.(event.currentTarget.value)}
      className={`min-h-11 w-full rounded-sm border border-border bg-background px-3 py-2 text-body focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function SelectItem({ value, children, ...props }) {
  return (
    <option value={value} {...props}>
      {children}
    </option>
  );
}
