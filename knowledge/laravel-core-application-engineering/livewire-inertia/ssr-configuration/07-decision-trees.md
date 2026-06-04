# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Inertia SSR Configuration
**Generated:** 2026-06-03

---

# Decision Inventory

* SSR Enabled vs Client-Only Rendering
* SSR for All Pages vs Selective SSR
* @inertia Blade Directive vs <div id="app"> Manual Rendering

---

# Architecture-Level Decision Trees

---

## Decision 1: SSR Enabled vs Client-Only Rendering

---

## Decision Context

Whether to enable Inertia's Node.js SSR server for pre-rendering pages on the server.

---

## Decision Criteria

* Whether SEO is critical for public-facing pages
* Whether First Contentful Paint (FCP) needs improvement on slow networks
* Whether the team has DevOps capacity to manage an additional Node.js service
* Whether the application is authenticated-only (dashboard, admin)

---

## Decision Tree

Is the application an authenticated-only dashboard/admin panel (no public pages)?
↓
YES → Client-only rendering — SSR provides no SEO benefit, adds infrastructure cost
NO → Are SEO-critical public pages served through Inertia?
    YES → Enable SSR — search engines need HTML content, not an empty JS shell
    NO → Is FCP on slow networks a user experience concern?
        YES → Enable SSR — improves perceived performance on initial load
        NO → Does the team have capacity to manage a Node.js SSR service in production?
            YES → Enable SSR — provides SEO and performance benefits
            NO → Client-only — SSR infrastructure adds DevOps overhead

---

## Rationale

SSR pre-renders Inertia pages on the server, sending fully-formed HTML to the client. This improves SEO (crawlers see content) and initial load performance (users see content before JS loads). The cost is an additional Node.js service to manage, monitor, and scale.

---

## Recommended Default

**Default:** Enable SSR for public-facing Inertia applications. Client-only for authenticated-only applications (dashboards, admin panels).
**Reason:** Public pages need SEO and fast initial load. Authenticated pages don't benefit from SSR — search engines don't crawl them.

---

## Risks Of Wrong Choice

* No SSR for public pages: Search engines see empty HTML shell — pages not indexed, no organic traffic
* SSR for admin-only app: Unnecessary Node.js infrastructure — DevOps overhead without benefit
* SSR without PM2 clustering: Single-process SSR server — bottleneck under load
* SSR with timeout: Slow SSR requests timeout — falls back to client-only, but adds latency

---

## Related Rules

* SSR for Public Pages, Client-Only for Auth Pages

---

## Related Skills

* Configure and Deploy Inertia SSR

---

---

## Decision 2: SSR for All Pages vs Selective SSR

---

## Decision Context

Whether to enable SSR for all Inertia pages or selectively enable/disable SSR per page.

---

## Decision Criteria

* Whether some pages need SSR (public) and others don't (authenticated)
* Whether some pages are too dynamic for SSR (real-time dashboards)
* Whether the SSR server load is a concern
* Whether the application has a mix of SSR-eligible and SSR-ineligible pages

---

## Decision Tree

Does the application have a mix of public (SSR-needed) and authenticated (SSR-not-needed) pages?
↓
YES → Selective SSR — enable SSR only for public pages, disable for authenticated
NO → Does the application have pages that are too dynamic for SSR (real-time data)?
    YES → Selective SSR — skip SSR for highly dynamic pages, reduce server load
    NO → Is the SSR server under high load (CPU/memory limits)?
        YES → Selective SSR — SSR only the most important pages (landing, blog, docs)
        NO → SSR for all pages — consistent, simple configuration

---

## Rationale

SSR every page adds server load. Selective SSR reduces load by skipping pages that don't benefit from SSR (authenticated-only pages, real-time dashboards) or pages where SSR isn't critical (admin panels). Inertia supports per-page SSR control.

---

## Recommended Default

**Default:** SSR for all pages. Disable SSR only for authenticated-only pages or when SSR server load is a concern.
**Reason:** SSR provides benefits for all pages (faster initial paint) even if SEO isn't needed. Only disable when the SSR server is a bottleneck or the page is real-time/dynamic in a way that SSR doesn't help.

---

## Risks Of Wrong Choice

* SSR for real-time dashboard: SSR renders stale data — user sees outdated info before hydration
* No SSR for landing page: Search engine sees blank page — SEO impact
* SSR all pages with high traffic: SSR server becomes bottleneck — timeouts, degraded performance
* Selective SSR misconfigured: SSR disabled on a public page — SEO pages not pre-rendered

---

## Related Rules

* SSR for Public Pages, Client-Only for Auth Pages

---

## Related Skills

* Configure and Deploy Inertia SSR

---

---

## Decision 3: @inertia Blade Directive vs <div id="app"> Manual Rendering

---

## Decision Context

Whether to use the `@inertia` Blade directive or manually render `<div id="app">` in the root Blade layout.

---

## Decision Criteria

* Whether SSR is enabled (the `@inertia` directive supports SSR; manual `<div>` does not)
* Whether the application needs SSR HTML injection and meta tag extraction
* Whether the application is Inertia v2 vs v3
* Whether the team needs to customize the root shell rendering

---

## Decision Tree

Is SSR enabled for the application?
↓
YES → Use `@inertia` — required for SSR to work, handles HTML injection and meta tag extraction
NO → Is the application using Inertia v3?
    YES → Use `@inertia` — the directive works for client-only rendering too
    NO → Is the team customizing the root shell rendering (custom page data injection)?
        YES → Manual `<div id="app" data-page="{{ json_encode($page) }}">` — full control
        NO → Use `@inertia` — simpler, works for both SSR and client-only

---

## Rationale

The `@inertia` Blade directive is the modern Inertia standard. It conditionally outputs SSR HTML or the client shell, handles meta tag extraction, and ensures consistent rendering. Manual `<div id="app">` disables SSR and requires manual page data injection.

---

## Recommended Default

**Default:** Use `@inertia` in all Inertia applications, whether SSR is enabled or not.
**Reason:** `@inertia` is simpler and supports SSR when enabled. Manual `<div id="app">` only provides control over the shell if custom behavior is needed.

---

## Risks Of Wrong Choice

* Manual `<div id="app">` with SSR enabled: SSR never works — pages always client-rendered
* `@inertia` on custom shell: Can't inject custom data-page markup — limited customization
* No Blade directive at all: Root layout missing — Inertia never renders
* Mix of both: Some templates use `@inertia`, others use manual — inconsistent, confusing

---

## Related Rules

* Use @inertia Blade Directive

---

## Related Skills

* Configure and Deploy Inertia SSR
