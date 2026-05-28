import { cn } from "@/lib/utils";
import { PrdViewer } from "@/components/prd/prd-viewer";

interface Props {
  className?: string;
}

export function PrdPanel({ className }: Props) {
  return (
    <div className={cn("min-h-0", className)}>
      <PrdViewer />
    </div>
  );
}
