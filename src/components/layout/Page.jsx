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
