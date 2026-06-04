# Inertia SSR Configuration — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia SSR Configuration |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. SSR for Everything — Including Authenticated-Only Pages
2. No Fallback for SSR Failures (Missing Timeout)
3. Single-Process SSR Without Clustering
4. Missing @inertia Blade Directive
5. Browser-Only APIs Accessed During SSR

---

## Repository-Wide Anti-Patterns

- **No SSR health monitoring**: Not knowing when the SSR server is down — users silently get degraded experience.
- **Lazy props in SSR context**: Expecting lazy data in SSR output — SSR HTML has placeholder values.
- **No warm-up after deploy**: SSR server compiles JS on first request — slow initial response after deployment.
- **SSR server exposed to public**: Port 13714 accessible from the internet — unauthenticated rendering endpoint.

---

## Anti-Pattern 1: SSR for Everything — Including Authenticated-Only Pages

### Category

Performance

### Description

Enabling SSR for all pages including authenticated-only admin panels, dashboards, and user-specific pages that are not crawled by search engines.

### Why It Happens

SSR is configured once at the application level and defaults to enabled. Developers may not think about disabling it for specific routes. The default `config/inertia.php` enables SSR globally.

### Warning Signs

- SSR server CPU usage is high even during authenticated-only traffic
- Admin dashboard response times include SSR overhead
- No `->ssr(false)` calls in any controller
- SSR metrics show all routes being rendered, not just public ones

### Why Harmful

SSR adds 50-200ms of rendering time and requires a running Node.js server. Authenticated pages are not indexed by search engines and do not benefit from SSR's SEO value. Enabling SSR for these pages wastes server resources, increases page response time for authenticated users, and requires more SSR server capacity than necessary.

### Consequences

- Wasted SSR resources for non-SEO pages
- Slower response times for authenticated users (SSR overhead)
- More SSR server capacity required — higher infrastructure costs
- Node.js server handles unnecessary rendering load

### Alternative

Disable SSR for authenticated-only routes using `Inertia::render('Dashboard', $props)->ssr(false)` or a middleware check that disables SSR based on route/authentication.

### Refactoring Strategy

1. Identify all routes that require authentication (admin, dashboard, user settings)
2. Add `->ssr(false)` to each controller that renders authenticated pages
3. Alternatively, create a middleware that disables SSR for authenticated routes
4. Monitor SSR server load — should decrease proportionally

### Detection Checklist

- [ ] SSR is disabled for authenticated-only pages (admin, dashboard)
- [ ] No search engine crawls authenticated routes
- [ ] SSR server CPU usage is proportional to public traffic volume
- [ ] Authenticated page response times do not include SSR overhead

### Related Rules

- Disable SSR for Authenticated Pages (05-rules.md)

### Related Skills

- Configure and Deploy Inertia SSR (06-skills.md)

### Related Decision Trees

- SSR for All Pages vs Selective SSR (07-decision-trees.md)

---

## Anti-Pattern 2: No Fallback for SSR Failures (Missing Timeout)

### Category

Reliability

### Description

Configuring SSR with no timeout or an excessively long timeout, causing pages to block indefinitely when the SSR server is slow or unavailable.

### Why It Happens

Developers may not consider failure scenarios for the SSR server. During development, the server is always running and responsive. In production, the server can crash, become slow under load, or hang due to memory issues.

### Warning Signs

- `ssr.timeout` set to 0 (infinite) or not configured
- `ssr.timeout` set to 30+ seconds
- Pages occasionally load very slowly with no visible fallback
- SSR server crashes cause complete site unresponsiveness

### Why Harmful

Without a timeout, a slow or crashed SSR server blocks page requests indefinitely. Users see blank screens or endless loading spinners. The application becomes completely unresponsive until the SSR server is restarted or the timeout is reached — which may never happen with infinite timeout.

### Consequences

- Page requests hang indefinitely on SSR failure
- Users see blank screens with no error or fallback
- Complete site unresponsiveness during SSR outage
- No graceful degradation — SSR failure = site failure

### Alternative

Set an aggressive SSR timeout of 3-5 seconds in `config/inertia.php`. This ensures that if the SSR server is slow or down, the page falls back to client-only rendering within an acceptable time.

### Refactoring Strategy

1. Check `config/inertia.php` for the `ssr.timeout` value
2. Set it to 3-5 seconds: `'timeout' => 5`
3. Ensure the Blade layout handles missing SSR HTML gracefully (the `@inertia` directive does this automatically)
4. Test by stopping the SSR server and verifying pages still render (client-only) within the timeout

### Detection Checklist

- [ ] `ssr.timeout` is set to 3-5 seconds (not 0 or >10)
- [ ] Pages render correctly when SSR server is stopped (client-only fallback)
- [ ] No requests hang indefinitely when SSR is down
- [ ] Fallback behavior is transparent to users (no error messages)

### Related Rules

- Set Aggressive SSR Timeout (05-rules.md)

### Related Skills

- Configure and Deploy Inertia SSR (06-skills.md)

### Related Decision Trees

- SSR Enabled vs Client-Only Rendering (07-decision-trees.md)

---

## Anti-Pattern 3: Single-Process SSR Without Clustering

### Category

Performance

### Description

Running the SSR server as a single Node.js process on a multi-core server, leaving most CPU cores idle and creating a rendering bottleneck.

### Why It Happens

The default SSR setup runs a single process. Developers may not investigate scaling options until the server is under load. Node.js is single-threaded — one process uses only one CPU core.

### Warning Signs

- SSR server process shows 100% CPU on one core, others at 0%
- Response times increase under concurrent traffic
- `ps aux` shows a single SSR process regardless of CPU core count
- Queue buildup on SSR server under load

### Why Harmful

The SSR server is CPU-bound — `renderToString` is synchronous and blocks the Node.js event loop. A single process on a multi-core server uses only one core while others sit idle. Under concurrent traffic, requests queue up behind the single process, increasing response times for all users.

### Consequences

- Underutilized server hardware — paying for cores that aren't used
- SSR rendering becomes a bottleneck under load
- Increased response times during traffic spikes
- Poor user experience during concurrent page loads

### Alternative

Run the SSR server in cluster mode using PM2's `-i max` flag, which creates one process per CPU core. Each process handles rendering independently.

### Refactoring Strategy

1. If using PM2, change the SSR start command to include clustering: `pm2 start ssr.js -i max --name inertia-ssr`
2. For Supervisor or systemd, run multiple SSR instances on different ports
3. Ensure the SSR URL in `config/inertia.php` points to a load balancer if using multiple ports
4. Monitor CPU utilization — all cores should show activity under load

### Detection Checklist

- [ ] SSR server runs in cluster mode (PM2) or with multiple processes
- [ ] All CPU cores show activity under SSR load
- [ ] SSR response times scale with available CPU cores
- [ ] No request queuing under moderate concurrent load

### Related Rules

- Process-Managed SSR Server (05-rules.md)

### Related Skills

- Configure and Deploy Inertia SSR (06-skills.md)

### Related Decision Trees

- SSR Enabled vs Client-Only Rendering (07-decision-trees.md)

---

## Anti-Pattern 4: Missing @inertia Blade Directive

### Category

Framework Usage

### Description

Using manual `<div id="app">` rendering in the root Blade layout instead of the `@inertia` directive, preventing SSR from functioning.

### Why It Happens

Older Inertia documentation and tutorials show `<div id="app" data-page="{{ json_encode($page) }}">` as the standard approach. Developers may use this pattern out of habit without knowing about the `@inertia` directive.

### Warning Signs

- Root Blade layout contains `<div id="app" data-page="{{ json_encode($page) }}">`
- SSR is enabled in config but pages always render client-only
- SSR server logs show no requests
- Page source shows empty HTML shell even when SSR server is running

### Why Harmful

The `@inertia` directive automatically handles SSR HTML injection, client-only fallback, and meta tag extraction. Manually using `<div id="app">` disables SSR — every request falls through to client-only rendering, defeating the purpose of SSR configuration. Search engines receive empty HTML shells, and initial load performance does not benefit from SSR.

### Consequences

- SSR never activates — all pages client-rendered
- Search engines receive empty HTML shells — no SEO benefit
- Initial load performance unchanged — no FCP improvement
- SSR server runs but is never used — wasted infrastructure

### Alternative

Replace `<div id="app" data-page="{{ json_encode($page) }}">` with `@inertia` in the root Blade layout. The directive handles SSR HTML injection automatically.

### Refactoring Strategy

1. Find the root Blade layout file (typically `resources/views/app.blade.php`)
2. Replace `<div id="app" data-page="{{ json_encode($page) }}">` with `@inertia`
3. Verify that SSR is working by checking the page source for rendered HTML
4. Ensure the `@inertia` directive still renders correctly when SSR is disabled

### Detection Checklist

- [ ] Root Blade layout uses `@inertia` directive (not manual `<div id="app">`)
- [ ] SSR-rendered HTML appears in page source when SSR server is running
- [ ] Client-only shell renders correctly when SSR server is stopped
- [ ] Meta tags from `Head` component appear in the document head

### Related Rules

- Use @inertia Blade Directive (05-rules.md)

### Related Skills

- Configure and Deploy Inertia SSR (06-skills.md)

### Related Decision Trees

- @inertia Blade Directive vs <div id="app"> Manual Rendering (07-decision-trees.md)

---

## Anti-Pattern 5: Browser-Only APIs Accessed During SSR

### Category

Reliability

### Description

Accessing `window`, `document`, `localStorage`, or other browser-only APIs at the module level or during render in SSR context, causing the SSR server to crash.

### Why It Happens

Browser API access is natural in frontend development. Developers may not think about the server-side rendering context where these APIs do not exist. Code that works perfectly in the browser crashes during SSR.

### Warning Signs

- SSR server crashes with "window is not defined" or "document is not defined" errors
- SSR response returns fallback HTML (client-only) for pages that use browser APIs
- `Math.random()`, `new Date()` in render logic causing hydration mismatches
- SSR error logs showing ReferenceError for browser globals

### Why Harmful

The SSR server runs in Node.js where browser APIs do not exist. Direct access causes a crash during `renderToString`, returning an error page or falling back to client render. This degrades the SSR response for all users and wastes SSR server resources.

### Consequences

- SSR server crashes on every request hitting browser-API code
- All pages for that route fall back to client-only rendering
- SSR benefits lost for the affected route
- Server logs fill with reference errors — hard to identify which component is causing the issue

### Alternative

Guard browser-only API access with `typeof window !== 'undefined'` checks or defer access to `useEffect` (React) / `onMounted` (Vue) hooks that never run on the server.

### Refactoring Strategy

1. Search for `window.`, `document.`, `localStorage`, `sessionStorage` in component files
2. Wrap each in `typeof window !== 'undefined'` guard or move to `useEffect`
3. Replace non-deterministic values (`Math.random()`, `new Date()`) with state that initializes in an effect
4. Test SSR rendering for each affected component

### Detection Checklist

- [ ] No `window`, `document`, or browser globals at module level
- [ ] All browser API access is in `useEffect`/`onMounted` or guarded with `typeof`
- [ ] No non-deterministic values in render logic (dates, random numbers)
- [ ] SSR server does not crash on any route
- [ ] Page HTML is identical between server render and client hydration

### Related Rules

- Guard Browser-Only APIs in SSR (05-rules.md)
- Guard Against Hydration Mismatches (05-rules.md)

### Related Skills

- Configure and Deploy Inertia SSR (06-skills.md)

### Related Decision Trees

- SSR Enabled vs Client-Only Rendering (07-decision-trees.md)
