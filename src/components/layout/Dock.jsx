export default function Dock({ as: Element = "div", className = "", children, ...props }) {
  return (
    <Element className={`layout-dock${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </Element>
  );
}
