## Rule: Use @inertia Blade Directive

Always use `@inertia` in the root Blade layout instead of a bare `<div id="app">`.

---

## Category

Framework Usage

---

## Rule

Replace `<div id="app" data-page="{{ json_encode($page) }}">` with `@inertia` in your root Blade layout. The directive conditionally outputs SSR-rendered HTML or the client-rendered shell.

---

## Reason

The `@inertia` directive automatically handles SSR HTML injection, client-only fallback, and meta tag extraction. Manually using `<div id="app">` disables SSR — every request falls through to client-only rendering, defeating the purpose of SSR configuration.

---

## Bad Example

```blade
{{-- SSR disabled — always client-only --}}
<div id="app" data-page="{{ json_encode($page) }}"></div>
```

---

## Good Example

```blade
{{-- SSR HTML injected when SSR server is active --}}
@inertia
```

---

## Exceptions

During initial setup or SSR debugging, temporarily reverting to `<div id="app">` is acceptable. Revert to `@inertia` before deploying to production.

---

## Consequences Of Violation

Performance risks: SSR never activates, all pages client-rendered. SEO risks: crawlers receive empty HTML shell.

---

## Rule: Process-Managed SSR Server

Run the SSR Node.js server under a process manager that auto-restarts on crash.

---

## Category

Reliability

---

## Rule

Use PM2, Supervisor, or systemd to run the SSR server process. Configure auto-restart on failure, health checks, and log rotation. Never rely on manually starting or maintaining the SSR server.

---

## Reason

The SSR server is a separate Node.js process that can crash from memory leaks, unhandled exceptions, or resource exhaustion. Without auto-restart, a crash causes every subsequent page request to time out waiting for SSR, then fall back to client render — degrading performance for all users until manual restart.

---

## Bad Example

```bash
node resources/js/ssr.js &  # No crash recovery, no monitoring
```

---

## Good Example

```bash
pm2 start resources/js/ssr.js -i max --name inertia-ssr
```

---

## Exceptions

During local development, running the SSR server manually or in a terminal pane is acceptable. Production requires a managed process.

---

## Consequences Of Violation

Reliability risks: SSR crashes unnoticed, all users get degraded client-only rendering. Performance risks: every page request blocks on the SSR timeout.

---

## Rule: Set Aggressive SSR Timeout

Configure an SSR timeout of 3-5 seconds in `config/inertia.php` so pages fall back gracefully when the SSR server is slow or unavailable.

---

## Category

Performance

---

## Rule

Set `ssr.timeout` to a value between 3 and 5 seconds. Never set it to 0 (infinite) or values above 10 seconds. Implement a fallback that serves the client-only shell on timeout.

---

## Reason

Without a timeout, a slow or crashed SSR server blocks page requests indefinitely. Users see blank screens or endless loading spinners. A short timeout ensures the page renders (as client-only) within an acceptable time even if SSR fails, providing graceful degradation.

---

## Bad Example

```php
'ssr' => [
    'enabled' => true,
    'timeout' => 0, // infinite wait — blocks forever on SSR failure
],
```

---

## Good Example

```php
'ssr' => [
    'enabled' => env('INERTIA_SSR_ENABLED', true),
    'url' => 'http://127.0.0.1:13714',
    'timeout' => 5,
],
```

---

## Exceptions

None. Always set a timeout.

---

## Consequences Of Violation

Reliability risks: page requests hang indefinitely on SSR failure. Performance risks: no fallback degrades user experience.

---

## Rule: Disable SSR for Authenticated Pages

Disable SSR for routes that require authentication and are not crawled by search engines.

---

## Category

Performance

---

## Rule

Use `Inertia::render('Dashboard', $props)->ssr(false)` or a middleware check to skip SSR for admin panels, dashboards, and authenticated-only sections.

---

## Reason

SSR adds 50-200ms of rendering time and requires a running Node.js server. Authenticated pages are not indexed by search engines and do not benefit from SSR's SEO value. Disabling SSR for these pages saves server resources and reduces page response time for users who are already authenticated.

---

## Bad Example

```php
// All pages SSR-rendered — including admin dashboards
return Inertia::render('Admin/Dashboard', $props);
```

---

## Good Example

```php
// Disable SSR for authenticated-only dashboard
return Inertia::render('Admin/Dashboard', $props)->ssr(false);
```

---

## Exceptions

If the application uses SSR for performance reasons (First Contentful Paint improvement) rather than SEO, keep SSR enabled for all pages. Measure the performance impact to confirm the benefit.

---

## Consequences Of Violation

Performance risks: wasted SSR resources for non-SEO pages. Scalability risks: Node.js server handles unnecessary load. Cost risks: more SSR server capacity required.

---

## Rule: Guard Against Hydration Mismatches

Ensure deterministic rendering across server and client to prevent hydration mismatches.

---

## Category

Reliability

---

## Rule

Avoid non-deterministic values (random numbers, current dates, `Math.random()`, `new Date()`), browser-only APIs (`localStorage`, `sessionStorage`), and environment-specific output in page component render logic. Use `useEffect`/`onMounted` for client-only code.

---

## Reason

When SSR HTML differs from the client's initial render output, Inertia discards the SSR HTML and re-renders client-side. This wastes the SSR work, causes a visible flash, and may break layout if the mismatched content affects layout dimensions.

---

## Bad Example

```jsx
function TimeDisplay() {
    return <div>{new Date().toISOString()}</div>; // Different on server vs client
}
```

---

## Good Example

```jsx
function TimeDisplay() {
    const [time, setTime] = useState(null);
    useEffect(() => { setTime(new Date().toISOString()); }, []);
    return <div>{time ?? ''}</div>;
}
```

---

## Exceptions

Static content (text, images, links) that does not depend on runtime values is always safe and does not need guards.

---

## Consequences Of Violation

Performance risks: SSR work wasted, client re-renders anyway. UX risks: visible flash on hydration. Debugging difficulty: hydration warnings in console, hard to reproduce.

---

## Rule: Guard Browser-Only APIs in SSR

Guard all `window`, `document`, and browser-only API access with `typeof` checks or restrict to `useEffect`/`onMounted`.

---

## Category

Reliability

---

## Rule

Never reference `window`, `document`, `localStorage`, or other browser globals at the module level or during render in SSR context. Guard with `typeof window !== 'undefined'` or defer access to an effect/mounted callback.

---

## Reason

The SSR server runs in Node.js where browser APIs do not exist. Direct access causes a crash during `renderToString`, returning an error page or falling back to client render. This degrades the SSR response for all users.

---

## Bad Example

```jsx
const width = window.innerWidth; // Crashes SSR server
function Component() { return <div>{width}</div>; }
```

---

## Good Example

```jsx
function Component() {
    const [width, setWidth] = useState(0);
    useEffect(() => { setWidth(window.innerWidth); }, []);
    return <div>{width}</div>;
}
```

---

## Exceptions

Code inside `useEffect` (React) or `onMounted` (Vue) that accesses browser APIs is safe because those hooks never run on the server.

---

## Consequences Of Violation

Reliability risks: SSR server crashes on every request hitting this code. Performance risks: all pages for that route fall back to client-only rendering.

---

## Rule: Bind SSR Server to Localhost

Bind the SSR server to `127.0.0.1` and never expose its port publicly.

---

## Category

Security

---

## Rule

Configure the SSR server URL as `http://127.0.0.1:13714` in `config/inertia.php` and ensure the Node.js server binds to localhost only. Do not expose port 13714 or any SSR server port through firewall rules, reverse proxy configurations, or cloud security groups.

---

## Reason

The SSR server receives page component data (which may include user-specific information) from Laravel. If exposed to the public internet, it becomes an unauthenticated endpoint that can be used to probe for information, trigger rendering loads, or discover attack surface.

---

## Bad Example

```php
'ssr' => [
    'url' => 'http://0.0.0.0:13714', // Bound to all interfaces
],
```

---

## Good Example

```php
'ssr' => [
    'url' => 'http://127.0.0.1:13714', // Localhost only
],
```

---

## Exceptions

When running SSR in a containerized environment where inter-service communication requires a routable address, restrict access with network policies rather than IP binding.

---

## Consequences Of Violation

Security risks: unauthenticated access to SSR server, potential data exposure. Attack surface: publicly accessible Node.js service increases risk.
