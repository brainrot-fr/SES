import AppIcon from "../icons/AppIcon";
import { Button } from "@/components/shadcn/button";

export default function IconButton({ as: Component, icon, label, size = 22, className = "", type, ...props }) {
  const iconElement = <AppIcon name={icon} size={size} />;
  return Component ? (
    <Button asChild variant="ghost" size="icon" className={className} aria-label={label}>
      <Component {...props}>{iconElement}</Component>
    </Button>
  ) : (
    <Button {...props} type={type ?? "button"} variant="ghost" size="icon" className={className} aria-label={label}>
      {iconElement}
    </Button>
  );
}
