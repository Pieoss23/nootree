export { auth as proxy } from "@/lib/auth";

// Gate is enforced by callbacks.authorized in src/lib/auth.ts.
export const config = {
  matcher: ["/app/:path*"],
};
