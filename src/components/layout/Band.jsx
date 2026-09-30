export default function Band({ as: Element = "section", glow = false, className = "", children, ...props }) {
  return (
    <Element
      className={`layout-band${glow ? " layout-band--glow" : ""}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </Element>
  );
}
