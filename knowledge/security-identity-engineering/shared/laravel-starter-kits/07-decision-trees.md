# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Additional Security Concerns
**Knowledge Unit:** Laravel Starter Kits (React, Vue, Svelte, Livewire — Current)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Starter Kit Frontend Stack Selection | Which frontend stack to choose | team expertise, requirements |
| 2 | Starter Kit vs Custom Fortify Backend | Pre-built scaffolding vs manual auth backend | development speed, customization |

---

# Architecture-Level Decision Trees

---

## Starter Kit Frontend Stack Selection

---

## Decision Context

Choosing between React, Vue, Svelte, or Livewire Starter Kits — all provide identical backend auth (Fortify + Sanctum + Passkeys) but different frontend stacks.

---

## Decision Criteria

* team expertise
* requirements

---

## Decision Tree

What is the team's primary frontend expertise?
↓
React → Install React Starter Kit (`php artisan install:react`)
Vue → Install Vue Starter Kit (`php artisan install:vue`)
Svelte → Install Svelte Starter Kit (`php artisan install:svelte`)
Livewire (PHP-based, no JS framework) → Install Livewire Starter Kit (`php artisan install:livewire`)
No strong preference → Livewire for simpler apps, React for complex SPAs

Is the application a simple CRUD app or a complex SPA?
↓
Simple CRUD (mostly server-rendered forms) → Livewire (faster development, no JS build complexity)
Complex SPA (rich interactivity, real-time updates) → React/Vue/Svelte (Inertia provides SPA feel)

Does the team want to avoid writing JavaScript?
↓
YES → Livewire (all PHP, minimal JS, Volt for single-file components)
NO → React/Vue/Svelte (choose based on team expertise or preference)

Will the application need real-time features (Reverb, WebSockets)?
↓
YES → Livewire (native Livewire + Reverb integration) or any Inertia stack
NO → All stacks work equally well

Is the application an Inertia-based SPA?
↓
YES → React, Vue, or Svelte (all use Inertia; choose based on component ecosystem preference)
NO → Livewire (server-rendered with Alpine.js for reactivity)

---

## Rationale

The frontend stack decision is largely independent of auth functionality — all Starter Kits provide identical backend auth via Fortify. The choice should be driven by team expertise and application requirements. Livewire is fastest for server-rendered apps with moderate interactivity. Inertia-based stacks (React/Vue/Svelte) are better for rich SPAs where complex client state management is needed.

---

## Recommended Default

**Default:** Livewire Starter Kit for most Laravel applications (simpler, no JS build complexity, native Reverb integration); React Starter Kit for teams with React expertise or SPAs requiring complex client state
**Reason:** Livewire eliminates the frontend JavaScript framework overhead while providing sufficient reactivity for most applications. React/Vue/Svelte are better for applications that need rich client-side interactivity beyond what Livewire provides efficiently.

---

## Risks Of Wrong Choice

- React for a team with no React experience: steep learning curve, slow development
- Livewire for a complex SPA: Livewire's server-rendered model struggles with rich client interactivity
- Not choosing a Starter Kit: building auth from scratch duplicates months of security-critical work
- Switching stacks after starting: requires rebuilding the entire frontend

---

## Related Rules

- Always Use Starter Kits for New Laravel Authentication (05-rules.md)
- Customize Auth via Fortify Actions, Not Published Files (05-rules.md)

---

## Related Skills

- Select and Configure Laravel Starter Kits for Auth Scaffolding (06-skills.md)

---

## Starter Kit vs Custom Fortify Backend

---

## Decision Context

Whether to use a Starter Kit (pre-built frontend + Fortify backend) or set up Fortify headlessly with a custom frontend.

---

## Decision Criteria

* development speed
* customization

---

## Decision Tree

Is the auth UI heavily customized (brand-specific design, custom UX)?
↓
YES → Custom frontend with Fortify headless backend (Starter Kit views would be replaced anyway)
NO → Starter Kit (pre-built views are customizable enough for most projects)

Is this an API-only application (mobile app backend)?
↓
YES → No Starter Kit needed — use Fortify headlessly + Sanctum for token/SPA auth
NO → Starter Kit provides both frontend and backend

Does the application need non-standard auth flows?
↓
YES → Custom Fortify backend (Starter Kit assumes standard login/register/reset/reverify)
NO → Starter Kit covers all standard auth flows

Is development speed the primary concern?
↓
YES → Starter Kit (hours vs weeks of auth development)
NO → Custom Fortify allows full control over UI and behavior

Is the team experienced with Laravel auth?
↓
Experienced → Custom Fortify is feasible and gives full control
Inexperienced → Starter Kit prevents security mistakes in custom auth implementation

---

## Rationale

Starter Kits provide the fastest path to a production-ready auth system with battle-tested security patterns. Custom Fortify backends are only justified when the auth UI has specific custom requirements that Starter Kit scaffolding cannot accommodate, or when building an API-only application where no UI is needed. The Fortify action pattern ensures even custom implementations get security patches automatically.

---

## Recommended Default

**Default:** Starter Kit for all new projects with a web UI; Fortify headlessly + Sanctum for API-only applications; custom frontend with Fortify backend only when UI requirements cannot be met by Starter Kit scaffolding
**Reason:** Starter Kits provide months of battle-tested auth security in a single command. Custom auth implementations inevitably miss security patterns. The overhead of replacing Starter Kit views is minimal compared to building auth from scratch.

---

## Risks Of Wrong Choice

- Building auth from scratch: misses security patterns (rate limiting, session regeneration, email verification)
- Starter Kit for API-only app: unnecessary frontend scaffolding to maintain
- Custom frontend with Starter Kit routes: fighting against the kit's assumptions
- No Starter Kit for inexperienced team: custom auth with security vulnerabilities

---

## Related Rules

- Always Use Starter Kits for New Laravel Authentication (05-rules.md)
- Customize Auth via Fortify Actions, Not Published Files (05-rules.md)

---

## Related Skills

- Select and Configure Laravel Starter Kits for Auth Scaffolding (06-skills.md)
