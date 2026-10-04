import { publicRoutes } from './public-routes';

// The suite runs against the dev server, which compiles each route on its first
// request. With two workers hitting cold routes at once, a first navigation
// could take longer than a test's timeout and fail for reasons unrelated to the
// page. Request every public route once, in order, before any test starts so
// each test measures the page, not the compiler.
export default async function globalSetup() {
  const baseURL = 'http://127.0.0.1:4321';
  const routes = ['/', '/work', ...publicRoutes.map((route) => route.path)];

  for (const route of new Set(routes)) {
    try {
      await fetch(`${baseURL}${route}`, {
        signal: AbortSignal.timeout(120_000),
      });
    } catch {
      // A warm-up failure is not a test failure; the test itself will report it.
    }
  }
}
