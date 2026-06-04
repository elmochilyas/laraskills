---
Domain: Async & Distributed Systems
Subdomain: Async Dispatch Patterns
Knowledge Unit: K063 — dispatchIf/dispatchUnless Conditional Dispatch
Knowledge ID: K063
Last Updated: 2026-06-03
---

# Anti-Patterns

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Risk Severity |
|---|---|---|---|
| 1 | Chaining on Null Return | Implementation | Medium |
| 2 | Nested dispatchIf Calls | Implementation | Low |
| 3 | Condition Inside Closure Duplicates Worker Logic | Architecture | Medium |
| 4 | Using dispatchUnless with Negated Conditions | Implementation | Low |
| 5 | Silent Skip Without Audit — Condition Always False | Operations | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Domain Relevance | Mitigation |
|---|---|---|
| Null Method Call from Chaining | Medium — runtime error on false condition | Guard with `optional()` or variable assignment |
| Duplicate Condition Logic | Medium — two sources of truth for same check | Keep condition at dispatch time or in job, not both |
| Silent Dispatch Skip | Medium — condition always false, no one notices | Log skips, monitor expected dispatch counts |

---

## 1. Chaining on Null Return

### Category
Implementation

### Description
Chaining method calls on the return value of `dispatchIf`/`dispatchUnless` without guarding against `null`. When the condition is false, these methods return `null` instead of a `PendingDispatch` — chaining on null causes a `Call to a member function on null` error at runtime.

### Why It Happens
- Not reading the return type (conditionally `PendingDispatch|null`)
- Assuming dispatch always succeeds and returns a valid object
- Copying chaining patterns from unconditional `dispatch()` (which always returns `PendingDispatch`)
- Not testing the false-condition branch
- "It works when the condition is true" — not testing both branches

### Warning Signs
- `Bus::dispatchIf(false, $job)->onQueue('high')` in codebase
- No null guard or `optional()` wrapper
- Runtime error: "Call to a member function onQueue() on null"
- Error occurs only when condition is false — may be rare in production
- Tests only cover the true-branch of the condition

### Why Harmful
`Bus::dispatchIf(false, $job)->onQueue('high')` throws a `Call to a member function onQueue() on null` error when the condition is false. This is a runtime error that crashes the current request — the user sees a 500 error. The dispatch was intentionally skipped, but the chaining code assumed it always returned a valid object. The error is only visible when the condition evaluates to false, making it potentially rare and hard to reproduce.

### Consequences
- 500 error when condition is false (user-facing crash)
- Chaining code path crashes even though the dispatch was correctly skipped
- Production incidents from something that should be a no-op
- Intermittent errors: "sometimes the page crashes" — depends on condition
- On-call investigation: "why is this page crashing?" — chaining on null

### Alternative
- Never chain directly on `dispatchIf`/`dispatchUnless` return value
- Safe patterns:
  ```php
  // Use optional()
  optional(Bus::dispatchIf($condition, $job))?->onQueue('high');
  
  // Assign to variable, check for null
  $pending = Bus::dispatchIf($condition, $job);
  if ($pending) {
      $pending->onQueue('high');
  }
  ```
- Or use traditional if/else when additional configuration is needed:
  ```php
  if ($condition) {
      $job->onQueue('high')->dispatch();
  }
  ```

### Refactoring Strategy
1. Audit all `dispatchIf`/`dispatchUnless` usages for chaining
2. Add `optional()` guard or variable assignment with null check
3. Test both true and false branches
4. Consider refactoring to traditional if/else if chain is complex
5. Add code review rule: chaining on `dispatchIf`/`dispatchUnless` must guard null

### Detection Checklist
- [ ] No direct chaining on `dispatchIf`/`dispatchUnless` return value
- [ ] `optional()` or null check used when chaining
- [ ] Both true and false branches tested
- [ ] No runtime null method call errors from dispatch conditions
- [ ] Code review flags unguarded chaining

### Related Rules
- prefer-dispatchIf-over-manual-guards

### Related Skills
- Use `dispatchIf`/`dispatchUnless` for Conditional Dispatch

### Related Decision Trees
- dispatchIf/dispatchUnless vs Conditional Block

---

## 2. Nested dispatchIf Calls

### Category
Implementation

### Description
Nesting `dispatchIf` calls inside each other: `Bus::dispatchIf(Bus::dispatchIf($a, $job1), $job2)`. This obscures intent, makes the condition evaluation order unclear, and creates confusing code that is hard to read and maintain.

### Why It Happens
- Trying to be clever with one-liners
- Not realizing the condition parameter of `dispatchIf` is eagerly evaluated
- Combining multiple conditions without extracting them
- Copy-pasting pattern without considering readability
- Code golf: minimizing line count at the expense of clarity

### Warning Signs
- `dispatchIf` call inside the condition parameter of another `dispatchIf`
- Multiple nested conditional dispatches in a single expression
- Code review requires minutes to understand the dispatch logic
- Line is too long or complex to read at a glance
- No extraction of conditions into named variables

### Why Harmful
`Bus::dispatchIf(Bus::dispatchIf($a, $job1), $job2)` — when `$a` is true, `$job1` is dispatched and the return value (`PendingDispatch` or null) is passed as the condition for the outer `dispatchIf`. A `PendingDispatch` is truthy, so `$job2` will likely dispatch. But the intent is completely obscured: does the developer mean both jobs dispatch when `$a` is true? Or is there a dependency? The nested call creates ambiguity that a simple `if` block or combined boolean expression would make clear.

### Consequences
- Code is difficult to read and understand
- Condition evaluation order is non-obvious
- Bugs introduced during maintenance (wrong nesting level)
- Code review takes longer (trying to decipher intent)
- Junior developers misunderstand the pattern and propagate confusion

### Alternative
- Extract conditions into a single boolean expression:
  ```php
  // BAD — nested, unclear
  Bus::dispatchIf(Bus::dispatchIf($a, $job1), $job2);
  
  // GOOD — clear intent
  if ($a) {
      $job1->dispatch();
      $job2->dispatch();
  }
  
  // Or combine conditions with AND/OR
  Bus::dispatchIf($a && $b, $job2);
  ```

### Refactoring Strategy
1. Find all nested `dispatchIf` calls
2. Extract the nested logic into a clear boolean expression or if/else block
3. Test that the behavior is identical to the original
4. Add code review rule: no nested `dispatchIf` calls
5. Document the preferred pattern in team conventions

### Detection Checklist
- [ ] No nested `dispatchIf`/`dispatchUnless` calls
- [ ] Conditions extracted into clear boolean expressions
- [ ] Traditional if/else used for complex conditional dispatch
- [ ] Code is readable at a glance
- [ ] No nesting of conditional dispatch methods

### Related Rules
- prefer-dispatchIf-over-manual-guards

### Related Skills
- Use `dispatchIf`/`dispatchUnless` for Conditional Dispatch

### Related Decision Trees
- dispatchIf/dispatchUnless vs Conditional Block

---

## 3. Condition Inside Closure Duplicates Worker Logic

### Category
Architecture

### Description
Checking the same state at dispatch time (via `dispatchIf` condition) and again inside the job's `handle()` method. This duplicates logic across two contexts (dispatch and execution), creating two sources of truth that can drift apart.

### Why It Happens
- Developer adds a condition at dispatch time "just to be safe"
- The job itself also validates the condition (belt and suspenders)
- Not coordinating between dispatch-time and execution-time checks
- Adding dispatch-time conditions after the job was already written
- Multiple developers touching different parts of the same pipeline

### Warning Signs
- Same condition check appears in both the dispatch call site and the job's `handle()` method
- `dispatchIf($condition, $job)` and inside the job: `if (!$condition) { return; }`
- Refactoring the condition requires updating two places
- Tests for the dispatch condition and the job's internal check are out of sync
- Condition logic drifts: dispatch checks one thing, job checks another

### Why Harmful
The dispatch condition checks `$user->isSubscribed()`, and the job's `handle()` also checks `$this->user->isSubscribed()`. A developer updates the job to check `$user->isSubscribed() && !$user->isOnTrial()` but forgets to update the dispatch condition. Now jobs are dispatched when `$user->isSubscribed()` is true, but the job returns early when the user is on trial. Workers process jobs that immediately return — wasting queue capacity. The two checks are out of sync, and the dispatch-time check becomes pointless.

### Consequences
- Wasted queue capacity: jobs dispatched but immediately return in `handle()`
- Logic duplication: two places to update when the condition changes
- Condition drift: dispatch-time and execution-time checks diverge
- Confusing behavior: "the job shouldn't have been dispatched" vs "the job handled the condition"
- Maintenance overhead: updating one check but forgetting the other

### Alternative
- Choose ONE place for the condition:
  - **Dispatch time:** Use `dispatchIf` and REMOVE the check from `handle()` (preferred for preventing queue waste)
  - **Execution time:** Remove `dispatchIf`, dispatch unconditionally, check inside `handle()` (preferred for worker-side decisions)
- Document the decision: "this condition is enforced at dispatch time only; the job assumes it passed"

### Refactoring Strategy
1. Audit all jobs dispatched via `dispatchIf` — check if condition is duplicated in `handle()`
2. Remove the duplicate check from one place
3. If the condition must be checked at both times (rare): extract to a shared method
4. Test that removing the duplicate doesn't change behavior
5. Document the enforcement point (dispatch or execution)

### Detection Checklist
- [ ] No condition duplicated between `dispatchIf` and job `handle()`
- [ ] Condition enforcement point is documented
- [ ] Dispatch-time conditions prevent queue waste
- [ ] Execution-time conditions handle worker-side state changes
- [ ] No wasted queue capacity from early-return jobs

### Related Rules
- evaluate-condition-in-caller-process

### Related Skills
- Use `dispatchIf`/`dispatchUnless` for Conditional Dispatch

### Related Decision Trees
- dispatchIf/dispatchUnless vs Conditional Block

---

## 4. Using dispatchUnless with Negated Conditions

### Category
Implementation

### Description
Using `dispatchUnless` with an already-negated condition: `dispatchUnless(!$condition, $job)`. This creates a double negative that is cognitively harder to parse than the equivalent `dispatchIf($condition, $job)`.

### Why It Happens
- Not recognizing the double negative
- Habitually writing conditions in one form (negative) without considering inversion
- Refactoring a condition without updating the dispatch method
- Copying a pattern that used `dispatchUnless` without adjusting for the condition
- No code review catches the double negative

### Warning Signs
- `Bus::dispatchUnless(!$condition, $job)` pattern in codebase
- Confusion during code review: "wait, this dispatches when the condition is true or false?"
- Developer has to mentally negate twice to understand the dispatch
- Inconsistent usage: some conditions use `dispatchIf`, others use `dispatchUnless` with negation
- Cognitive load: "unless not subscribed = if subscribed" requires a mental double flip

### Why Harmful
A developer reads `dispatchUnless(!$user->isSubscribed(), $job)` and has to mentally negate twice: "unless not subscribed" → "if subscribed." This cognitive overhead slows down code review and increases the chance of misreading during maintenance. The code is functionally correct but unnecessarily complex. The simpler `dispatchIf($user->isSubscribed(), $job)` expresses the same intent without the double negative.

### Consequences
- Slower code comprehension (double negation)
- Increased chance of misreading during maintenance
- Inconsistent codebase: mixed `dispatchIf` and `dispatchUnless` styles
- Code review arguments: "is this a bug or intentional?"
- Refactoring difficulty: easier to create bugs when changing negated conditions

### Alternative
- Use `dispatchIf` for positive conditions:
  ```php
  // BAD — double negation
  SendWelcomeMail::dispatchUnless(!$user->isSubscribed(), $user);
  
  // GOOD — positive condition
  SendWelcomeMail::dispatchIf($user->isSubscribed(), $user);
  ```
- Only use `dispatchUnless` for naturally negative conditions:
  ```php
  // Good use of dispatchUnless
  SendNotification::dispatchUnless($user->isBanned(), $user);
  ```

### Refactoring Strategy
1. Find all `dispatchUnless` usages with negated conditions
2. Replace with `dispatchIf` and the positive form of the condition
3. Simplify: `dispatchUnless(!$cond)` → `dispatchIf($cond)`
4. Add code review rule: no negated conditions with `dispatchUnless`
5. Document that `dispatchUnless` should only be used for naturally negative conditions

### Detection Checklist
- [ ] No `dispatchUnless` with negated conditions
- [ ] `dispatchUnless` used only for naturally negative conditions
- [ ] `dispatchIf` preferred for positive conditions
- [ ] Double negatives absent from conditional dispatch code
- [ ] Conditions are readable at a glance

### Related Rules
- use-dispatchUnless-for-negative-logic

### Related Skills
- Use `dispatchIf`/`dispatchUnless` for Conditional Dispatch

### Related Decision Trees
- dispatchIf/dispatchUnless vs Conditional Block

---

## 5. Silent Skip Without Audit — Condition Always False

### Category
Operations

### Description
Using `dispatchIf` with a condition that is always false in production (e.g., a misconfigured feature flag, incorrect environment check) without any logging. The job never dispatches, but no error is raised — the condition failure is completely silent.

### Why It Happens
- `dispatchIf` returning null is considered a normal code path
- Not adding logging for the skipped case
- Feature flags that are misconfigured (enabled in dev, disabled in production)
- Environment checks that work in development but fail in production
- Not monitoring expected dispatch counts

### Warning Signs
- A job expected to run hasn't been dispatching for days/weeks
- Condition uses a feature flag that is configured differently in production
- No logging when the condition is false
- Monitoring shows zero dispatches for a job that should run regularly
- "The job isn't running" — investigation reveals the condition is always false

### Why Harmful
A feature flag `email-notifications` is enabled in development and staging but not set in production (defaults to false). `Bus::dispatchIf(Feature::active('email-notifications'), new SendWelcomeEmail($user))` — in production, the condition is always false. Welcome emails are never sent, but no one notices because:
1. No error (the condition is intentionally gated)
2. No logging (the skip is silent)
3. Welcome emails are typically a background process (not directly visible)
Users don't receive welcome emails for months before someone investigates.

### Consequences
- Jobs silently stop dispatching for extended periods
- Feature flag misconfiguration goes undetected
- Business impact: welcome emails, notifications, reports not sent
- Debugging delay: "the feature is enabled" but it's not (inconsistency between environments)
- Trust in feature flags erodes: "I enabled it, why isn't it working?"

### Alternative
- Log when a dispatch is skipped:
  ```php
  Bus::dispatchIf(
      $condition || tap(false, fn() => Log::info('dispatch skipped', compact('condition'))),
      $job
  );
  ```
- Or add logging before the dispatch:
  ```php
  if (!$condition) {
      Log::info('Skipping SendWelcomeEmail: feature flag disabled');
  }
  Bus::dispatchIf($condition, $job);
  ```
- Monitor expected dispatch counts: alert if count drops below expected threshold

### Refactoring Strategy
1. Audit `dispatchIf`/`dispatchUnless` calls with conditions that may be false in production
2. Add logging for unexpected skips (especially feature flags, environment checks)
3. Set up monitoring: expected dispatch counts per job type
4. Alert on significant drops in dispatch volume
5. Document all feature flag dependencies for conditional dispatches

### Detection Checklist
- [ ] Unexpected dispatch skips are logged
- [ ] Feature flag misconfiguration would be detected
- [ ] Expected dispatch counts monitored
- [ ] Alert on significant drop in dispatch volume
- [ ] Conditional dispatch logic is observable (not silent)
- [ ] Feature flag configuration is verified across environments

### Related Rules
- avoid-side-effects-in-condition

### Related Skills
- Use `dispatchIf`/`dispatchUnless` for Conditional Dispatch

### Related Decision Trees
- dispatchIf/dispatchUnless vs Conditional Block
