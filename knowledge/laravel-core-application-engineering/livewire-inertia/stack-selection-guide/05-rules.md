## Rule: Match Stack to Team Skills

Choose Livewire or Inertia based on the team's existing skill set, not on popularity or feature checklists.

---

## Category

Architecture

---

## Rule

Select the frontend stack based on the team's primary expertise. Choose Livewire for PHP-focused backend teams with minimal JavaScript experience. Choose Inertia for teams with TypeScript/React/Vue expertise building complex client interactions.

---

## Reason

A PHP team forced into a React/Vue codebase has a steep learning curve that slows development for months. An experienced JS team forced into Livewire cannot leverage their component ecosystem, state management, or TypeScript skills. The wrong stack for the team causes persistent productivity loss.

---

## Bad Example

`
Team: 3 backend PHP devs, no React experience
Choice: Inertia + React ("it's the modern approach")
Result: Slow development, messy JS code, team demoralized
`

---

## Good Example

`
Team: 3 backend PHP devs, no React experience
Choice: Livewire
Result: Fast MVP, leverages existing PHP skills, minimal JS
`

---

## Exceptions

If the application has unavoidable requirements that only one stack can satisfy (e.g., client-side 3D rendering that requires the React ecosystem), the stack choice overrides team preference. Invest in training or hire for the needed skills.

---

## Consequences Of Violation

Productivity risks: slower development, longer ramp-up time. Quality risks: poor frontend code from inexperienced team.

---

## Rule: Choose Livewire for CRUD and Admin

Use Livewire for CRUD-heavy applications, admin panels, internal tools, and server-driven forms.

---

## Category

Architecture

---

## Rule

Default to Livewire for projects where the primary UI pattern is forms, tables, search, and CRUD operations. Livewire's server-driven model excels at these patterns with minimal JavaScript overhead.

---

## Reason

Livewire's AJAX-driven component model maps naturally to form submissions, table sorting/filtering, and inline editing — no custom JavaScript or client-state management needed. Inertia's React/Vue tooling overhead is not justified when the UI consists of forms and tables that Livewire handles natively.

---

## Bad Example

`
10-page CRUD admin panel built with Inertia + React
- React Router, state management, TypeScript boilerplate
- Form validation duplicated client and server side
- 100KB+ JS bundle for simple table CRUD
`

---

## Good Example

`
10-page CRUD admin panel built with Livewire
- Zero JavaScript written by the team
- Server-side validation only (simpler)
- ~30KB Livewire bundle
`

---

## Exceptions

If the admin panel includes complex client-side interactions (drag-drop reordering, inline charts, dynamic forms) that are difficult with Livewire's server-round-trip model, Inertia may be justified.

---

## Consequences Of Violation

Over-engineering: unnecessary JS tooling for simple CRUD. Performance: larger bundle, more complex deployment.

---

## Rule: Choose Inertia for Complex Client UIs

Use Inertia when the application demands rich client-side interactivity, TypeScript, or SSR.

---

## Category

Architecture

---

## Rule

Choose Inertia when the application needs complex client state management (drags, canvas, real-time updates), TypeScript throughout the stack, SSR for SEO-critical public pages, or integration with the React/Vue/Svelte ecosystem.

---

## Reason

Livewire's server-round-trip model adds latency for every interaction. For applications where users expect instant feedback — drag-drop, canvas drawing, real-time collaboration — this latency is unacceptable. Inertia's client-side rendering provides sub-10ms interaction feedback and access to the full JS ecosystem.

---

## Bad Example

`
Dashboard with drag-drop kanban boards built in Livewire
- 500ms server round trip per drag action
- Poor UX, laggy feel
- Difficult to implement client-side animations
`

---

## Good Example

`
Dashboard with drag-drop kanban boards built in Inertia + React
- Sub-10ms drag feedback (client-side)
- React DnD library handles drag-drop
- Server update fires in background
`

---

## Exceptions

Simple "like" toggles, accordions, and other lightweight interactions can be handled by Livewire or Alpine.js within Livewire. Inertia is not required for minor interactivity.

---

## Consequences Of Violation

Performance risks: laggy interactions due to server round trips. Developer frustration: fighting the framework for client-heavy features.

---

## Rule: Never Mix Stacks on the Same Page

Every route must be exclusively Livewire or Inertia. Never render both on the same URL.

---

## Category

Architecture

---

## Rule

Define each route as either Livewire-only or Inertia-only. Use route prefixes to enforce the boundary. Never embed a Livewire component inside an Inertia page or vice versa.

---

## Reason

Livewire and Inertia use incompatible DOM management strategies. Livewire manages its section of the DOM via Alpine.js morphing. Inertia manages the full page via client-side routing. Embedding one inside the other causes conflicting DOM updates, broken interactivity, and unpredictable rendering behavior.

---

## Bad Example

`php
// Route handled by Inertia, but Blade template has Livewire component
Route::get('/dashboard', [DashboardController::class, 'index']);

// In dashboard.blade.php:
@inertia
<livewire:stats-widget /> // Mixing stacks — broken
`

---

## Good Example

`php
// Clear route-level separation
Route::prefix('/admin')->group(base_path('routes/livewire.php'));
Route::prefix('/app')->group(base_path('routes/inertia.php'));
`

---

## Exceptions

The root Blade template that renders @inertia is shared infrastructure, not a page. It does not constitute mixing stacks.

---

## Consequences Of Violation

Reliability risks: conflicting DOM updates, broken interactivity. Maintenance risks: impossible to debug hybrid rendering issues.

---

## Rule: Consider SSR Before Choosing Inertia

Evaluate SSR requirements before choosing Inertia. If SSR is needed for SEO, Inertia requires a Node.js server alongside Laravel.

---

## Category

Architecture

---

## Rule

If the application has public-facing pages that require SEO (content pages, landing pages, marketing sites) and the team chooses Inertia, budget for a Node.js SSR server in production infrastructure. If running a Node.js server is not feasible, consider Livewire (which is always server-rendered) or Inertia without SSR (accepting lower SEO).

---

## Reason

Inertia pages without SSR send an empty HTML shell to crawlers — most search engines do not execute JavaScript and see blank pages. Full SEO requires Inertia's SSR, which adds a Node.js rendering server, process management, memory overhead, and DevOps complexity. Livewire serves fully rendered HTML by default.

---

## Bad Example

`
Choosing Inertia for a public-facing blog
- No SSR infrastructure budgeted
- Search engines see empty HTML
- No SEO benefit from the application
`

---

## Good Example

`
Choosing Inertia for a public-facing blog
- SSR server deployed as PM2 cluster
- Full HTML sent to crawlers
- SEO requirements met
`

---

## Exceptions

If the Inertia application is fully authenticated (no public pages), SSR is unnecessary regardless of the stack choice.

---

## Consequences Of Violation

SEO risks: public pages invisible to search engines. Infrastructure gaps: unplanned Node.js server deployment.

---

## Rule: Evaluate Real-Time Requirements

Assess real-time data needs before choosing a stack. Livewire has built-in polling and events; Inertia requires WebSocket integration.

---

## Category

Architecture

---

## Rule

If the application needs real-time updates (live notifications, live chat, live stock tickers), consider Livewire's built-in polling (wire:poll) and event system. If choosing Inertia, budget for WebSocket integration (Laravel Echo, Pusher, Soketi) and associated client-side state management.

---

## Reason

Livewire supports real-time interactions through wire:poll (polling) and $dispatch events natively — no additional services or packages needed. Inertia has no built-in real-time support; every real-time feature requires WebSocket infrastructure, event broadcasting setup, and client-side subscription logic.

---

## Bad Example

`
Choosing Inertia for a real-time dashboard
- No WebSocket infrastructure planned
- Attempting to use polling via setInterval + router.reload()
- Poor UX compared to WebSocket push
`

---

## Good Example

`
Choosing Livewire for a real-time dashboard
- wire:poll handles regular updates
-  for cross-component events
- No additional real-time infrastructure
`

---

## Exceptions

If the team already has WebSocket infrastructure (existing Node.js services, Pusher subscription) or needs WebSockets for non-Inertia features, Inertia's real-time gap is already filled.

---

## Consequences Of Violation

Performance risks: polling overhead from polling-only real-time. Infrastructure gaps: unplanned WebSocket setup.
