import AppIcon from "@/components/icons/AppIcon";
import DirectionalIcon from "@/components/icons/DirectionalIcon";
import { Button } from "@/components/shadcn/button";

const DIRECTIONAL_ICONS = new Set(["arrowRight", "back", "chevronLeft", "chevronRight", "skipBack", "skipForward"]);

export default function IconButton({
  as: Component,
  asChild,
  icon,
  label,
  size = 22,
  className = "",
  type,
  ...props
}) {
  const Icon = DIRECTIONAL_ICONS.has(icon) ? DirectionalIcon : AppIcon;
  const iconElement = <Icon name={icon} size={size} />;

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
