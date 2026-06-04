# Inertia SSR Configuration — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Inertia
- **Knowledge Unit:** Inertia SSR Configuration
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Node.js (or Bun) runtime is available for SSR server
- [ ] `config/inertia.php` exists with SSR configuration section
- [ ] `@inertiajs/react/server` or appropriate SSR server package is installed
- [ ] Blade layout uses `@inertia` directive (not `<div id="app">`)

## Implementation Checklist
- [ ] SSR server is configured in `config/inertia.php` with appropriate timeout
- [ ] `@inertia` directive is used in the Blade layout
- [ ] SSR server entry point exists at `resources/js/ssr.js` or `ssr.ts`
- [ ] SSR is disabled for authenticated-only pages (admin dashboards)
- [ ] Process manager (PM2/Supervisor/systemd) is configured for production
- [ ] Timeout handling is configured for graceful fallback (3-5s)
- [ ] Lazy props are guarded in SSR-rendered components
- [ ] `Head` component is used for meta tags and title
- [ ] Environment variables toggle SSR (`INERTIA_SSR_ENABLED`)

## Verification Checklist
- [ ] SSR server returns rendered HTML for page requests
- [ ] Client-side JS hydrates SSR-rendered HTML correctly
- [ ] No hydration mismatches (deterministic rendering — no random/dates)
- [ ] SSR server health-check endpoint (`GET /`) returns 200
- [ ] `@inertia` conditionally outputs SSR HTML or client shell
- [ ] Lazy props are NOT present in SSR output
- [ ] SSR fails gracefully — falls back to client-side render

## Security Checklist
- [ ] SSR server port (13714) is bound to localhost only
- [ ] SSR server has no direct database access (receives data from Laravel)
- [ ] SSR responses from CDN respect authentication headers
- [ ] CDN caching doesn't leak user-specific SSR content
- [ ] Window-dependent code is guarded with `typeof` checks or `useEffect`
- [ ] SSR timeout prevents request hanging indefinitely

## Performance Checklist
- [ ] SSR improves FCP (First Contentful Paint) for public pages
- [ ] SSR server uses PM2 cluster mode (`-i max`) for multi-core utilization
- [ ] `renderToString` timeout is set to 3-5s (not longer)
- [ ] SSR server memory is monitored (restart periodically if leaking)
- [ ] HTTP keep-alive is used between Laravel and SSR server
- [ ] SSR server is warmed up after deploy
- [ ] SSR overhead (~50-200ms TTFB increase) is acceptable

## Production Readiness Checklist
- [ ] SSR server runs as a managed process with auto-restart
- [ ] SSR health monitoring and alerting is configured
- [ ] Fallback to client-side render is implemented and tested
- [ ] Lazy-loaded page components don't break SSR
- [ ] `@inertia` directive is in the production Blade layout
- [ ] SSR is disabled for routes that don't need it
- [ ] Horizontal scaling of SSR server is tested

## Common Mistakes to Avoid
- [ ] SSR server running without auto-restart — process crashes silently
- [ ] Using `<div id="app">` instead of `@inertia` — SSR HTML not injected
- [ ] Expecting lazy data in SSR output — lazy props are not SSR-rendered
- [ ] Hydration mismatch from non-deterministic rendering
- [ ] Window-dependent code causing SSR server crash
- [ ] No SSR timeout — request waits indefinitely under load
- [ ] SSR for admin dashboards that don't need SEO
