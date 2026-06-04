# Service Binding Audit

## Rule Name
Generate an automated binding inventory before every audit.
---
## Category
Maintainability
---
## Rule
Always run an automated artisan command to dump all registered bindings with their type and shared status before starting a manual audit.
---
## Reason
Manual enumeration is error-prone and misses vendor-provided bindings. An automated inventory catches bindings you didn't know existed, especially from third-party packages.
---
## Bad Example
```php
// Manual audit — checked only AppServiceProvider, missed vendor bindings
```
---
## Good Example
```php
// Artisan command: php artisan audit:bindings
// Output:
// +----------------------------+---------+--------+
// | Binding                    | Type    | Shared |
// +----------------------------+---------+--------+
// | App\Services\PaymentGateway | singleton | Yes  |
// | Spatie\Permission\...       | singleton | Yes  |
// | App\Services\LogService     | bind    | No    |
```
---
## Exceptions
Trivial projects with fewer than 10 total bindings.
---
## Consequences Of Violation
Leaky vendor bindings go undetected; audit has false sense of completeness.

---

## Rule Name
Trace the full dependency graph, not just direct bindings.
---
## Category
Reliability
---
## Rule
Always trace the constructor dependency graph of every shared binding to verify all transitive dependencies are also safe.
---
## Reason
A safe-looking singleton can be contaminated by its dependencies. If a singleton resolves a second singleton that holds mutable per-request state, the first singleton inherits the leak. Transitive contamination is the most common audit miss.
---
## Bad Example
```php
// Audit: PaymentGateway singleton — looks safe (no direct state)
// Missed: PaymentGateway depends on AuthManager (singleton with state)
// Result: PaymentGateway leaks auth state between requests
```
---
## Good Example
```php
// Audit trace:
// PaymentGateway (singleton)
//   └─ requires AuthManager (singleton) ── UNSAFE (mutable auth state)
//       └─ requires UserProvider (singleton) ── UNSAFE (cached user)
//
// Fix: Convert AuthManager to scoped, or make PaymentGateway stateless
```
---
## Exceptions
Bindings whose dependencies are all immutable value objects with no per-request state.
---
## Consequences Of Violation
Leaky dependency causes undetected cross-request contamination despite correct classification of the direct binding.

---

## Rule Name
Classify bindings into three risk categories.
---
## Category
Maintainability
---
## Rule
Always classify every shared binding as Safe Singleton (stateless/immutable), Unsafe Singleton (mutable state), or Safe Transient (new instance per resolve).
---
## Reason
Clear classification produces a risk matrix that drives remediation priorities. Without classification, every binding looks the same and teams don't know where to focus.
---
## Bad Example
```php
// Undifferentiated list — no priority
// - App\Services\PaymentGateway
// - App\Services\LogService
// - App\Services\CurrentTeam
```
---
## Good Example
```php
// Risk matrix:
// 🟢 Safe Singleton: App\Services\ConfigReader (immutable)
// 🟡 Needs Review: App\Services\PaymentGateway (state depends on usage)
// 🔴 Unsafe: App\Services\CurrentTeam (mutable per-request state)
```
---
## Exceptions
No common exceptions — classification always adds value to the audit.
---
## Consequences Of Violation
Low-risk bindings consume as much audit attention as high-risk; critical leaks are deprioritized.

---

## Rule Name
Add CI lint rules for new singleton registrations.
---
## Category
Maintainability | Reliability
---
## Rule
Always add a CI step that scans PR diffs for new `singleton()` calls and flags them for human review.
---
## Reason
Without CI enforcement, new unsafe singletons creep into the codebase within weeks of an audit. Continuous governance is essential — every new singleton is a potential cross-request leak.
---
## Bad Example
```php
// No CI enforcement — new singleton added 2 weeks after audit
// Developer unaware of Octane implications
```
---
## Good Example
```php
// CI lint step (pseudo-code):
// 1. Diff PR against main
// 2. If diff contains '$this->app->singleton(' or '::class,'
//    or 'bindIf(.*shared: true'
//    → Block merge, require review
// 3. Require classification comment on new singleton
```
---
## Exceptions
No common exceptions. Every Octane project benefits from binding governance.
---
## Consequences Of Violation
Post-audit drift; new unsafe bindings silently introduced; audit becomes worthless within months.

---

## Rule Name
Score and prioritize remediation by risk impact.
---
## Category
Maintainability | Security
---
## Rule
Always prioritize fixing high-risk bindings (auth, session, multi-tenant, locale) before low-risk ones, regardless of fix difficulty.
---
## Reason
High-risk bindings have the most severe impact — data leaks and auth spoofing are security breaches. A difficult fix for a low-risk binding wastes time that could have prevented a production incident.
---
## Bad Example
```php
// Fixed all easy ones first (logging, formatting)
// Left auth and tenant bindings — where the real damage happens
```
---
## Good Example
```php
// Priority order:
// 1. 🔴 AuthManager — data leak risk: CRITICAL
// 2. 🔴 CurrentTenant — data leak risk: CRITICAL
// 3. 🟡 PaymentGateway — financial data risk: HIGH
// 4. 🟢 Logger — no state risk: LOW (skip)
```
---
## Exceptions
When a low-risk fix is trivially easy (one-line change) and a high-risk fix requires architecture changes. Do the easy fix too, but prioritize the high-risk.
---
## Consequences Of Violation
Critical security vulnerabilities remain unfixed while low-risk improvements ship; production incident from auth leak.

---

## Rule Name
Re-audit after every major package update or quarterly.
---
## Category
Maintainability | Reliability
---
## Rule
Always trigger a binding re-audit when any package updates its major version, or perform a full re-audit quarterly — whichever comes first.
---
## Reason
Package updates can introduce new singleton bindings, change existing ones from transient to shared, or add static property usage. Audit drift over 200+ commits makes the initial audit worthless.
---
## Bad Example
```php
// Audited once before Octane deployment — never again
// 6 months and 50 package updates later — audit is fully outdated
```
---
## Good Example
```php
// CI triggers audit on:
// - composer.lock changes (package version bumps)
// - schedule: quarterly full audit
// - PRs adding new service providers
```
---
## Exceptions
Projects with zero third-party package dependencies.
---
## Consequences Of Violation
Regression undetected for months; new binding leaks affect production long before the next manual audit.
