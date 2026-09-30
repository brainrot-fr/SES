export default function RowList({ as: Element = "div", className = "", children, ...props }) {
  return (
    <Element className={`layout-row-list${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </Element>
  );
}
