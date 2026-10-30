import AppIcon from "@/components/icons/AppIcon";
import { Button } from "@/components/shadcn/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/shadcn/drawer";

export default function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  showCloseButton = true,
  className = "",
  children,
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`max-h-[85dvh] overflow-y-auto rounded-t-[var(--radius-lg)] pb-[calc(1rem+env(safe-area-inset-bottom))] ${className}`}>
        <DrawerHeader className="sr-only">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        {showCloseButton && (
          <DrawerClose asChild>
            <Button type="button" variant="ghost" size="icon" className="absolute end-4 top-4 z-10" aria-label={closeLabel}>
              <AppIcon name="close" />
            </Button>
          </DrawerClose>
        )}
        {children}
      </DrawerContent>
    </Drawer>
  );
}
