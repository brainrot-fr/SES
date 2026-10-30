import { Alert, AlertDescription } from "@/components/shadcn/alert";

export default function FormError({ children, message, className = "" }) {
  const content = children ?? message;
  if (!content) return null;
  return (
    <Alert variant="destructive" className={className}>
      <AlertDescription className="flex items-center justify-between gap-3">
        {typeof content === "string" ? <span>{content}</span> : content}
      </AlertDescription>
    </Alert>
  );
}
