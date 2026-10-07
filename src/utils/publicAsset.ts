// Resolves a file under public/ against the build's base. The default build
// (base './') keeps these relative, as before; a build with an absolute base
// (VITE_BASE, e.g. `npm run build:mlg`) makes them absolute, so they still
// load when the host serves the page without a trailing slash.
export function publicAsset(path: string): string {
  return import.meta.env.BASE_URL + path;
}
