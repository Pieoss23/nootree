// Vitest alias target for the "server-only" marker package (see
// vitest.config.ts). That package always throws when resolved outside
// Next.js's "react-server" bundler condition, which would break every test
// that imports a server-only module. Test code never runs in a browser, so
// the guard is a no-op here.
export {};
