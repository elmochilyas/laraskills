# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Stack Selection Guide |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

The Livewire vs Inertia decision is the most consequential frontend architecture choice in Laravel. Livewire enables dynamic interfaces using server-rendered HTML with minimal JavaScript. Inertia bridges Laravel with full JavaScript frameworks (React, Vue, Svelte). The wrong choice leads to developer frustration, poor DX, and maintenance burden. The engineering value is choosing the right tool for the team's skills, the application's interactivity needs, and the long-term maintainability requirements.

---

## Core Concepts

- **Livewire**: Server-driven UI — PHP component + Blade template, AJAX synchronization, ~30KB bundle
- **Inertia**: Server-routed SPA — Laravel controllers provide data, React/Vue/Svelte renders pages, ~100KB+ bundle
- **Decision criteria**: Team skills, interactivity level, SEO requirements, time to MVP, real-time needs
- **Server-side state** (Livewire) vs **client-side state** (Inertia + React Query, Pinia, etc.)

---

## When To Use

**Livewire**: PHP-focused backend teams, CRUD dashboards, admin panels, internal tools, MVPs, Blade codebases
**Inertia**: JS/TS-capable full-stack teams, complex interactive UIs, SEO-critical public pages, mobile app future likely, TypeScript requirement

## When NOT To Use

- Livewire for drag-drop/canvas-level interactivity (server round-trip overhead too high)
- Inertia for simple CRUD with a backend-only team (JS learning curve not justified)
- Both in the same page (choose one per route)

---

## Best Practices

- **Evaluate based on concrete criteria, not personal preference** — team skills, interactivity level, SEO needs
- **Choose Livewire for PHP-dominant teams** — the learning curve for React/Vue on top of Laravel is steep
- **Choose Inertia for JS-capable teams building complex UIs** — full component ecosystem, TypeScript, advanced state management
- **Consider SSR requirements** — Inertia has built-in SSR; Livewire is naturally server-rendered
- **Consider real-time needs** — Livewire has built-in polling and events; Inertia needs WebSocket library integration
- **Start with Livewire for MVPs** — faster time to market; migrate to Inertia later if complexity demands it

---

## Architecture Guidelines

- Routes are server-defined in both stacks — Inertia doesn't expose a public API
- Both stacks share the same Laravel middleware, auth, session, and CSRF protection
- Livewire components live in `app/Livewire/` with Blade templates in `resources/views/livewire/`
- Inertia page components live in `resources/js/Pages/` with controllers returning `Inertia::render()`
- The decision can be made per-route prefix (hybrid approach) but not per-page

---

## Performance

Livewire: ~30KB JS payload, server renders HTML (fast initial load for Blade-savvy apps), AJAX updates for interactivity. Inertia: ~100KB+ JS payload (framework-dependent), initial JSON load + client-side rendering, SSR available for SEO. Livewire generally faster for CRUD-heavy apps; Inertia faster for complex client interactions.

---

## Security

Both stacks run through Laravel's full middleware pipeline — authentication, CSRF, and authorization apply equally. Livewire includes checksum-based security for component state. Inertia's server-props are JSON-serialized — avoid passing sensitive data through client-visible props.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Choosing by hype not fit | "Inertia is more modern" | PHP team struggles with JS complexity | Match stack to team skills |
| Livewire for complex UIs | Avoiding JavaScript | Slow interactions, poor UX | Use Inertia for drag-drop/canvas |
| Inertia for simple CRUD | JS ecosystem familiarity | Over-engineering, slower development | Use Livewire for CRUD admin panels |
| Not considering SSR | Assuming all pages need SEO | Unnecessary complexity | Only use SSR for public-facing pages |
| Mixing stacks on same page | Hybrid without clear boundaries | Confusing architecture | Never mix Livewire and Inertia on same page |

---

## Anti-Patterns

- **Stack selection by popularity**: Choosing Inertia because "everyone uses React" when the team is PHP-focused
- **Over-engineering the frontend**: Using Inertia + React for a 10-page CRUD admin panel
- **Under-engineering the frontend**: Using Livewire for a drag-drop dashboard with real-time collaboration
- **Hybrid without plan**: Using both stacks without clear route-level separation

---

## Examples

**Decision: Livewire for admin panel:**
```
Team: 3 backend PHP devs, minimal JavaScript
App: Inventory management dashboard
Needs: Forms, tables, search, real-time stock updates
Decision: Livewire — JS complexity doesn't justify Inertia investment
```

**Decision: Inertia for public app:**
```
Team: Full-stack with React expertise
App: SaaS platform with complex dashboard, SEO landing pages
Needs: TypeScript, rich interactions, SSR for marketing pages
Decision: Inertia — React ecosystem and SSR capabilities needed
```

---

## Related Topics

- hybrid-approaches — Using both stacks in one application
- livewire/component-architecture — Livewire fundamentals
- inertia/page-components — Inertia fundamentals
- livewire/testing — Livewire testing patterns
- inertia/testing — Inertia testing patterns

---

## AI Agent Notes

- Livewire is server-driven with AJAX updates; Inertia is a server-routed SPA
- The decision is based on team skills, interactivity level, and SEO requirements
- Both stacks share Laravel middleware, auth, and session
- Livewire has built-in real-time features (polling, events); Inertia needs external libraries
- Inertia's SSR requires a Node.js server process running alongside Laravel
- The wrong choice leads to developer frustration and maintenance burden

---

## Verification

- [ ] Stack selection documented with rationale
- [ ] Decision based on team skills and app requirements
- [ ] Team capable of chosen stack's requirements
- [ ] SSR strategy decided (needed or not)
- [ ] Real-time requirements evaluated
- [ ] Mobile/future API needs considered
- [ ] Bundle size implications understood
- [ ] Not mixing stacks on same page
