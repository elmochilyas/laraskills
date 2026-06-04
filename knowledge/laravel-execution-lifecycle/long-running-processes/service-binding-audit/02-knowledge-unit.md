# Service Binding Audit

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Executive Summary
Migrating a Laravel application to Octane requires a systematic audit of every service container binding to determine whether it is safe for long-running processes. A service binding audit evaluates each binding for state safety, identifies singletons that should be scoped, and establishes a governance process to prevent new unsafe bindings from being introduced. This KU provides the methodology, tooling, and checklist for conducting this audit.

## Core Concepts
- **Binding Classification:** Every binding falls into one of three categories: **Safe Singleton** (stateless or immutable state), **Unsafe Singleton** (mutable state that leaks across requests), and **Safe Transient** (new instance per resolution, inherently safe).
- **State Safety Definition:** A binding is state-safe if the resolved instance does not hold any data that changes between requests and could affect the behavior of subsequent requests. Immutable configuration data is safe. An authenticated user is not.
- **Audit Scope:** Not all bindings need auditing. Transient bindings (`bind()`, `bindIf()`) produce new instances and are safe by construction. Only `singleton()`, `scoped()`, and `instance()` bindings require evaluation.
- **Audit Artifacts:** The audit produces a **binding inventory** (all registrations), a **risk matrix** (safe/unsafe/needs-review per binding), and a **remediation plan** (migrations to scoped, wrappers, or stateless redesigns).

## Mental Models
- **"The Security Gate":** Each binding must pass through a security gate before being approved for production. Singletons get extra scrutiny. The gate asks: "Does this instance hold any per-request data?"
- **"The Labeling System":** Every binding gets a label: 🟢 Safe Singleton, 🟡 Scoped (intentionally per-request), 🔴 Unsafe Singleton (needs fix), ⚪ Transient (no review needed).
- **"The Family Tree":** Trace each binding's dependencies. A safe singleton that depends on a leaking singleton is itself unsafe. The audit must be a graph traversal, not a flat scan.

## Internal Mechanics
1. **Inventory Generation:** Use reflection to iterate all registered service providers. Extract each `register()` method and log every call to `$this->app->singleton()`, `$this->app->bind()`, `$this->app->scoped()`, `$this->app->instance()`.
2. **Binding Resolution Analysis:** For each singleton, determine what it resolves to (class name or closure). If it's a class, reflect on its constructor dependencies, properties (especially public/protected), and methods that mutate state.
3. **State Flow Tracking:** Trace how state flows into and out of the binding. Does the binding accept mutable data (Eloquent model, request input, user object)? Does it expose methods that mutate internal properties?
4. **Dependency Graph Construction:** Build a directed graph: binding A → depends-on → binding B. Walk the graph. If any dependency is an unsafe singleton, the parent is also unsafe (transitive contamination).
5. **Remediation Prioritization:** Score each unsafe binding by: (a) data sensitivity (auth, session = high; cache = medium; config = critical), (b) leak frequency (every request vs rare code paths), (c) fix difficulty.

## Patterns
- **Provider Audit Script:** Write a custom artisan command that dumps all bindings with their type:
  ```
  php artisan audit:bindings --table
  +----------------------------+----------+--------------+--------+
  | Binding                    | Type     | Shared       | Risk   |
  +----------------------------+----------+--------------+--------+
  | App\Services\PaymentGateway | singleton| Yes          | 🔴     |
  | App\Services\LogService     | bind     | No           | 🟢     |
  | App\Services\CurrentTeam    | scoped   | Yes (scoped) | 🟡     |
  +----------------------------+----------+--------------+--------+
  ```
- **CI Binding Lint:** Add a CI step that scans for new `singleton()` registrations in PR diffs and flags them for human review. Only allow merge if the team lead signs off.
- **State Leak Blacklist:** Maintain a `config/octane-unsafe.php` list of services known to be unsafe. A CI step checks that none of these are registered as singletons.
- **Progressive Audit:** Start with high-risk bindings (auth, session, teams, multi-tenant). Then audit medium-risk (repositories, caches, API clients). Finally audit low-risk (helpers, utilities, formatters).

## Architectural Decisions
| Decision | Rationale |
|---|---|
| Audit is manual with tooling assistance | Full automated analysis of state safety is impossible (halting problem for closures) |
| Focus on shared bindings | Non-shared bindings are always safe; auditing them wastes effort |
| Dependency graph analysis is critical | A safe-looking binding can be contaminated by its dependencies |
| CI enforcement prevents regression | Without CI gate, new unsafe bindings creep in within weeks |

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Prevents data-leak production incidents | Full audit takes 2-5 days for medium apps | Must budget audit time before Octane migration |
| CI binding lint prevents regressions | CI false positives require human judgment | Team must develop binding safety intuition |
| Dependency graph catches transitive leaks | Graph construction is complex; requires tooling | Without tooling, transitive leaks go undetected |
| Risk scoring prioritizes fixes | Scoring criteria are subjective | Two engineers may rank the same binding differently |

## Performance Considerations
- The audit itself has no runtime performance cost — it's a design-time activity.
- Remediation (changing singletons to scoped) adds ~0.5-2ms per binding per request. The audit helps prioritize: fix the leaky bindings, but don't blindly convert all singletons to scoped.
- The dependency graph analysis may cache results; re-audit after significant code changes. Store the graph in a file to avoid rebuilding from scratch.

## Production Considerations
- Run the audit before every major Octane deployment. After the initial audit, run a delta audit (changed providers only) in CI.
- Maintain a **binding manifest file** (`storage/app/binding-manifest.json`) that records the audit status of every binding. The manifest is committed to the repository and diffed in PRs.
- Assign a "binding owner" for each external package. When a package updates, the owner re-audits its bindings.
- For third-party packages, audit is one-time per version. Document findings in the project wiki. Tag the package version and audit date.
- Include binding audit results in the deployment runbook. New team members should read the audit as part of onboarding.

## Common Mistakes
- Auditing only application code and ignoring vendor packages. Third-party packages register bindings that can leak. Run the audit script on the full registered provider list, including vendor providers.
- Assuming that a binding is safe because "it doesn't store user data." Storing any mutable data (timestamps, counters, request metadata) can cause observable behavioral differences between requests.
- Not re-auditing after upgrading packages. A package update can introduce new singleton bindings or change existing ones from transient to shared.
- Confusing "state safety" with "thread safety." A binding can be state-safe (no per-request data) but thread-unsafe (uses shared mutable state accessed from multiple coroutines). These are separate concerns.
- Only auditing the master container. Bindings registered in `OctaneSandbox` providers must be audited separately — they run per-request but may still leak if they use static properties.

## Failure Modes
- **False Positive Audit:** A binding is flagged as unsafe when it's actually safe (immutable value object). Developer wastes time investigating and may break working code by over-correcting.
- **False Negative Audit:** A binding that seems safe (no direct mutable state) has a dependency that stores per-request data in a static property. The dependency analysis missed it because the static is set externally.
- **Audit Drift:** The initial audit is thorough, but 6 months and 200 commits later, the audit is outdated. New unsafe bindings exist but no one has re-audited.
- **Over-Correction:** Faced with audit findings, the team converts *every* singleton to scoped "just to be safe." This adds unnecessary overhead, breaks lazy-loaded singletons that truly need persistence (e.g., connection pools), and introduces new bugs.

## Ecosystem Usage
- **Larastan / PHPStan:** Can detect some unsafe singleton patterns (mutating method calls on resolved services). Custom PHPStan rules can flag `singleton()` calls without corresponding Octane audit annotation.
- **Rector:** Can automate some remediation (converting `singleton()` to `scoped()` for known-safe cases). Rector rules exist for Octane compatibility.
- **Laravel Octane Checker:** Community package (`laravelcm/octane-checker`) that scans service providers and flags common Octane-unsafe patterns. Provides a CLI report.
- **Spatie Ray:** Not an audit tool, but can be used during audit development to dump binding fingerprints and compare state between requests.

## Related Knowledge Units
### Prerequisites
- singleton-state-leaks (what the audit detects)

### Related Topics
- scoped-bindings-for-octane (primary remediation strategy)
- static-property-accumulation (audit must include static analysis)
- octane-architecture-overview (context for why audit matters)

### Advanced Follow-up Topics
- octane-package-compatibility (audit methodology for packages)
- memory-profiling-and-observability (validating audit findings with profiling)
- octane-lifecycle-hooks (hooks for implementing audit remediation)

## Research Notes
- Automated state leak detection is an active research area. PHP doesn't have ownership types or borrow checking. Dynamic analysis (trace all writes to bound instances between requests) is the most reliable approach.
- Xdebug's `xdebug_start_trace()` can capture function calls, but the volume of data from a full request trace is enormous (~100k+ calls). Filtering to binding-mutation calls requires post-processing.
- Laravel's container provides `extend()` callbacks that wrap existing bindings. An audit could use `extend()` to attach proxy objects that track mutations — but this changes behavior and has performance cost.
- Research question: Could the container be patched to track dirty-flag on singletons and warn on cross-request mutation? A community package `container-dirty-check` exists as a proof of concept.
- The ideal audit tool would combine static analysis (reflection of provider registrations) with dynamic analysis (capture state diffs between two identical requests in the same worker). No comprehensive tool exists today.
