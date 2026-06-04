# Skill: Evaluate and Select Frontend Stack

## Purpose

Systematically evaluate team skills, application requirements, and infrastructure constraints to choose between Livewire and Inertia for a Laravel project.

## When To Use

At the start of a new Laravel project, before writing any frontend code. Also when evaluating a stack migration for an existing project.

## When NOT To Use

- After significant frontend work has been done (cost of switching is high)
- When the team and requirements are already conclusively aligned with one stack
- For small prototypes where either stack works equally well

## Prerequisites

- Understanding of the application's feature set and interactivity requirements
- Knowledge of the team's JavaScript/TypeScript capabilities
- List of SEO-critical pages
- Real-time data requirements documented

## Inputs

- Team skill inventory (PHP vs JS/TS proficiency)
- Application feature list with interactivity levels
- SEO requirements per page
- Real-time data needs
- Infrastructure budget (Node.js SSR server if Inertia)

## Workflow

1. **Assess team skills**: Determine if the team is PHP-dominant (choose Livewire) or has strong JS/TS capabilities (choose Inertia)
2. **Evaluate interactivity level**: Identify pages requiring drag-drop, canvas, real-time updates (Inertia) vs forms, tables, CRUD (Livewire)
3. **Check SEO requirements**: If public-facing pages need SEO, Inertia requires a Node.js SSR server; Livewire is always server-rendered
4. **Assess real-time needs**: Livewire has built-in `wire:poll` and events; Inertia requires WebSocket integration (Laravel Echo, Pusher)
5. **Consider bundle size**: Livewire ~30KB vs Inertia ~100KB+ (framework-dependent)
6. **Evaluate time to MVP**: Livewire is faster for backend teams; Inertia may be slower initially but pays off for complex UIs
7. **Check mobile/API future**: If a mobile app or public API is likely, Inertia's client-server pattern is more transferable
8. **Document the decision**: Record the rationale, including rejected alternatives, in a decision record
9. **Validate with a prototype**: Build a small representative feature (e.g., a form with validation) in the chosen stack before full commitment

## Validation Checklist

- [ ] Stack selection documented with rationale referencing team skills and application requirements
- [ ] Team is capable of maintaining the chosen stack (training budgeted if needed)
- [ ] SSR strategy decided for Inertia (Node.js server budgeted and deployed)
- [ ] Real-time requirements evaluated against built-in capabilities vs WebSocket integration
- [ ] Bundle size implications understood and acceptable
- [ ] Mobile/future API needs considered in the decision
- [ ] Not planning to mix stacks on the same page

## Common Failures

- Choosing by popularity ("React is modern") instead of team skills — PHP team struggles for months
- Over-engineering with Inertia for a simple CRUD admin panel — unnecessary JS tooling
- Under-engineering with Livewire for a drag-drop dashboard — poor UX from server round trips
- Choosing Inertia without budgeting for SSR infrastructure — SEO pages invisible to crawlers
- Deciding hybrid approach without a clear route-level separation plan

## Decision Points

- **Team is PHP-only, app is CRUD admin panel** → Livewire (no contest)
- **Team has React experience, app has complex client interactions** → Inertia (no contest)
- **Team is PHP-only, app needs drag-drop kanban** → Hire/train JS developers and choose Inertia, or accept limitations of Livewire
- **App has public SEO pages and authenticated dashboard** → Inertia with SSR for public pages, SSR disabled for dashboard
- **App needs real-time notifications** → Livewire has built-in support; Inertia needs WebSocket infrastructure

## Performance Considerations

Livewire: ~30KB JS, server-rendered HTML, AJAX updates for interactivity. Inertia: ~100KB+ JS, client-side rendering, SSR available. Livewire is faster for CRUD-heavy apps; Inertia is faster for complex client interactions. Inertia's initial page load is slower (must load JS framework), subsequent navigations are faster (JSON only).

## Security Considerations

Both stacks run through Laravel's full middleware pipeline. Livewire includes checksum-based security for component state. Inertia props are JSON-serialized and visible in page source — never pass sensitive data through props. Server-side validation is mandatory for both stacks.

## Related Rules

- Match Stack to Team Skills (05-rules.md)
- Choose Livewire for CRUD and Admin (05-rules.md)
- Choose Inertia for Complex Client UIs (05-rules.md)
- Never Mix Stacks on the Same Page (05-rules.md)
- Consider SSR Before Choosing Inertia (05-rules.md)
- Evaluate Real-Time Requirements (05-rules.md)

## Related Skills

- Implement Route-Level Stack Segregation (hybrid-approaches)
- Configure and Deploy Inertia SSR (inertia/ssr-configuration)
- Create a Well-Structured Livewire Component (livewire/component-architecture)
- Create an Inertia Page Component with Typed Props (inertia/page-components)

## Success Criteria

- Stack selection documented with clear rationale matching team skills and app requirements
- Team is productive in the chosen stack within the expected ramp-up time
- No architectural regrets within the first 3 months of development
- SEO, real-time, and interactivity requirements are met by the chosen stack
- No pressure to switch stacks due to initial oversight
