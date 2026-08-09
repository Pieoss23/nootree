import { describe, expect, it } from "vitest";
import { isAppRouteAuthorized } from "./auth-authorization";

describe("isAppRouteAuthorized", () => {
  it("allows unauthenticated access to routes outside /app", () => {
    expect(isAppRouteAuthorized("/login", false)).toBe(true);
    expect(isAppRouteAuthorized("/", false)).toBe(true);
  });

  it("blocks unauthenticated access to /app routes", () => {
    expect(isAppRouteAuthorized("/app", false)).toBe(false);
    expect(isAppRouteAuthorized("/app/patients", false)).toBe(false);
  });

  it("allows authenticated access to /app routes", () => {
    expect(isAppRouteAuthorized("/app", true)).toBe(true);
    expect(isAppRouteAuthorized("/app/patients", true)).toBe(true);
  });
});
