import AppIcon from "@/components/icons/AppIcon";

export default function DirectionalIcon({ className = "", ...props }) {
  return <AppIcon {...props} className={`rtl:rotate-180 ${className}`} />;
}
