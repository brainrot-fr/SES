export default function Row({
  as: Element = "div",
  leading,
  content,
  trailing,
  className = "",
  children,
  ...props
}) {
  return (
    <Element className={`layout-row${className ? ` ${className}` : ""}`} {...props}>
      {leading != null && <span className="layout-row__leading">{leading}</span>}
      <span className="layout-row__content">{content ?? children}</span>
      {trailing != null && <span className="layout-row__trailing">{trailing}</span>}
    </Element>
  );
}
