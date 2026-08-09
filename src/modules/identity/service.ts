import type { CurrentUser } from "./types";

/**
 * Contract the rest of the application codes against. The concrete
 * implementation (backed by Auth.js) lives in infrastructure and is
 * injected here — no module outside `identity` may import Auth.js
 * directly. Not implemented yet: see Milestone 1.1.
 */
export interface IdentityService {
  getCurrentUser(): Promise<CurrentUser | null>;
  requireUser(): Promise<CurrentUser>;
  signOut(): Promise<void>;
}

export class UnauthenticatedError extends Error {
  constructor() {
    super("No authenticated user in the current request context.");
    this.name = "UnauthenticatedError";
  }
}
