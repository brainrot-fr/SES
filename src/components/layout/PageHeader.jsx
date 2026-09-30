export default function PageHeader({ as: Element = "header", className = "", children, ...props }) {
  return (
    <Element className={`layout-page-header${className ? ` ${className}` : ""}`} {...props}>
      {children}
    </Element>
  );
}
