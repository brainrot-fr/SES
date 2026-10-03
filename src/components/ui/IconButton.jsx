import AppIcon from "../icons/AppIcon";
import { Button } from "../shadcn/button";

export default function IconButton({ as: Component, asChild, icon, label, size = 22, className = "", type, ...props }) {
  const iconElement = <AppIcon name={icon} size={size} />;

  if (asChild && !Component && props.children) {
    return <Button {...props} variant="ghost" size="icon" className={className} aria-label={label} asChild />;
  }

  if (!Component) return <Button {...props} type={type ?? "button"} variant="ghost" size="icon" className={className} aria-label={label}>{props.children ?? iconElement}</Button>;

  return (
    <Button variant="ghost" size="icon" className={className} aria-label={label} asChild>
      <Component {...props}>{iconElement}</Component>
    </Button>
  );
}
