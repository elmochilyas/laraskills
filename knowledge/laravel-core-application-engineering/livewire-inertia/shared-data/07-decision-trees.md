# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Inertia Shared Data
**Generated:** 2026-06-03

---

# Decision Inventory

* Shared Data via HandleInertiaRequests vs Manual Passing
* Direct Values vs Closures for Shared Data
* Single share() Call vs Multiple share() Calls

---

# Architecture-Level Decision Trees

---

## Decision 1: Shared Data via HandleInertiaRequests vs Manual Passing

---

## Decision Context

Whether to inject global page data via the `HandleInertiaRequests` middleware's `share()` method or manually pass it from each controller.

---

## Decision Criteria

* Whether the data is needed on EVERY page (layout, auth, flash messages)
* Whether the data is page-specific and needed only on a subset of pages
* Whether the data should be automatically available to all Inertia pages
* Whether the shared data can be derived from the request

---

## Decision Tree

Is the data needed on every page (auth user, flash messages, app configuration)?
↓
YES → Use `HandleInertiaRequests::share()` — automatically included in every Inertia response
NO → Is the data needed on most pages (>80%)?
    YES → Use `HandleInertiaRequests::share()` — DRY for widely-used data
    NO → Is the data needed only on a single page or small subset of pages?
        YES → Pass via controller's `Inertia::render()` — page-specific props
        NO → Pass via controller — shared data is for globally needed props only

---

## Rationale

Shared data is sent with EVERY Inertia response. Every byte of shared data increases EVERY page's payload. Only include data that is genuinely needed on every page. Page-specific data belongs in the controller's `Inertia::render()` call where it's only included on that page's response.

---

## Recommended Default

**Default:** Auth user, flash messages, and app config in shared data. Everything else passed via controller props.
**Reason:** Shared data bloat is the most common Inertia performance issue. Every shared prop increases every page's payload. The 80% threshold ensures shared data remains minimal.

---

## Risks Of Wrong Choice

* Page-specific data in shared: Every page pays the payload cost for data used on 2 pages
* Auth user not in shared: Every controller must fetch the authenticated user — repetitive
* Flash messages not in shared: Flash messages don't appear — users miss success/error feedback
* Sensitive data in shared: Admin data visible to all users in page source — security risk

---

## Related Rules

* Keep Shared Data Minimal

---

## Related Skills

* Configure and Type Shared Data

---

---

## Decision 2: Direct Values vs Closures for Shared Data

---

## Decision Context

Whether to provide shared data as direct values (evaluated once when middleware runs) or closures (evaluated lazily on each request).

---

## Decision Criteria

* Whether the value is static (never changes) or dynamic (per-request)
* Whether the computation is expensive (database query, API call)
* Whether the value should be evaluated only when the page is actually rendered
* Whether the value depends on the current request state

---

## Decision Tree

Is the value static across all requests (app name, version, build hash)?
↓
YES → Use direct value — evaluated once, shared across all requests
NO → Does the value depend on the current request (authenticated user, session data)?
    YES → Use closure — `fn() => $request->user()` is evaluated per-request
    NO → Is the computation expensive (database query, API call)?
        YES → Is the data used on every page?
            YES → Use closure — evaluate per-request, but cache within the request
            NO → Don't put in shared data at all — pass via controller
        NO → Use direct value or closure — either works, closure is safer for dynamic data

---

## Rationale

Direct values are evaluated once when `share()` is called. Closures are evaluated lazily when the page is rendered. Most shared data is dynamic (auth user, flash messages) and should use closures. Static values (app config, build info) can be direct values.

---

## Recommended Default

**Default:** Use closures for shared data. Only use direct values for truly static, never-changing data.
**Reason:** Closures are evaluated lazily — if a page never renders (redirect, 404), the closure never runs. This prevents unnecessary computation. Most shared data (auth, flash) is per-request anyway.

---

## Risks Of Wrong Choice

* Direct value for auth: Auth user fetched once — wrong user shown if middleware runs before auth resolves
* Closure for static config: Unnecessary closure overhead — `fn() => 'AppName'` is wasted indirection
* Expensive closure on non-rendered page: Query runs even for redirects — wasted computation
* Closure that throws: Unhandled exception in closure — 500 error on every page

---

## Related Rules

* Closures for Dynamic Shared Data

---

## Related Skills

* Configure and Type Shared Data

---

---

## Decision 3: Single share() Call vs Multiple share() Calls

---

## Decision Context

Whether to define all shared data in a single `share()` method return or spread it across multiple `Inertia::share()` calls.

---

## Decision Criteria

* Number of shared data keys (1-5 is simple, 10+ needs organization)
* Whether shared data comes from different sources (middleware, service provider, runtime)
* Whether shared data should be conditionally included
* Whether the team prefers centralized or distributed configuration

---

## Decision Tree

Does the shared data come from different sources (some from middleware, some from service providers)?
↓
YES → Use multiple `share()` calls — each source owns its contribution
NO → Is the shared data configuration simple (3-5 keys)?
    YES → Single return in `HandleInertiaRequests::share()` — simple, all in one place
    NO → Are there 6+ shared data keys?
        YES → Extract to dedicated methods on the middleware class — shared data keys organized by concern
        NO → Single return — still manageable
NO → Is shared data conditionally included based on route or authorization?
    YES → Use closures with conditional logic — closures can check request state
    NO → Single `share()` return — centralized, easy to audit

---

## Rationale

A single `share()` return is the cleanest approach for small to medium shared data sets. Multiple `share()` calls are needed when shared data comes from different locations (middleware, service providers, event listeners). Extracting to dedicated methods helps organize large shared data sets.

---

## Recommended Default

**Default:** Single `share()` method return in `HandleInertiaRequests` for 1-5 keys. Multiple `share()` calls or method extraction for larger sets or multi-source data.
**Reason:** A single return is easy to audit for performance and security. Multiple calls scatter the shared data definition across the codebase.

---

## Risks Of Wrong Choice

* Single 20-key return: Monolithic share method — hard to read, hard to selectively disable
* Multiple scattered calls: Hard to audit what shared data exists — duplicates, stale keys
* No organization at 15 keys: "Where is the notifications count set?" — search through 10 files
* Conditionals in return: Share method grows complex — extraction to methods improves readability

---

## Related Rules

* Keep Shared Data Minimal

---

## Related Skills

* Configure and Type Shared Data
