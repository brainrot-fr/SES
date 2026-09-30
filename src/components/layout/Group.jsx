export default function Group({ as: Element = "section", className = "", children, ...props }) {
  return (
    <Element className={`layout-group${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </Element>
  );
}
