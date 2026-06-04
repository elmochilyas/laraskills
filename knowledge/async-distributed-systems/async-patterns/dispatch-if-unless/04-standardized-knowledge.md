# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Async Dispatch Patterns
- **Knowledge Unit:** K063 — dispatchIf/dispatchUnless Conditional Dispatch
- **Knowledge ID:** K063
- **Difficulty Level:** Foundation
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queue: Dispatching Jobs
  - Laravel Source — `Illuminate\Bus\Bus`

---

# Overview

`dispatchIf` and `dispatchUnless` are conditional dispatch methods on the `Bus` facade and `PendingDispatch` that gate job execution on a boolean condition evaluated at dispatch time. They eliminate if/else boilerplate in controllers and commands, making intent explicit. The condition is evaluated synchronously before the job is pushed to the queue — no runtime evaluation inside the worker.

---

# Core Concepts

- **dispatchIf($condition, $job):** Dispatches the job only when `$condition` is truthy. Returns a `PendingDispatch` or null.
- **dispatchUnless($condition, $job):** Dispatches the job only when `$condition` is falsy. Inverse of `dispatchIf`.
- **Eager condition evaluation:** The condition is evaluated immediately in the calling process. The queue worker receives the job or not — it has no knowledge of the condition.
- **Null return:** When the condition fails, `dispatchIf`/`dispatchUnless` return null instead of a `PendingDispatch`, which can break method chaining.
- **Closure conditions:** `$condition` can be a callable for lazy evaluation, useful when the check involves an expensive computation or external state.
- **Chain-scoped gating:** For `Bus::chain()->dispatchIf()`, the condition gates the entire chain, not individual jobs.

---

# When To Use

- Feature flag gating — dispatch jobs only when a feature toggle is active
- Role-based dispatch — send notifications only to opted-in users
- Environment-based dispatch — skip jobs in non-production environments
- Any conditional dispatch where the condition is known at dispatch time
- Eliminating simple if/else blocks where the alternative is a one-liner

---

# When NOT To Use

- Conditions that involve database state that may change before the worker runs — evaluate inside the job instead
- Complex multi-condition logic — a helper method or middleware is more readable
- When the result of dispatch is needed for further chaining — guard against null with `optional()` or a fallback
- Conditions that require re-evaluation at job execution time on the worker

---

# Best Practices

- **Guarantee against null returns when chaining.** `Bus::dispatchIf(false, $job)->onQueue('high')` throws a null method call error. Use `optional()` or assign to a variable with a null check.
- **Prefer `dispatchIf(!$condition)` over `dispatchUnless($condition)`.** Inversion adds cognitive overhead. The non-negated form is consistently clearer.
- **Use explicit comparisons (`$condition === true`) over truthy checks.** Empty strings, zero, empty arrays, and null are all falsy. Implicit truthiness can cause unexpected skips.
- **Log dispatch skips when the skip is unexpected.** `dispatchIf` returning null is silent. Add explicit logging when the condition fails in production to detect configuration drift or logic errors.
- **Avoid expensive condition computations at dispatch time.** Use closure-based conditions, but understand the closure still runs synchronously in the HTTP request.

---

# Architecture Guidelines

- `dispatchIf`/`dispatchUnless` are syntactic sugar for the dispatch site only. They do not affect worker behavior, monitoring, or observability.
- When combined with `afterCommit`, the condition is evaluated before the transaction check — the condition gates dispatch, and `afterCommit` gates whether the dispatch is deferred until commit. This ordering can cause the condition to be evaluated against uncommitted data.
- For conditions that require fresh worker-side state, move the condition into job middleware or the job's `handle()` method. The dispatch-site condition is a one-time snapshot.
- Return-type consistency matters — if the caller chains on the dispatch result, provide a null-safe chain or refactor to traditional if/else.

---

# Performance Considerations

- Zero overhead when condition is false — no serialization, no queue push, no Redis/DB write.
- Closure conditions add marginal overhead compared to inline boolean checks — negligible unless the closure performs DB/API calls.
- No impact on queue worker performance — the condition is sandboxed entirely in the dispatch process.

---

# Security Considerations

- The condition is evaluated in the caller's security context — ensure authorization checks are performed before the dispatch call.
- Do not pass sensitive condition results (e.g., user roles, permissions) into the condition closure in a way that leaks them through stack traces or logs.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Chaining on null return | `Bus::dispatchIf(false, $job)->onQueue(...)` | Null method call error at runtime | Guard with `optional()` or use traditional if/else |
| Assuming worker re-evaluation | Developer thinks the condition runs again on the worker | Job executes with stale condition data | Move condition inside the job or into middleware |
| Forgetting falsy edge cases | Implicit truthy check on values like 0 or "" | Job is mistakenly skipped | Use explicit comparison (`=== true`) |
| Silent skip without audit | Condition is always false but no logs | Job never dispatches with no observable error | Log dispatch skips, monitor expected dispatch counts |

---

# Anti-Patterns

- **Nested `dispatchIf` calls:** `Bus::dispatchIf(Bus::dispatchIf($a, $job1), $job2)` obscures intent. Combine conditions into a single boolean expression.
- **Condition inside condition closure that duplicates worker logic:** Checking the same state at dispatch time and again inside the job. Duplicates logic and creates two sources of truth.
- **Using `dispatchUnless` with negated conditions:** `dispatchUnless(!$condition, $job)` is a double negative. Use `dispatchIf($condition, $job)` instead.

---

# Examples

```php
// Feature flag gating
Bus::dispatchIf(Feature::active('email-notifications'), new SendWelcomeEmail($user));

// Role-based dispatch with closure condition
Bus::dispatchIf(fn () => $user->hasOptedIn('marketing'), new SendMarketingEmail($user));

// Environment-based skip
Bus::dispatchUnless(app()->isProduction(), new SeedTestData());

// Safe chaining with null guard
$pending = Bus::dispatchIf($condition, $job);
optional($pending)?->onQueue('high');

// Traditional alternative for complex conditions
if ($user->isSubscribed() && !$user->isOnTrial() && $user->locale === 'en') {
    SendRenewalNotice::dispatch($user);
}
```

---

# Related Topics

- **K062 dispatchAfterResponse (K062)** — Post-response execution alternative
- **K064 afterCommit transactional safety (K064)** — Transactional dispatch timing interaction with conditions
- **K065 Defer pattern (K065)** — Laravel 12 post-response grouping alternative

---

# AI Agent Notes

- `dispatchIf` and `dispatchUnless` return null on false conditions. When generating chained dispatch code, always guard the chain or assign to a variable with null handling.
- The condition is evaluated at dispatch time, not at execution time. If generating code where the condition depends on database state that may change before the worker runs, recommend moving the condition into the job's `handle()` method.
- When combining `dispatchIf` with `afterCommit`, be aware the condition is evaluated before the transaction commits. The condition may reference uncommitted data.

---

# Verification

- [ ] Condition correctly gates dispatch — verify job count in queue backend matches expected condition outcomes
- [ ] Chaining handles null return — confirm no null method call errors when condition is false
- [ ] Worker receives no condition context — verify job has no knowledge of the dispatch condition
- [ ] Closure conditions evaluated at dispatch time — confirm closure is not re-executed on the worker
- [ ] Combined with `afterCommit`, condition evaluated before commit — verify via logging timestamps
