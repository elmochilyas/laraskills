# Skill: Configure and Deploy Inertia SSR

## Purpose

Set up Inertia's Node.js SSR server to pre-render page components on the server for improved SEO and initial page load performance, with proper process management and fallback handling.

## When To Use

SEO is critical for public-facing Inertia pages, or when First Contentful Paint needs improvement on slow networks.

## When NOT To Use

- Authenticated-only pages (dashboards, admin panels) — not crawled by search engines
- Small applications where the Node.js server infrastructure cost is prohibitive
- Teams without DevOps capacity to manage an additional Node.js service

## Prerequisites

- Inertia installed with an adapter that supports SSR (React, Vue, Svelte)
- Node.js or Bun available in the production environment
- Process manager (PM2, Supervisor, systemd) available for production

## Inputs

- SSR entry point file (`resources/js/ssr.ts` or `ssr.js`)
- Blade layout using `@inertia` directive
- Component list to identify SSR-eligible vs disabled pages

## Workflow

1. Create the SSR server entry point at `resources/js/ssr.ts`:
   ```typescript
   import { createInertiaApp } from '@inertiajs/react';
   import { createServer } from '@inertiajs/react/server';
   import ReactDOMServer from 'react-dom/server';
   createServer((page) => createInertiaApp({ page, render: ReactDOMServer.renderToString, ... }));
   ```
2. Update the Blade layout to use `@inertia` instead of `<div id="app">`
3. Configure `config/inertia.php` with SSR enabled, localhost URL, and 5-second timeout
4. Set SSR to disabled by default for authenticated routes via `->ssr(false)`
5. Guard browser-only APIs (`window`, `document`) with `typeof` checks or `useEffect`
6. Avoid non-deterministic values in render logic (no `Math.random()`, `new Date()` directly in JSX)
7. In production, start the SSR server under a process manager with auto-restart:
   ```bash
   pm2 start resources/js/ssr.js -i max --name inertia-ssr
   ```
8. Add health checks for the SSR server endpoint
9. Configure the Blade layout to gracefully fall back to client-only render on SSR timeout

## Validation Checklist

- [ ] `@inertia` directive used in the Blade layout (not `<div id="app">`)
- [ ] SSR server entry point exists at `resources/js/ssr.js` or `ssr.ts`
- [ ] SSR is disabled for authenticated-only pages (dashboards, admin)
- [ ] Process manager (PM2/Supervisor) configured for production auto-restart
- [ ] Aggressive timeout (3-5s) configured in `config/inertia.php`
- [ ] SSR server bound to localhost (`127.0.0.1`) — not exposed publicly
- [ ] No browser-only API access at module level or during render
- [ ] Hydration mismatches prevented — no non-deterministic render values

## Common Failures

- SSR server crashes without auto-restart — every page request times out
- Missing `@inertia` directive — SSR HTML not injected, all pages client-rendered
- Lazy props in SSR — SSR output has missing/placeholder values
- Hydration mismatch — different HTML between server and client render, SSR work wasted
- Browser-only API access in SSR — server crash during `renderToString`
- No SSR timeout — request waits indefinitely when SSR server is down

## Decision Points

- Enable SSR for public-facing pages needing SEO; disable for authenticated-only pages via `->ssr(false)`
- Use `@inertia` in the root Blade layout for SSR support; use `<div id="app">` only temporarily during debugging
- Cluster SSR processes with PM2 (`-i max`) to utilize all CPU cores

## Performance Considerations

SSR improves FCP (HTML arrives rendered) but increases TTFB (+50-200ms for SSR round trip). Budget SSR rendering for public pages only. The Node SSR server is CPU-bound — scale horizontally with cluster mode. Set 3-5s timeout to fail fast.

## Security Considerations

Bind SSR server to localhost only — do not expose the SSR port publicly. SSR responses may include user-specific data — ensure CDN caching respects authentication headers. SSR timeouts fall back to client-side render — app remains functional (degraded).

## Related Rules

- Use @inertia Blade Directive (05-rules.md)
- Process-Managed SSR Server (05-rules.md)
- Set Aggressive SSR Timeout (05-rules.md)
- Disable SSR for Authenticated Pages (05-rules.md)
- Guard Against Hydration Mismatches (05-rules.md)
- Guard Browser-Only APIs in SSR (05-rules.md)
- Bind SSR Server to Localhost (05-rules.md)

## Related Skills

- Create an Inertia Page Component with Typed Props (inertia/page-components)
- Defer Expensive Data with Lazy Props (inertia/lazy-data-evaluation)
- Evaluate and Select Frontend Stack (stack-selection-guide)

## Success Criteria

- Public-facing pages send fully rendered HTML to clients and search engines
- Authenticated pages skip SSR (faster response, no wasted server resources)
- SSR server runs under a process manager with auto-restart
- SSR failures gracefully fall back to client-only rendering
- No hydration mismatches — server and client HTML are identical
- SSR server port is not exposed to the public internet
