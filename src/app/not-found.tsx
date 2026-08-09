import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold text-foreground">Pagina non trovata</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        La pagina che cerchi non esiste o è stata spostata.
      </p>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        Torna alla home
      </Link>
    </div>
  );
}
