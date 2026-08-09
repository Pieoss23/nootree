"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled root-level error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <html lang="it">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center text-neutral-900">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Qualcosa è andato storto</h1>
          <p className="text-sm text-neutral-600">
            Si è verificato un errore imprevisto nell&apos;applicazione.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Riprova
        </button>
      </body>
    </html>
  );
}
