import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function SessionNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-center px-6">
      <h1 className="text-2xl font-medium">Session introuvable</h1>
      <p className="text-muted-foreground max-w-md">
        Cette session n&apos;existe pas ou vous n&apos;y avez pas accès.
      </p>
      <Link href="/" className={buttonVariants({ variant: "default" })}>
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
