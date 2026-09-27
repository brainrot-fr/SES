import "./ui.css";

export default function TextField({ id, label, hint, error, className = "", ...props }) {
  return (
    <div className={`ui-field${className ? ` ${className}` : ""}`}>
      <label className="ui-field__label" htmlFor={id}>{label}</label>
      <input
        {...props}
        id={id}
        className="ui-field__input"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined}
      />
      {hint && <span className="ui-field__hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="ui-field__error" id={`${id}-error`} role="alert">{error}</span>}
    </div>
  );
}
