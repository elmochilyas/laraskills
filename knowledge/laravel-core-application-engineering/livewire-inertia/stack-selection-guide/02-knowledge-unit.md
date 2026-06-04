# Stack Selection Guide: Livewire vs Inertia

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Stack Selection Guide
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

The Livewire vs Inertia decision is the most consequential frontend architecture choice in Laravel. Livewire enables dynamic interfaces using server-rendered HTML with minimal JavaScript. Inertia bridges Laravel with full JavaScript frameworks (React, Vue, Svelte). The wrong choice leads to developer frustration, poor DX, and maintenance burden.

The engineering value is choosing the right tool for the team's skills, the application's interactivity needs, and the long-term maintainability requirements. This guide provides a structured decision framework based on concrete criteria — not personal preference or hype.

---

## Core Concepts

### Decision Matrix

| Criterion | Livewire | Inertia |
|---|---|---|
| **Team Skills** | PHP-focused backend devs | JS/TS-focused full-stack devs |
| **Interactivity Level** | Low to medium | High (complex UIs) |
| **Component Library** | Alpine + Tailwind | React/Vue ecosystem |
| **SEO Requirements** | None (SSR not needed) | SSR required for SEO |
| **Mobile App Future** | Unlikely | Likely (API + JS client) |
| **Time to MVP** | Faster (PHP only) | Slower (JS tooling setup) |
| **Real-time Features** | Built-in (polling, events) | Requires WebSocket library |
| **Bundle Size** | ~30KB (Alpine + Livewire) | ~100KB+ (React/Vue) |
| **Offline Support** | Limited | Better (PWA, service workers) |
| **State Management** | Server-side (automatic) | Client-side (React Query, etc.) |

### Decision Flowchart

```
Does the team have JS framework expertise (React/Vue)?
├── No  → Livewire (mandatory — learning curve too steep)
├── Yes → Is SEO critical for the majority of pages?
│         ├── Yes → Inertia (SSR needed)
│         ├── No  → Is the UI highly interactive (drag-drop, canvas)?
│         │         ├── Yes → Inertia (React/Vue ecosystem needed)
│         │         ├── No  → Is the app mostly CRUD + filters + tables?
│         │         │         ├── Yes → Livewire (faster development)
│         │         │         ├── No  → Evaluate specifics:
│         │         │         │         - Real-time updates → Livewire (easier)
│         │         │         │         - Mobile app future → Inertia (API + JS client)
│         │         │         │         - Bundle size concern → Livewire (~30KB)
│         │         │         │         - TypeScript required → Inertia
```

---

## Mental Models

### The Decision Framework

Think of the stack selection as a decision tree. Each branch represents a criterion (team skills, interactivity level, SEO requirements). The decision is not about which stack is "better" — it's about which stack is better suited for the specific combination of team, application, and business constraints.

### The Tool-First Approach

The engineering mindset is to evaluate tools based on concrete criteria, not familiarity or trend. Livewire excels at server-driven simplicity for PHP teams. Inertia excels at rich client interactivity for JS-capable teams. The right choice maximizes team velocity and application quality for the specific context.

---

## Architectural Decisions

### When to Choose Livewire

### Team Profile
- Backend PHP developers with minimal JavaScript
- Small team (1-3 devs) where JS specialization isn't viable
- Agency projects where delivery speed > architecture purity

### Application Profile
- **CRUD dashboards** — tables, forms, modals, filters
- **Admin panels** — moderate interactivity, data-heavy
- **Internal tools** — SEO irrelevant, performance sufficient
- **Content management** — Livewire + Trix/Quill for rich text
- **MVP/prototypes** — fastest path from idea to working UI

### Technical Drivers
- Server-side state is natural (form state lives on the server)
- Real-time updates via polling or server-sent events
- Minimal JavaScript bundle (Alpine is ~10KB gzipped)
- No SSR infrastructure needed (HTML is already server-rendered)
- Blade components already exist in the codebase (gradual migration)

### Example Decision

```php
// This team has 3 backend PHP devs, building an inventory management dashboard.
// They need forms, tables, search, and real-time stock updates.
// Decision: Livewire. JS complexity doesn't justify Inertia investment.
```

---

### When to Choose Inertia

#### Team Profile
- Full-stack developers comfortable with React/Vue/Svelte
- Dedicated frontend resources available
- TypeScript expertise in the team

#### Application Profile
- **Complex SPAs** — drag-and-drop, canvas, complex state
- **Public-facing apps** — SEO critical (SSR needed)
- **Rich interactive UIs** — data visualization, complex forms with dynamic fields
- **Mobile companion apps** — sharing API with React Native
- **Multi-client architecture** — same API powers web + mobile

#### Technical Drivers
- Rich component ecosystem (Radix UI, Headless UI, shadcn/ui, Mantine)
- SSR for SEO and initial load performance
- Full TypeScript support across the stack
- Offline-first or PWA requirements
- Existing React/Vue/Svelte expertise in the team
- Need for complex client-side state management (Redux, Zustand, TanStack Query)

#### Example Decision

```php
// This team has 2 backend + 2 React devs, building a public-facing analytics platform.
// They need SSR for SEO, complex chart interactions, and a future mobile app.
// Decision: Inertia + React.
```

---

## Internal Mechanics

### Deployment Topology

| Concern | Livewire | Inertia |
|---|---|---|
| Servers needed | PHP server only | PHP + Node (SSR) — optional |
| Build step | None (livewire.js CDN) | Vite build required |
| CDN caching | Yes (full HTML) | Full page only (SSR HTML) |
| Horizontal scaling | PHP scaling | PHP + Node SSR cluster |

### Testing Strategy

| Concern | Livewire | Inertia |
|---|---|---|
| Server tests | Livewire testing helpers | AssertableInertia |
| JS tests | Not needed | Vitest + Testing Library |
| E2E tests | Laravel Dusk | Playwright / Cypress |

### Migration Path

Livewire → Inertia is a rewrite (Blade → JS components). There is no gradual migration path per page. Feature-level rewrites are the smallest viable increment.

Inertia → Livewire is similarly a rewrite. The rendering model difference is fundamental.

---

## Patterns

### Hybrid Approaches

Some applications benefit from using both across different sections:

| Approach | Livewire Pages | Inertia Pages |
|---|---|---|
| Admin panel (Livewire) + Public site (Inertia) | `/admin/*` | `/*` (marketing, pricing, docs) |
| Simple pages (Livewire) + Complex dashboards (Inertia) | `/settings/*`, `/profile/*` | `/analytics/*`, `/reports/*` |
| Legacy migration | Old pages | New pages added incrementally |

Both can coexist in the same Laravel app as long as they don't share the same URL:

```php
// web.php
// Livewire routes
Route::prefix('/admin')->group(function () {
    Route::get('/users', App\Livewire\UsersList::class);
});

// Inertia routes
Route::get('/dashboard', [DashboardController::class, 'index']);
Route::get('/analytics', [AnalyticsController::class, 'index']);
```

---

## Tradeoffs

| Factor | Winner | Reason |
|---|---|---|
| Development speed (simple UIs) | Livewire | PHP only, no build step, no JS |
| Development speed (complex UIs) | Inertia | React dev tools, component ecosystem |
| Bundle size | Livewire | ~30KB vs ~100KB+ |
| SEO | Inertia | SSR support |
| Real-time | Livewire | Built-in |
| TypeScript | Inertia | Full TS support |
| Offline | Inertia | Service workers, PWA |
| Learning curve | Livewire | PHP knowledge sufficient |
| Ecosystem | Inertia | React/Vue ecosystem |
| SSR infrastructure | Livewire | Not applicable |

---

## Performance Considerations

Livewire interactions trigger a full component re-render on the server with typical round-trips of 50-200ms. Inertia pages load a larger JS bundle (~100KB+) initially but benefit from client-side navigation on subsequent interactions. Livewire's bundle is smaller (~30KB with Alpine) but every interaction requires a server round-trip. Inertia with SSR improves initial load performance at the cost of additional Node.js infrastructure.

---

## Production Considerations

- Make the stack decision at project start — retrofitting the other stack is expensive
- Document the decision rationale in your project's ADR (Architecture Decision Record)
- Revisit the decision annually as team skills evolve
- Consider a small proof-of-concept in each stack before committing
- Factor in hiring: Livewire devs are harder to find than Laravel devs; Inertia devs overlap with the broader React/Vue market

---

## Common Mistakes

### Picking Livewire for the Wrong Reasons

- **"I don't want to learn JavaScript"** — You'll still need Alpine for Livewire interactions
- **"It's faster to develop"** — True for simple UIs; false for complex interactive UIs where React's component model shines
- **"It's the Laravel way"** — Inertia is also first-party. Both are "the Laravel way"

### Picking Inertia for the Wrong Reasons

- **"SPAs are better"** — SPAs add complexity. Only adopt if the application genuinely needs it
- **"We might need it later"** — Premature abstraction. Start with Livewire for simpler needs
- **"SSR is required"** — Confirm SEO requirements actually apply. Many "SEO critical" pages are served to authenticated users who crawlers never see

### Using Both in the Same Page

Livewire and Inertia cannot coexist in the same page. A page is either Blade (with Livewire components) or an Inertia page (with React/Vue). Mixing them creates conflicting routing, rendering, and state management models.

### Letting Personal Preference Drive the Decision

"I prefer React" or "I hate JavaScript" are not engineering criteria. Base the decision on team skills, application requirements, and long-term maintenance.

### Choosing by GitHub Stars

Livewire and Inertia both have substantial communities. Star count is not a proxy for suitability. Evaluate against your specific criteria.

### Assuming "Modern" Means One over the Other

Both are modern approaches. Livewire v3 is actively maintained. Inertia v3 is actively maintained. Neither is "legacy."

---

## Failure Modes

### Wrong Stack Decision

Choosing the wrong stack is the primary failure mode. Livewire for a complex SPA with rich interactivity leads to fighting against the framework's limitations. Inertia for a simple CRUD app adds unnecessary JavaScript complexity. Mitigate with honest team skill assessment and a proof-of-concept before committing.

### Team Skill Mismatch

A team with no React experience adopts Inertia. Productivity drops for weeks while learning the framework. The opposite is also true: a React team forced into Livewire may feel constrained. Mitigate by choosing the stack that matches the team's current (not aspirational) skill set.

### Stack Lock-In

Once committed, switching from Livewire to Inertia (or vice versa) is effectively a rewrite. The rendering models are fundamentally different. Mitigate by making the decision carefully and revisiting annually.

---

## Ecosystem Usage

Both Livewire and Inertia are first-party Laravel tools sponsored by the Laravel core team. Livewire integrates with Alpine.js and Blade. Inertia integrates with React, Vue 3, and Svelte adapters. Both leverage the full Laravel ecosystem: Eloquent, authentication, authorization, caching, queues, events, and validation. The shared ecosystem means that switching between stacks does not require changing the backend architecture — only the frontend rendering layer.

---

## Related Knowledge Units

- **Hybrid Approaches** (this workspace) — using both stacks in the same app
- **Livewire Component Architecture** (this workspace) — deep dive into Livewire model
- **Inertia Page Components** (this workspace) — deep dive into Inertia model
- **Blade Layout Strategies** (this workspace) — traditional rendering (baseline comparison)
- **Feature-based Structure** (this workspace) — organizing code regardless of stack choice

---

## Research Notes

- Livewire v3 is the current stable version — uses Alpine under the hood for client reactivity
- Inertia v3 is the current stable version — supports React, Vue 3, and Svelte adapters
- Both are officially sponsored by Laravel
- The "stack" decision is orthogonal to API design — REST/GraphQL decisions are independent
- Some teams successfully run both stacks in different sections of the same app
- There is no technical advantage to "purity" — pragmatic mixed usage is valid
- Laravel Bootcamp offers tutorials for both stacks — evaluate both before deciding
