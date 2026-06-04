# Observer Anti-Patterns — Decomposition

## Implementation Tasks

### 1. Audit existing observers for anti-patterns
- Review all observers in the codebase for:
  - Synchronous external API calls
  - Complex business logic
  - Request state dependencies (`request()`, `auth()`)
  - Stateful properties
  - Silent try-catch blocks
  - Heavy synchronous computations
- Log findings per anti-pattern category

### 2. Refactor god observers into focused observers
- Identify observers handling >1 concern
- Split into single-concern observers: audit, cache, search, notification
- Ensure each new observer has a single responsibility

### 3. Move synchronous external calls to queue
- Identify all observer methods making HTTP requests, sending emails, or calling external APIs
- Replace synchronous calls with queued job dispatches
- Add `ShouldQueue` to the job for async processing

### 4. Remove request-context dependencies
- Refactor observers that use `request()`, `auth()->user()`, or `session()`
- Pass required context as explicit parameters via model properties or service calls
- Test observers from queue workers (no request context available)

### 5. Add observer monitoring and logging
- Implement observer execution logging (entry, exit, duration, errors)
- Create a kill-switch config for disabling observers in emergencies:
  ```php
  // config/observers.php
  return [
      'kill_switch' => env('OBSERVER_KILL_SWITCH', false),
      'disabled' => explode(',', env('DISABLED_OBSERVERS', '')),
  ];
  ```

### 6. Add static analysis rules
- Create PHPStan/Psalm rules to detect:
  - `request()` calls inside observer methods
  - HTTP client calls in observer methods
  - Stateful properties on observer classes
  - Silent try-catch blocks

### 7. Write observer anti-pattern tests
- Test that observers do not make HTTP calls synchronously
- Test that observers do not depend on request context
- Test that silent catch blocks are logged
- Test that kill-switch correctly suppresses observer execution

## Validation Criteria
- [ ] All existing observers audited against anti-pattern list
- [ ] God observers split into single-concern classes
- [ ] No synchronous external API calls in observer methods
- [ ] No `request()` or `auth()` calls in observers
- [ ] Observer execution is logged (entry, exit, duration)
- [ ] Kill-switch mechanism works and is documented
- [ ] Static analysis detects anti-pattern violations
- [ ] Tests verify no anti-patterns are reintroduced
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization