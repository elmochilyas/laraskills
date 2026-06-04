# Inertia SSR Configuration

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Inertia SSR Configuration
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Inertia Server-Side Rendering (SSR) pre-renders Inertia page components on the server using Node.js (or Bun) and sends fully rendered HTML to the client. This improves initial page load performance for SEO crawlers and slow networks by sending complete HTML instead of an empty shell that requires JavaScript to hydrate.

The engineering value is bridging the SEO/performance gap between server-rendered Blade apps and client-rendered Inertia SPAs. SSR provides the crawlability of Blade with the interactivity of Inertia, at the cost of additional infrastructure (Node SSR server) and rendering complexity.

---

## Core Concepts

### SSR Architecture

```
Browser  ←  Laravel (HTTP)  →  Node SSR Server (Rendering)
           Port 80/443           Port 13714 (configurable)
```

1. Browser requests `/dashboard`
2. Laravel handles the route, runs middleware, calls `Inertia::render()`
3. Laravel sends the page data (component + props) to the Node SSR server via HTTP
4. Node SSR server renders the React/Vue/Svelte component to HTML
5. HTML is returned to Laravel, which embeds it in the Blade layout
6. Full HTML response is sent to the browser
7. Client JS hydrates the SSR-rendered HTML

### SSR vs Non-SSR

| Concern | Without SSR | With SSR |
|---|---|---|
| Initial HTML | Empty shell (`<div id="app">`) | Full rendered HTML |
| SEO | Poor (crawlers see empty page) | Excellent (full content) |
| First paint | After JS loads + renders | Immediate HTML |
| TTI | Same (JS must hydrate) | Same (JS must hydrate) |
| Server load | Laravel only | Laravel + Node SSR |

---

## Mental Models

### The Rendering Proxy

The Node SSR server is a rendering proxy between Laravel and the browser. Laravel determines the page and props. The SSR server converts the component tree to HTML. Laravel wraps the HTML and sends the response. The SSR server has no application logic — it's a pure rendering engine.

### The Hydration Handoff

SSR does NOT replace client-side JS. The server sends rendered HTML (fast first paint), but the JS bundle still loads and hydrates the page (adds event listeners, makes it interactive). The user sees content immediately but can't interact until hydration finishes.

---

## Internal Mechanics

### SSR Server Setup

```typescript
// resources/js/ssr.js (or ssr.ts)
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

### Laravel Configuration

```php
// config/inertia.php
return [
    'ssr' => [
        'enabled' => true,
        'url' => env('INERTIA_SSR_URL', 'http://127.0.0.1:13714'),
        'port' => env('INERTIA_SSR_PORT', 13714),
    ],
];
```

### Starting the SSR Server

```bash
# Development
php artisan inertia:start-ssr

# Production (using process manager like PM2)
pm2 start resources/js/ssr.js --name inertia-ssr

# Using Bun
bun run resources/js/ssr.ts
```

### Request Flow Detail

1. Laravel receives request, resolves route, executes controller
2. `Inertia::render()` creates a response with component + props
3. Inertia middleware checks `config('inertia.ssr.enabled')`
4. If enabled, Laravel sends POST request to SSR server with `{component, props, url}` as JSON body
5. SSR server's `createServer` receives the payload
6. `createInertiaApp` resolves the page component, creates the root element, renders to HTML string
7. SSR server responds with HTML + head elements (title, meta tags)
8. Laravel embeds the HTML in the Blade layout's `@inertia` directive
9. Full HTML response is sent to the client
10. Client JS loads, `createInertiaApp` detects existing HTML, hydrates instead of mounting fresh

---

## Patterns

### Meta Tag Management

```tsx
import { Head } from '@inertiajs/react';

export default function BlogPost({ post }) {
    return (
        <>
            <Head>
                <title>{post.title} | My Blog</title>
                <meta name="description" content={post.excerpt} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.excerpt} />
            </Head>
            <article>{/* ... */}</article>
        </>
    );
}
```

The SSR server extracts `<Head>` content and returns it separately. Laravel inserts it into the document `<head>`.

### Conditional SSR Disable

```php
// Disable SSR for a specific response
return Inertia::render('Dashboard', $props)->ssr(false);
```

### Environment-Specific Config

```env
# .env
INERTIA_SSR_ENABLED=true
INERTIA_SSR_URL=http://127.0.0.1:13714

# .env.production
INERTIA_SSR_ENABLED=true
INERTIA_SSR_URL=http://localhost:13714
```

---

## Architectural Decisions

### SSR vs Pre-rendering (SSG)

| Concern | SSR (Dynamic) | SSG (Static) |
|---|---|---|
| Content freshness | Always fresh | Built at deploy |
| Request handling | Per-request rendering | Static file serving |
| Infrastructure | Node server needed | Static CDN |
| Personalization | Per-user content | Same for all users |
| Build time | None | Increases with content |

Use SSR for user-specific, dynamic content. Use SSG for public content (blogs, docs) that doesn't change per request.

### SSR with Livewire vs Inertia

Livewire does not have SSR. Its "first render" is always server-side (Blade). Inertia SSR is the JS equivalent of Blade — pre-rendering on the server. If SSR is a hard requirement, choose Inertia (or Blade); Livewire alone won't satisfy it.

---

## Tradeoffs

| Concern | SSR Enabled | SSR Disabled |
|---|---|---|
| Time to First Byte | Slower (SSR round trip) | Faster (no SSR) |
| First Contentful Paint | Faster (HTML ready) | Slower (JS render) |
| Infrastructure | Node server + maintenance | Laravel only |
| Debugging | Harder (two servers) | Easier (single server) |
| Error handling | SSR failure = degraded (no HTML) | Consistent |
| Cost | Additional server | Single server |

---

## Performance Considerations

SSR improves perceived performance (content appears faster) but worsens Time to First Byte (TTFB) because of the SSR round trip. The tradeoff is favorable when:
- Network latency is high (SSR HTML arrives faster than JS bundle + render)
- Content is above the fold (user sees meaningful content immediately)
- JS bundle is large (SSR fills the gap during load)

### SSR Server Sizing

The Node SSR server is CPU-bound (renderToString is synchronous). Scale by number of CPU cores. Budget ~50-200ms per render depending on component complexity.

```bash
# PM2 cluster mode — one worker per CPU
pm2 start resources/js/ssr.js -i max --name inertia-ssr
```

### Timeout Handling

```php
// config/inertia.php
'ssr' => [
    'enabled' => true,
    'url' => 'http://127.0.0.1:13714',
    'timeout' => 5, // seconds — fail fast if SSR server is busy
],
```

---

## Production Considerations

- Run SSR server as a managed process (PM2, Supervisor, systemd)
- Health-check the SSR server endpoint (`GET /` returns a 200)
- Set a reasonable timeout (3-5s) — fall back to client-side render on timeout
- Monitor SSR server memory (renderToString can leak in long-running processes)
- Use environment variables to toggle SSR (enable in prod, disable in dev for HMR speed)
- Configure the Blade layout's `@inertia` directive to handle missing SSR HTML gracefully
- Warm-up the SSR server after deploy (hit key pages to compile component JS before traffic arrives)
- Use HTTP keep-alive between Laravel and SSR server to reduce connection overhead

---

## Common Mistakes

### SSR Server Not Running

If the SSR server is down and `ssr.enabled` is `true`, every page request will timeout or error. Always implement a fallback: disable SSR or degrade gracefully.

```php
// AppServiceProvider
if (!app()->environment('production')) {
    Inertia::setSsrEnabled(false);
}
```

### Lazy Props in SSR

Lazy props are NOT resolved during SSR. The SSR HTML will contain empty/placeholder values for lazy props. On hydration, the client will see a flash as lazy props are fetched and fill in.

### Hydration Mismatch

If the server-rendered HTML differs from the client-rendered tree (e.g., due to random values, dates, or auth state differences), React/Vue will log hydration errors and re-render the client tree, discarding the SSR HTML. Ensure deterministic rendering in SSR paths.

### Missing `@inertia` Blade Directive

The Blade layout must include `@inertia` (not `<div id="app">`) for SSR HTML injection:

```blade
{{-- Correct --}}
@inertia

{{-- Wrong --}}
<div id="app"></div>
```

---

## Failure Modes

### SSR Timeout

SSR server is under load, rendering takes >5s. Laravel times out and returns the client-only version (empty shell). The page loads without SSR — degraded but functional. Monitor timeout rate as a signal to scale SSR servers.

### SSR Server Crash

SSR process dies. Laravel gets connection refused. All subsequent requests fall back to client-only render. The app remains functional (no SSR) but with degraded first-load performance. Restart the SSR process automatically via process manager.

### Memory Leak

Long-running Node processes accumulate memory from renderToString calls. Eventually OOM-killed. Mitigate with:
- `--max-old-space-size` flag
- Regular restart (PM2 cron restart every 24h)
- Memory monitoring alerts

---

## Ecosystem Usage

Inertia SSR integrates with Laravel's Blade layout system (the `@inertia` directive), Vite for asset building, and process managers like PM2 and Supervisor. The SSR server can use Bun as an alternative runtime. Meta tag management uses the Inertia `<Head>` component, which integrates with SEO and social media ecosystems.

## Related Knowledge Units

- **Page Components** (this workspace) — what SSR renders
- **Lazy Data Evaluation** (this workspace) — SSR does NOT evaluate lazy props
- **Shared Data** (this workspace) — available during SSR
- **Server Props** (this workspace) — the data SSR receives
- **TypeScript Integration** (this workspace) — SSR server is typically TypeScript
- **Testing** (this workspace) — testing SSR-rendered output
- **Blade Layout Strategies** (this workspace) — the `@inertia` directive wraps SSR output

---

## Research Notes

- Inertia v3 SSR requires a Node.js (or Bun) server running alongside Laravel
- Default port is 13714 — configurable via `config/inertia.php`
- The SSR server is stateless — it can be horizontally scaled behind a load balancer
- `renderToString` is synchronous — the SSR server does not handle concurrent requests well without clustering
- Bun support was added in Inertia v3 for faster cold starts compared to Node.js
- Laravel's `@inertia` Blade directive conditionally outputs SSR HTML or the client shell
- `Head` component content is extracted during SSR and injected into the document head
- Hydration mismatches are the most common SSR debugging issue
