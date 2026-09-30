export default function Split({ rail, className = "", children, ...props }) {
  return (
    <div className={`layout-split${className ? ` ${className}` : ""}`} {...props}>
      <aside className="layout-split__rail">{rail}</aside>
      <div className="layout-split__main">{children}</div>
    </div>
  );
}
