import { cn } from "@/lib/utils";
import { PrdViewer } from "@/components/prd/prd-viewer";

interface Props {
  className?: string;
}

export function PrdPanel({ className }: Props) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <PrdViewer />
    </div>
  );
}
