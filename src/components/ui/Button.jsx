import "./ui.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  busy = false,
  fullWidth = false,
  className = "",
  disabled,
  ...props
}) {
  const classes = [
    "ui-button",
    `ui-button--${variant}`,
    `ui-button--${size}`,
    fullWidth && "ui-button--full",
    className,
  ].filter(Boolean).join(" ");

  return (
    <button
      {...props}
      className={classes}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
    >
      {busy && <span className="ui-button__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
