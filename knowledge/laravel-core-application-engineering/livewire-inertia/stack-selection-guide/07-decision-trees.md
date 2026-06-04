# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Stack Selection Guide
**Generated:** 2026-06-03

---

# Decision Inventory

* Livewire vs Inertia for Frontend Stack Selection
* Team Skill-Based vs Feature-Based Stack Selection
* Incremental Adoption vs Full Commitment to Stack

---

# Architecture-Level Decision Trees

---

## Decision 1: Livewire vs Inertia for Frontend Stack Selection

---

## Decision Context

Whether to choose Livewire (server-driven UI) or Inertia (SPA with JS framework) as the frontend stack for a Laravel application.

---

## Decision Criteria

* Team's primary expertise (PHP vs JavaScript/TypeScript)
* Application interactivity requirements (simple CRUD vs complex client interactions)
* SEO requirements (SSR vs client-rendered)
* Time to MVP and development speed
* Real-time/WebSocket requirements

---

## Decision Tree

Is the team primarily PHP/backend developers with minimal JavaScript experience?
↓
YES → Choose Livewire — PHP-based, no JS framework knowledge required
NO → Does the application require complex client-side interactivity (drag-drop, canvas, complex state management)?
    YES → Choose Inertia + React/Vue/Svelte — Livewire's server round-trips are too slow for this
    NO → Is SEO critical for most pages (public-facing content site)?
        YES → Choose Inertia with SSR — Livewire's SSR is less mature
        NO → Is development speed to MVP the top priority?
            YES → Choose Livewire — faster to build dynamic UIs without JS build tooling
            NO → Does the team want to use TypeScript and modern JS tooling?
                YES → Choose Inertia — TypeScript, component ecosystem, modern DX
                NO → Choose Livewire — simpler stack, less JS tooling overhead

---

## Rationale

Livewire is the best choice for PHP teams building dynamic UIs without learning a JavaScript framework. Inertia is the best choice for teams with JS expertise building complex interactive applications. The team's skill set is the most important factor — a stack the team doesn't know will be poorly implemented regardless of technical merits.

---

## Recommended Default

**Default:** Livewire for PHP-focused teams building standard CRUD applications. Inertia for teams with TypeScript/React/Vue expertise building complex interactive UIs.
**Reason:** Team skill determines implementation quality. Livewire provides the fastest path to dynamic UIs for PHP developers. Inertia provides the best foundation for complex client interactions.

---

## Risks Of Wrong Choice

* Livewire for complex interactivity: Server round-trips for drag-drop actions — sluggish UX
* Inertia for PHP team: Steep JS learning curve — slow development, messy frontend code
* Inertia without SSR: SEO pages not crawled — search rankings drop
* Livewire for public SPA: No frontend framework — harder to build rich, interactive UX

---

## Related Rules

* Match Stack to Team Skills

---

## Related Skills

* Evaluate and Select Frontend Stack

---

---

## Decision 2: Team Skill-Based vs Feature-Based Stack Selection

---

## Decision Context

Whether to choose the frontend stack based on the team's existing skills or based on the application's technical requirements.

---

## Decision Criteria

* Team's current proficiency in PHP vs JavaScript/TypeScript
* Team's willingness and capacity to learn a new stack
* Application's long-term interactivity requirements
* Whether the team composition can change (hire JS developers)

---

## Decision Tree

Is the team willing and able to invest 3+ months learning a new frontend stack?
↓
YES → Does the application REQUIRE a specific stack for key features?
    YES → Choose based on application requirements — invest in learning
    NO → Choose based on team skills — no reason to force learning a new stack
NO → Is the application's interactivity level low (CRUD, forms, lists)?
    YES → Choose Livewire — well within Livewire's sweet spot
    NO → Does the team have budget to hire JS developers?
        YES → Hire, choose Inertia — new team members bring the required skills
        NO → Choose Livewire — maximize the existing team's productivity

---

## Rationale

Team skill is the most important factor because a poorly implemented stack causes more damage than the "wrong" stack well-implemented. Livewire with a skilled PHP team produces better results than Inertia with a struggling PHP team. Only choose based on requirements when the team is committed to learning or has budget to hire.

---

## Recommended Default

**Default:** Choose based on team skills. Only choose based on application requirements when the team is committed to learning or can hire for the skills.
**Reason:** A well-executed Livewire app outperforms a poorly-executed Inertia app, regardless of technical requirements. Team productivity is the binding constraint.

---

## Risks Of Wrong Choice

* Inertia for PHP team without learning investment: Poor JS code — runtime errors, unmaintainable frontend
* Livewire for experienced JS team: Frustrated team — can't use React ecosystem, TypeScript, or state management
* Requirements-based choice without team buy-in: Resentment — team doesn't want to learn the chosen stack
* No learning investment assumed: 2-week ramp-up for Inertia with React — unrealistic, takes months

---

## Related Rules

* Match Stack to Team Skills

---

## Related Skills

* Evaluate and Select Frontend Stack

---

---

## Decision 3: Incremental Adoption vs Full Commitment to Stack

---

## Decision Context

Whether to adopt the chosen stack incrementally (start with Blade, add components gradually) or commit fully from the start.

---

## Decision Criteria

* Whether the team is learning the stack for the first time
* Whether the project has tight deadlines
* Whether the application has a mix of static and dynamic pages
* Whether the team wants to validate the stack choice before committing

---

## Decision Tree

Is the team learning this stack for the first time?
↓
YES → Incremental adoption — start with simple components, add complexity as the team learns
NO → Is the application a greenfield project with clear requirements?
    YES → Full commitment — set up the stack properly from day one
    NO → Does the application have a mix of static and dynamic pages?
        YES → Incremental for new features — existing static pages stay as-is
        NO → Full commitment — stack choice is clear and team is skilled

---

## Rationale

Incremental adoption lets the team learn the stack with low-risk components. Full commitment is faster for experienced teams and greenfield projects. For Livewire, incremental means adding `wire:model` to a Blade form. For Inertia, incremental means adding `Inertia::render()` for new pages while keeping existing Blade views.

---

## Recommended Default

**Default:** Full commitment for experienced teams on greenfield projects. Incremental adoption for teams learning a new stack or for mixed-technology codebases.
**Reason:** Full commitment avoids the "hybrid maintenance" tax. Incremental adoption reduces learning risk. Default to full commitment when the team knows the stack; default to incremental when learning.

---

## Risks Of Wrong Choice

* Full commitment by inexperienced team: Poor architecture decisions baked in from the start
* Incremental for experienced team: Never fully adopts the pattern — stale Blade pages coexist indefinitely
* Incremental without endpoint: "We'll adopt it when we need it" — never happens, stack never used
* Full commitment without validation: Wrong stack chosen — committed before knowing if it fits

---

## Related Rules

* Match Stack to Team Skills

---

## Related Skills

* Evaluate and Select Frontend Stack
