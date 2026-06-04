# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia SSR Configuration |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Inertia Server-Side Rendering (SSR) pre-renders Inertia page components on the server using Node.js (or Bun) and sends fully rendered HTML to the client. This improves initial page load performance for SEO crawlers and slow networks by sending complete HTML instead of an empty shell that requires JavaScript to hydrate. The engineering value is bridging the SEO/performance gap between server-rendered Blade apps and client-rendered Inertia SPAs — providing the crawlability of Blade with the interactivity of Inertia.

---

## Core Concepts

- **SSR Architecture**: Browser <-> Laravel (HTTP) <-> Node SSR Server (Rendering) — Laravel sends page data to Node SSR server which renders to HTML
- **`@inertia` Blade directive**: Replaces `<div id="app">` — conditionally outputs SSR HTML or the client shell
- **`createServer` function**: SSR entry point that creates a Node HTTP server rendering Inertia pages
- **`Head` component extraction**: Meta tags and title are extracted during SSR and injected into the document head
- **Laravel config**: `config/inertia.php` with `ssr.enabled`, `ssr.url`, `ssr.port`, `ssr.timeout`
- **Hydration**: Client JS loads and hydrates the SSR-rendered HTML — adds event listeners without re-rendering
- **PM2 clustering**: Run SSR server in cluster mode (`pm2 start -i max`) for multi-core utilization

---

## When To Use

- SEO is critical — search engine crawlers need full HTML content
- First Contentful Paint (FCP) needs to be fast, especially on slow networks
- Public-facing pages where initial load performance matters
- Social media preview (Open Graph, Twitter Cards) — SSR renders meta tags server-side
- Applications targeting users with slow connections or older devices

## When NOT To Use

- Authenticated dashboards and admin panels (not crawled by search engines)
- Applications where the Node SSR server infrastructure cost is prohibitive
- Small apps where Blade or Livewire SSR (which is always server-rendered) suffices
- Teams without DevOps capacity to manage an additional Node.js service

---

## Best Practices

- **Run SSR server as a managed process** (PM2, Supervisor, systemd) — auto-restart on crash
- **Set a reasonable timeout** (3-5s) — fall back to client-only render on timeout
- **Health-check the SSR server endpoint** (`GET /` returns 200)
- **Use environment variables to toggle SSR** — enable in production, disable in dev for HMR speed
- **Warm-up the SSR server after deploy** — hit key pages to compile component JS before traffic arrives
- **Use HTTP keep-alive** between Laravel and SSR server to reduce connection overhead
- **Monitor SSR server memory** — `renderToString` can leak in long-running processes
- **Configure the Blade layout to handle missing SSR HTML gracefully** — fall back to client shell

---

## Architecture Guidelines

- SSR does NOT replace client-side JS — the JS bundle still loads and hydrates (adds event listeners)
- SSR improves perceived performance (content appears faster) but worsens TTFB (SSR round trip)
- Lazy props are NOT resolved during SSR — SSR HTML will contain placeholder values
- The SSR server is stateless — it can be horizontally scaled behind a load balancer
- `renderToString` is synchronous — the SSR server doesn't handle concurrent requests well without clustering
- Default port is 13714 — configurable via `config/inertia.php`
- The `@inertia` Blade directive conditionally outputs SSR HTML or the empty shell

---

## Performance

SSR improves First Contentful Paint (HTML arrives rendered) but increases Time to First Byte (Node round trip). The tradeoff is favorable when network latency is high or JS bundle is large. Budget ~50-200ms per render depending on component complexity. The Node SSR server is CPU-bound — scale by number of CPU cores with PM2 cluster mode. Set SSR timeout to 3-5s to fail fast. Memory usage grows with each render — monitor and restart periodically.

| Metric | Without SSR | With SSR |
|--------|-------------|----------|
| Initial HTML | Empty shell | Full rendered HTML |
| FCP | After JS loads + renders | Immediate HTML |
| SEO | Poor | Excellent |
| TTFB | Faster | +50-200ms (SSR round trip) |
| Server load | Laravel only | Laravel + Node SSR |

---

## Security

- The SSR server runs as a separate process — isolate it from the Laravel application server
- The SSR server receives page component + props from Laravel — it does NOT have direct database access
- SSR responses may include user-specific data — ensure CDN caching respects authentication headers
- The SSR server port (13714) should not be exposed to the public internet — bind to localhost
- SSR timeouts and failures fall back to client-side render — the app remains functional (degraded)

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| SSR server not running | Process crashes without auto-restart | Every page request times out | Use process manager with auto-restart |
| Missing `@inertia` directive | Using `<div id="app">` instead | SSR HTML is not injected into the page | Use `@inertia` in Blade layout |
| Lazy props in SSR | Expecting lazy data in SSR output | SSR output has placeholder values | Always guard lazy components for SSR |
| Hydration mismatch | Different HTML between server and client render | React/Vue discards SSR HTML, re-renders client-side | Ensure deterministic rendering (no random values, dates) |
| Window-dependent code in SSR | Accessing `window`, `document` during SSR render | Server crash at render time | Guard with typeof checks or useEffect |
| No SSR timeout | SSR server under heavy load | Request waits indefinitely | Set 3-5s timeout; fall back to client render |

---

## Anti-Patterns

- **SSR for everything**: Enabling SSR for admin dashboards and authenticated pages that don't need SEO — adds cost without benefit
- **No fallback for SSR failures**: Assuming SSR server will always be available — always implement fallback to client-side render
- **Single-process SSR without clustering**: Running one SSR process on a multi-core server — underutilizes hardware
- **Long SSR timeouts**: 30s+ timeout blocking page requests — set aggressive timeouts and fail fast
- **No SSR health monitoring**: Not knowing when the SSR server is down — users silently get degraded experience

---

## Examples

### SSR Configuration

```php
// config/inertia.php
return [
    'ssr' => [
        'enabled' => env('INERTIA_SSR_ENABLED', true),
        'url' => env('INERTIA_SSR_URL', 'http://127.0.0.1:13714'),
        'timeout' => 5, // seconds
    ],
];
```

### SSR Server Entry Point

```typescript
// resources/js/ssr.ts
import { createInertiaApp } from '@inertiajs/react';
import { createServer } from '@inertiajs/react/server';
import ReactDOMServer from 'react-dom/server';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        resolve: (name) => {
            const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
            return pages[`./Pages/${name}.jsx`];
        },
        setup: ({ App, props }) => <App {...props} />,
    })
);
```

### Production Deployment

```bash
# Start SSR with PM2 cluster mode
pm2 start resources/js/ssr.js -i max --name inertia-ssr
```

### Conditional SSR Disable

```php
// Disable SSR for a specific response
return Inertia::render('Dashboard', $props)->ssr(false);
```

---

## Related Topics

- Page Components — what SSR renders
- Lazy Data Evaluation — SSR does NOT evaluate lazy props
- Shared Data — available during SSR
- Server Props — the data SSR receives
- TypeScript Integration — SSR server is typically TypeScript
- Testing — testing SSR-rendered output

---

## AI Agent Notes

- Inertia v3 SSR requires a Node.js (or Bun) server running alongside Laravel
- Default port is 13714 — configurable via `config/inertia.php`
- The SSR server is stateless and horizontally scalable
- `renderToString` is synchronous — use clustering for concurrency
- Bun support in Inertia v3 for faster cold starts
- `@inertia` Blade directive conditionally outputs SSR HTML or client shell
- `Head` component content is extracted during SSR and injected into document head
- Hydration mismatches are the most common SSR debugging issue

---

## Verification

- SSR server is configured in `config/inertia.php` with appropriate timeout
- `@inertia` directive is used in the Blade layout (not `<div id="app">`)
- SSR server entry point exists at `resources/js/ssr.js` or `ssr.ts`
- SSR is disabled for authenticated-only pages
- Process manager (PM2/Supervisor) is configured for production
- Timeout handling is configured for graceful fallback
- Lazy props are guarded in SSR-rendered components
