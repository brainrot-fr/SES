import "./ui.css";

export default function Card({ as: Component = "div", className = "", interactive = false, ...props }) {
  return (
    <Component
      {...props}
      className={`ui-card${interactive ? " ui-card--interactive" : ""}${className ? ` ${className}` : ""}`}
    />
  );
}
