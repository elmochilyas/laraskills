# Service Binding Audit

## Metadata
- **ID:** ku-08-octane-di-container
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Overview
Migrating a Laravel application to Octane requires a systematic audit of every service container binding to determine whether it is safe for long-running processes. A service binding audit evaluates each binding for state safety, identifies singletons that should be scoped, and establishes a governance process to prevent new unsafe bindings from being introduced. This KU provides the methodology, tooling, and checklist for conducting this audit.

## Core Concepts
- **Binding Classification**: Every binding is: **Safe Singleton** (stateless or immutable), **Unsafe Singleton** (mutable state that leaks), or **Safe Transient** (new instance per resolve).
- **State Safety Definition**: A binding is state-safe if the resolved instance does not hold any data that changes between requests and could affect subsequent request behavior.
- **Audit Scope**: Only `singleton()`, `scoped()`, and `instance()` bindings require evaluation. Transient bindings (`bind()`, `bindIf()`) produce new instances — safe by construction.
- **Audit Artifacts**: Produces a **binding inventory**, a **risk matrix** (safe/unsafe/needs-review), and a **remediation plan**.
- **Transitive Contamination**: A safe singleton depending on an unsafe singleton is itself unsafe. The audit must trace the full dependency graph.

## When To Use
- **Pre-Octane deployment**: Mandatory before migrating any Laravel app to Octane.
- **Post-audit maintenance**: Run delta audits (changed providers only) in CI on every PR.
- **Third-party package evaluation**: Before adding new packages in an Octane deployment.
- **Queue worker optimization**: Apply audit findings to queue workers (same leak patterns apply).
- **New project initialization**: Establish binding safety patterns from project start.

## When NOT To Use
- **PHP-FPM only projects**: No persistent process — state is always fresh per request. Audit unnecessary.
- **Transient binding analysis**: `bind()` creates new instances — inherently safe. Don't waste effort.
- **Single-service applications**: Minimal bindings; audit is trivial.

## Best Practices (WHY)
- **Automate binding inventory generation**: Write an artisan command that dumps all registered bindings with their type and shared status. *Why: Manual enumeration is error-prone; automated inventory catches bindings you didn't know existed (especially from packages).*
- **Trace the dependency graph**: A safe-looking binding can be contaminated by its dependencies. Resolve each singleton and inspect its object graph. *Why: Transitive contamination is the most common audit miss — a singleton that depends on a leaking singleton inherits the leak.*
- **Add CI binding lint**: Scan PR diffs for new `singleton()` registrations and flag for human review. *Why: Without CI enforcement, new unsafe bindings creep in within weeks. Continuous governance is essential.*
- **Score and prioritize by risk**: Auth, session, multi-tenant, and locale bindings are highest risk. Start there. *Why: High-risk bindings have the most severe impact — data leaks and auth spoofing. Prioritize fixes by impact, not ease.*

## Architecture Guidelines
- **Audit is manual with tooling assistance**: Full automated analysis of state safety is impossible (halting problem for closures).
- **Focus on shared bindings**: Non-shared bindings are always safe; auditing them wastes effort.
- **Dependency graph analysis is critical**: A safe-looking binding can be contaminated by its dependencies.
- **CI enforcement prevents regression**: Without CI gate, new unsafe bindings creep in within weeks.

## Performance
- **Audit has no runtime cost**: It's a design-time activity conducted before deployment.
- **Remediation adds per-request cost**: Converting singletons to scoped adds ~0.5-2ms per binding per request. Prioritize — fix the leaky ones, don't blindly convert all.
- **Dependency graph caching**: Store the graph to avoid rebuilding from scratch on delta audits.

## Security
- **False negative audit**: A binding that seems safe (no direct mutable state) has a dependency that stores per-request data in a static property. The dependency analysis misses it because the static is set externally.
- **Audit drift**: 6 months and 200 commits later, the initial audit is outdated. New unsafe bindings exist but no one has re-audited.
- **Over-correction**: Converting every singleton to scoped — breaks lazy-loaded singletons that need persistence (connection pools) and introduces new bugs.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Auditing only application code | Ignoring vendor packages | Package bindings can leak | Include all registered providers, including vendor |
| Assuming safe = "doesn't store user data" | Any mutable data causes behavioral differences | Timestamps, counters, request metadata all cause leaks | Any mutable state in a singleton is suspect |
| Not re-auditing after package updates | Package update can introduce new singleton bindings | Regression undetected | Run delta audit in CI on dependency changes |
| Confusing state safety with thread safety | Thread safety ≠ state safety | A state-safe binding may be thread-unsafe | Separate audit for coroutine safety |

## Anti-Patterns
- **One-time audit with no follow-up**: The initial audit is thorough, but 6 months later it's worthless. Continuous auditing is required.
- **Blind mass conversion**: Converting every singleton to scoped "to be safe." Adds unnecessary overhead; breaks services that need persistence.
- **Ignoring transitive dependencies**: Only auditing direct bindings without tracing their dependency graph. Transitive leaks are common.
- **Skipping package audit**: Assuming all packages are Octane-safe because they're popular.

## Examples

```php
// Artisan command for binding inventory
php artisan audit:bindings
+----------------------------+---------+--------+--------+
| Binding                    | Type    | Shared | Risk   |
+----------------------------+---------+--------+--------+
| App\Services\PaymentGateway | singleton | Yes  | 🔴     |
| App\Services\LogService     | bind    | No    | 🟢     |
| App\Services\CurrentTeam    | scoped  | Yes   | 🟡     |
+----------------------------+---------+--------+--------+

// CI binding lint (pseudo-code)
// Check: new singleton() added? Flag for review
// Check: singleton depends on another singleton with mutable state? Flag
// Check: any binding in known-unsafe list? Block merge

// Remediation plan entry
// Binding: App\Services\PaymentGateway
// Risk: 🔴 (stores API token per merchant)
// Fix: Convert to scoped
// Priority: High — affects payment processing
```

## Related Topics
- **Singleton State Leaks**: What the audit detects.
- **Scoped Bindings for Octane**: Primary remediation strategy.
- **Static Property Accumulation**: Audit must include static analysis.
- **Octane Architecture Overview**: Context for why audit matters.
- **Octane Package Compatibility**: Audit methodology for packages.

## AI Agent Notes
- Automated state leak detection is an active research area. PHP doesn't have ownership types or borrow checking.
- Xdebug's `xdebug_start_trace()` can capture function calls, but the volume of data from a full request trace is enormous (~100k+ calls). Filtering to binding-mutation calls requires post-processing.
- Laravel's container provides `extend()` callbacks that wrap existing bindings. An audit could use `extend()` to attach proxy objects that track mutations — but this changes behavior and has performance cost.
- Research question: Could the container be patched to track dirty-flag on singletons and warn on cross-request mutation? A community package `container-dirty-check` exists as a proof of concept.
- The ideal audit tool would combine static analysis with dynamic analysis (capture state diffs between two identical requests in the same worker). No comprehensive tool exists today.

## Verification
- [ ] Run binding inventory command — list all registered bindings with type and shared status
- [ ] For each singleton, trace its constructor dependencies
- [ ] Identify any dependency that holds mutable per-request state
- [ ] Score each unsafe binding by risk (data sensitivity, leak frequency, fix difficulty)
- [ ] Create remediation plan — prioritize high-risk bindings first
- [ ] Add CI lint rule for new singleton registrations
- [ ] Re-audit after 3 months — verify no new unsafe bindings were introduced
