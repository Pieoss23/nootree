"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/shared";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md">
        <ErrorState
          title="Qualcosa è andato storto"
          description="Si è verificato un errore imprevisto. Il team è stato informato."
          onRetry={reset}
        />
      </div>
    </div>
  );
}
