import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
      <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
        nootree
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
