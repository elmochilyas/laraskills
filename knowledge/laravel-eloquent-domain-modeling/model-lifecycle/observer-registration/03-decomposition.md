# Observer Registration — Decomposition

## Implementation Tasks

### 1. Set up observer registration in service provider
- Create `App\Providers\ObserverServiceProvider` (or extend `EventServiceProvider`)
- Register all observers with `Model::observe()` in the `boot()` method:
  ```php
  public function boot(): void
  {
      User::observe([AuditObserver::class, CacheObserver::class]);
      Post::observe([AuditObserver::class, SearchObserver::class]);
      Order::observe([AuditObserver::class, NotificationObserver::class]);
  }
  ```

### 2. Implement environment-based observer registration
- Conditionally register observers based on environment:
  ```php
  if (! app()->environment('testing')) {
      User::observe(SearchObserver::class);
  }
  ```

### 3. Write tests for observer registration
- Test that observers fire when registered via `observe()`
- Test that observers fire when registered via `#[ObservedBy]` attribute
- Test that multiple observers on the same model all fire
- Test that observer registration respects environment conditions

### 4. Create observer registration audit command
- Implement `php artisan observer:list` that displays:
  - All registered observers per model
  - Registration method (`observe()` vs `#[ObservedBy]`)
  - Source file and line of registration

### 5. Decide and document registration strategy
- Choose between `#[ObservedBy]` and service provider registration (or a mix)
- Document the project convention with rationale
- Set up a CI check that validates consistent registration strategy across the codebase

## Validation Criteria
- [ ] `ObserverServiceProvider` registers all observers in one place
- [ ] Environment-based registration works correctly
- [ ] Tests verify observer fires on model lifecycle events
- [ ] `observer:list` command shows accurate registration info
- [ ] Registration strategy is documented and enforced
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization