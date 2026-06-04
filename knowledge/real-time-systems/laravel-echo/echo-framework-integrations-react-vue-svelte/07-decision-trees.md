# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Client-Side Subscriptions (Echo)
**Knowledge Unit:** Echo Framework Integrations (React/Vue/Svelte)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Category |
|---|----------|----------|
| 1 | Framework hook vs raw Echo API | architectural |
| 2 | useEcho (private) vs useEchoPublic | performance |
| 3 | Connection status monitoring scope | performance |

---

# Architecture-Level Decision Trees

---

## Framework Hook vs Raw Echo API

---

## Decision Context

Whether to use framework-specific Echo hooks (`@laravel/echo-react`, `@laravel/echo-vue`, `@laravel/echo-svelte`) or Echo's core API directly.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Project uses React 18+, Vue 3, or Svelte 5?
↓
YES → Need automatic lifecycle management (subscribe on mount, unsubscribe on unmount)?
    ↓
    YES → **Use framework hooks** — `useEcho`, `useEchoPublic`, etc.
    NO → Vanilla JS or jQuery project?
        ↓
        YES → **Raw Echo API** with manual lifecycle
        NO → **Framework hooks**
NO → **Raw Echo API** — framework-specific packages require modern framework versions

---

## Rationale

Framework hooks provide automatic lifecycle management via `useEffect` (React), `onMounted`/`onUnmounted` (Vue), or `$effect` (Svelte). Raw Echo API requires manual `leave()` calls and is more error-prone for component-based architectures.

---

## Recommended Default

**Default:** Framework-specific hooks (`@laravel/echo-react`, `@laravel/echo-vue`, `@laravel/echo-svelte`)
**Reason:** Automatic lifecycle cleanup; reactive state integration; less boilerplate than raw Echo API.

---

## Risks Of Wrong Choice

Raw Echo API without careful lifecycle management causes memory leaks and stale subscriptions.

---

## Related Rules

Call leave() on Component Unmount for Raw Echo API

---

## Related Skills

Configure Echo for Frontend Subscriptions

---

---

## useEcho (Private) vs useEchoPublic

---

## Decision Context

Which hook variant to use based on channel type.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Channel contains user-specific or sensitive data?
↓
YES → Requires authorization?
    ↓
    YES → **useEcho** (defaults to private channel; triggers auth request)
    NO → Not applicable — sensitive data always needs auth
NO → Channel data is public/announcement-level?
    ↓
    YES → **useEchoPublic** — avoids unnecessary auth endpoint call
    NO → **useEcho** — safe default

---

## Rationale

`useEcho` defaults to private channel subscription, triggering an HTTP POST to `/broadcasting/auth`. For public channels, this auth call is wasted latency. `useEchoPublic` subscribes to a public channel directly, bypassing the auth endpoint entirely.

---

## Recommended Default

**Default:** `useEcho` for private channels, `useEchoPublic` for public channels
**Reason:** Matches channel type to auth requirements; avoids unnecessary auth requests for public data.

---

## Risks Of Wrong Choice

Using `useEcho` for public channels adds unnecessary auth latency. Using `useEchoPublic` for private channels fails silently (subscription denied by WebSocket server).

---

## Related Rules

Always Match Hook to Channel Type

---

## Related Skills

Select and Implement Channel Types

---

---

## Connection Status Monitoring Scope

---

## Decision Context

Where to place `useConnectionStatus()` for optimal performance.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Need to show connection status in multiple child components?
↓
YES → **Call once at layout/app level**; pass status down via context/props
NO → Single component needs connection status?
    ↓
    YES → **Call in that component only**
    NO → **Don't call it** — avoid unnecessary listeners

---

## Rationale

Each `useConnectionStatus()` call registers event listeners on the Echo connector. Multiple instances across components create redundant listeners, increasing memory and processing overhead.

---

## Recommended Default

**Default:** Call `useConnectionStatus()` once at the app shell level
**Reason:** Single source of truth for connection state; avoids redundant listeners; pass via context for child consumption.

---

## Risks Of Wrong Choice

Multiple `useConnectionStatus()` instances create redundant event listeners, causing unnecessary processing and potential race conditions in connection state display.

---

## Related Rules

Centralize Connection Status Monitoring

---

## Related Skills

Configure Echo for Frontend Subscriptions
