import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center border-b border-border px-4 sm:px-8">
        <span className="text-sm font-semibold tracking-tight text-foreground">nootree</span>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl space-y-6 text-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              nootree
            </h1>
            <p className="text-balance text-base text-muted-foreground">
              Il gestionale per studi di nutrizione. Pazienti, team e abbonamento in un unico posto.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              Accedi
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            Prodotto in fase di sviluppo attivo — alcune funzionalità non sono ancora disponibili.
          </p>
        </div>
      </main>
    </div>
  );
}
